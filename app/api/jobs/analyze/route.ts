import { createServerClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic/client'
import { updateJob } from '@/app/actions/jobs'
import { recordTokenUsage } from '@/lib/anthropic/check-tokens'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { jobId, jobDescription, companyName, roleTitle } = await req.json()
  if (!jobDescription?.trim()) {
    return Response.json({ error: 'job_description_required' }, { status: 400 })
  }

  // Fetch candidate profile for context
  const { data: profile } = await supabase
    .from('candidate_profiles')
    .select('target_role, seniority, years_experience, tech_stack, value_proposition')
    .eq('user_id', user.id)
    .single()

  const profileContext = profile ? `
Candidate profile:
- Target role: ${profile.target_role ?? 'not defined'}
- Seniority: ${profile.seniority ?? 'not defined'} (${profile.years_experience ?? '?'} years)
- Stack: ${profile.tech_stack?.join(', ') ?? 'not defined'}
- Value proposition: ${profile.value_proposition ?? 'not defined'}
`.trim() : 'Candidate profile not yet filled.'

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You are an international tech recruiter analyzing job fit for a candidate.
Respond ONLY with a valid JSON object, no markdown, no explanation.`,
    messages: [{
      role: 'user',
      content: `${profileContext}

Job: ${companyName} — ${roleTitle}
Description:
${jobDescription}

Analyze fit and respond with this exact JSON:
{
  "fit_score": <integer 0-100>,
  "apply_recommendation": <true|false>,
  "strong_keywords": [<up to 8 keywords the candidate matches well>],
  "weak_keywords": [<up to 4 keywords that are gaps>],
  "analysis_notes": "<2-3 sentence summary of fit, strengths, and main gap>"
}`
    }]
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  let analysis: {
    fit_score: number
    apply_recommendation: boolean
    strong_keywords: string[]
    weak_keywords: string[]
    analysis_notes: string
  }

  try {
    analysis = JSON.parse(text)
  } catch {
    return Response.json({ error: 'parse_error', raw: text }, { status: 500 })
  }

  // Fetch current status to decide if we should move to 'analysing'
  const { data: current } = await supabase
    .from('jobs')
    .select('status')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single()

  // Only advance to 'analysing' if still in 'to_analyse' — never override further stages
  const nextStatus = current?.status === 'to_analyse' ? 'analysing' : undefined

  await recordTokenUsage(
    user.id,
    message.usage.input_tokens + message.usage.output_tokens,
    'job_analysis',
    { job_id: jobId },
    'claude-sonnet-4-6',
    message.usage.input_tokens,
    message.usage.output_tokens,
  )

  // Persist via updateJob so status_log is recorded correctly
  const updated = await updateJob(jobId, {
    job_description: jobDescription,
    fit_score: analysis.fit_score,
    apply_recommendation: analysis.apply_recommendation,
    strong_keywords: analysis.strong_keywords,
    weak_keywords: analysis.weak_keywords,
    analysis_notes: analysis.analysis_notes,
    ...(nextStatus ? { status: nextStatus } : {}),
  })

  return Response.json({ job: updated, analysis })
}
