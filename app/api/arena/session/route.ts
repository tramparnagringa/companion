import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import { checkTokenBalance, recordTokenUsage } from '@/lib/anthropic/check-tokens'

type Round = 'HR Screening' | 'Behavioral' | 'Technical' | 'Offer Negotiation'
type Mode = 'guided' | 'pit'

interface ArenaProfile {
  target_role?: string | null
  seniority?: string | null
  tech_stack?: string[] | null
  years_experience?: number | null
  value_proposition?: string | null
  salary_min?: number | null
  salary_max?: number | null
  salary_currency?: string | null
}

const INTERVIEWERS: Record<Round, { name: string; title: string; company: string }> = {
  'HR Screening':      { name: 'Sarah Chen',    title: 'Senior Recruiter',         company: 'TNG Talent' },
  'Behavioral':        { name: 'Marcus Webb',   title: 'Engineering Manager',       company: 'TNG Talent' },
  'Technical':         { name: 'Priya Sharma',  title: 'Staff Engineer',            company: 'TNG Talent' },
  'Offer Negotiation': { name: 'James Torres',  title: 'Head of Talent Acquisition',company: 'TNG Talent' },
}

const QUESTION_COUNTS: Record<Round, number> = {
  'HR Screening': 5,
  'Behavioral': 6,
  'Technical': 5,
  'Offer Negotiation': 4,
}

function detectTechnicalFocus(targetRole: string): string {
  const role = targetRole.toLowerCase()
  if (/engineer|dev|developer|backend|frontend|mobile|data eng/.test(role)) return 'live coding and system design'
  if (/product|design|ux/.test(role)) return 'product case and design critique'
  if (/data|analytics|bi/.test(role)) return 'analytics case with SQL and metrics reasoning'
  return 'system thinking and open-ended problem solving'
}

function buildArenaSystemPrompt(round: Round, mode: Mode, profile: ArenaProfile): string {
  const iv = INTERVIEWERS[round]
  const qCount = QUESTION_COUNTS[round]
  const roleLine = profile.target_role ? `Target role: ${profile.target_role}` : ''
  const seniorityLine = profile.seniority ? `Seniority: ${profile.seniority}` : ''
  const stackLine = profile.tech_stack?.length ? `Tech stack: ${profile.tech_stack.join(', ')}` : ''
  const expLine = profile.years_experience ? `Years of experience: ${profile.years_experience}` : ''
  const salaryLine = profile.salary_min
    ? `Salary expectation on file: ${profile.salary_min}–${profile.salary_max} ${profile.salary_currency ?? 'USD'}`
    : ''

  const candidateContext = [roleLine, seniorityLine, stackLine, expLine, salaryLine]
    .filter(Boolean)
    .join('\n')

  const roundInstructions: Record<Round, string> = {
    'HR Screening': `You are conducting an HR screening call. Your goals:
- Understand the candidate's motivation for looking now ("why now")
- Assess cultural and role fit
- Clarify salary expectations — ask directly if not volunteered
- Ask why they are interested in the type of company they're targeting
- If answers are vague, push back with "Can you be more specific?"`,

    'Behavioral': `You are conducting a behavioral interview. Your goals:
- Probe for STAR-structured answers (Situation, Task, Action, Result)
- Cover: conflict resolution, leadership, failure, cross-functional collaboration, values
- Never accept vague answers — if they say "we did X", ask "what specifically did YOU do?"
- Always ask for metrics and concrete outcomes: "What was the measurable result?"
- Ask follow-ups on anything that sounds generic or rehearsed`,

    'Technical': `You are conducting a technical interview. The candidate's profile suggests: ${profile.target_role ? detectTechnicalFocus(profile.target_role) : 'system thinking'}.
- Ask progressively harder questions
- For coding: describe the problem clearly, ask them to walk you through their approach before coding
- For system design: start broad, then drill into trade-offs, scaling, and failure modes
- For product/data: give a realistic case, push on assumptions and metrics`,

    'Offer Negotiation': `You are playing the role of a hiring manager presenting a job offer. Your goals:
- Present an initial offer (slightly below what the candidate expects based on their profile)
- React realistically to counter-proposals — push back once, then show flexibility
- Pressure them on timeline: "We need a decision by Friday"
- Test if they can anchor, justify their value, and handle silence`,
  }

  const modeInstructions = mode === 'pit'
    ? `IMPORTANT — The Pit Mode is active:
- No warmup questions. Start with the hardest question immediately.
- No positive reinforcement ("Great answer!", "That's interesting") — just the next question.
- If time would run out in a real interview, cut them off and move on.
- Maximum pressure. Simulate a demanding interviewer.`
    : `Guided Mode is active:
- You may briefly acknowledge strong answers before moving on.
- If an answer is incomplete, give one subtle prompt before asking the follow-up.
- Maintain a professional but approachable tone.`

  return `You are ${iv.name}, ${iv.title} at ${iv.company}.
You are conducting a ${round} interview.

Candidate profile:
${candidateContext || '(No dossier data available — ask for context naturally)'}

${roundInstructions[round]}

${modeInstructions}

Session rules (do not break these):
- Ask ONE question at a time. Never list multiple questions in the same message.
- After receiving an answer, either ask a follow-up or move to the next question.
- After ${qCount} questions total have been answered, close the interview by saying exactly: "Thank you for your time. That's all I needed from you today."
- Do NOT reveal that you are an AI system.
- Conduct the entire session in English.
- Keep your messages concise — max 3 sentences per turn unless explaining a technical problem.

Start immediately with your first question. Do not greet or introduce yourself — jump straight into the interview.`
}

export async function POST(req: Request) {
  let userId: string

  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })
    userId = user.id
  } catch {
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }

  const { allowed } = await checkTokenBalance(userId)
  if (!allowed) return Response.json({ error: 'token_limit_reached' }, { status: 402 })

  const body = await req.json()
  const messages: Anthropic.MessageParam[] = body.messages
  const round: Round = body.round ?? 'HR Screening'
  const mode: Mode   = body.mode === 'pit' ? 'pit' : 'guided'
  const profile: ArenaProfile = body.profile ?? {}

  const systemPrompt = buildArenaSystemPrompt(round, mode, profile)
  const anthropic    = new Anthropic()
  const encoder      = new TextEncoder()
  const MODEL        = 'claude-sonnet-4-6'
  const MAX_TOKENS   = 512

  let cancelled = false

  const readable = new ReadableStream({
    cancel() { cancelled = true },
    async start(controller) {
      let totalInput  = 0
      let totalOutput = 0

      try {
        const stream = anthropic.messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
          messages,
        })

        for await (const event of stream) {
          if (cancelled) break
          if (event.type === 'message_start') totalInput += event.message.usage.input_tokens
          if (event.type === 'message_delta') totalOutput = event.usage.output_tokens
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
          }
        }

        await recordTokenUsage(userId, totalInput + totalOutput, 'arena_session', { round, mode }, MODEL, totalInput, totalOutput)

        if (!cancelled) {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      } catch (err) {
        console.error('[arena/session] error', err)
        if (!cancelled) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: String(err) })}\n\n`))
          controller.close()
        }
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
