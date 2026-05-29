import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import { checkTokenBalance, recordTokenUsage } from '@/lib/anthropic/check-tokens'

interface TranscriptMessage {
  role: 'interviewer' | 'candidate'
  content: string
}

interface DebriefRequest {
  transcript: TranscriptMessage[]
  round: string
  mode: 'guided' | 'pit'
  profile?: {
    target_role?: string | null
    seniority?: string | null
    tech_stack?: string[] | null
  }
}

const DEBRIEF_SYSTEM = `You are an expert interview coach and evaluator.
You will receive the full transcript of a mock interview and produce a structured evaluation in JSON.

Your evaluation must be accurate, specific, and actionable — not generic.
Reference exact quotes from the candidate's answers when giving feedback.

Return ONLY valid JSON matching this schema exactly:
{
  "verdict": string,        // "GREAT PERFORMANCE" | "QUASE LÁ" | "PODE MELHORAR" | "THE PIT: DONE"
  "scores": {
    "clareza": number,      // 0-100: how clearly structured and logical the answers were
    "evidencia": number,    // 0-100: use of concrete examples, metrics, specific details
    "ingles": number        // 0-100: fluency, vocabulary richness, naturalness under pressure
  },
  "questions": [
    {
      "question": string,   // the interviewer's question
      "answer": string,     // a short excerpt of the candidate's answer (first 120 chars)
      "score": number,      // 0-100 overall score for this question
      "feedback": [
        {
          "type": "positive" | "warning" | "negative" | "tip",
          "text": string    // specific, actionable feedback referencing the actual answer
        }
      ],
      "annotated": [
        {
          "text": string,       // a short phrase from the answer
          "quality": "strong" | "ok" | "weak"
        }
      ]
    }
  ]
}

Scoring guidelines:
- 80-100: Excellent, specific, metrics-driven, natural English
- 60-79: Good but missing depth, specificity, or a key element
- 40-59: Acceptable but vague, generic, or unclear
- 0-39: Poor — no structure, no evidence, or incoherent

Verdict guidelines:
- Average score >= 75: "GREAT PERFORMANCE"
- Average score 60-74: "QUASE LÁ"
- Average score < 60: "PODE MELHORAR"
- If mode is "pit" and avg >= 60: "THE PIT: DONE"`

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

  const body: DebriefRequest = await req.json()
  const { transcript, round, mode, profile } = body

  if (!transcript || transcript.length === 0) {
    return Response.json({ error: 'no_transcript' }, { status: 400 })
  }

  const formattedTranscript = transcript
    .map(m => `${m.role === 'interviewer' ? 'INTERVIEWER' : 'CANDIDATE'}: ${m.content}`)
    .join('\n\n')

  const userMessage = `Round: ${round}
Mode: ${mode === 'pit' ? 'The Pit (no hints, timer on)' : 'Guided'}
${profile?.target_role ? `Candidate target role: ${profile.target_role}` : ''}
${profile?.tech_stack?.length ? `Stack: ${profile.tech_stack.join(', ')}` : ''}

FULL INTERVIEW TRANSCRIPT:
${formattedTranscript}

Evaluate this interview and return the JSON debrief.`

  const MODEL      = 'claude-sonnet-4-6'
  const MAX_TOKENS = 4096
  const anthropic  = new Anthropic()

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: DEBRIEF_SYSTEM,
      messages: [{ role: 'user', content: userMessage }],
    })

    const rawText = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as Anthropic.TextBlock).text)
      .join('')

    // Strip markdown code fences if present
    const jsonText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

    let debrief
    try {
      debrief = JSON.parse(jsonText)
    } catch {
      console.error('[arena/debrief] JSON parse error', jsonText.slice(0, 200))
      return Response.json({ error: 'parse_error' }, { status: 500 })
    }

    const totalTokens = response.usage.input_tokens + response.usage.output_tokens
    await recordTokenUsage(userId, totalTokens, 'arena_debrief', { round, mode }, MODEL, response.usage.input_tokens, response.usage.output_tokens)

    return Response.json(debrief)
  } catch (err) {
    console.error('[arena/debrief] error', err)
    return Response.json({ error: 'internal_error' }, { status: 500 })
  }
}
