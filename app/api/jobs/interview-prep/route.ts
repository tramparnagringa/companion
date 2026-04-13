import { createServerClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic/client'
import type { Json } from '@/types/database'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { jobId } = await req.json()

  const [{ data: job }, { data: profile }] = await Promise.all([
    supabase.from('jobs').select('*').eq('id', jobId).eq('user_id', user.id).single(),
    supabase.from('candidate_profiles')
      .select('target_role, seniority, years_experience, tech_stack, value_proposition')
      .eq('user_id', user.id)
      .single(),
  ])

  if (!job) return Response.json({ error: 'not_found' }, { status: 404 })

  const profileCtx = profile
    ? `Candidate: ${profile.target_role}, ${profile.seniority} (${profile.years_experience}y), stack: ${profile.tech_stack?.join(', ')}`
    : 'Candidate profile not filled.'

  const analysisCtx = job.analysis_notes
    ? `Fit analysis: ${job.analysis_notes}. Strong: ${job.strong_keywords?.join(', ')}. Gaps: ${job.weak_keywords?.join(', ')}.`
    : ''

  const jobCtx = job.job_description
    ? `Job description:\n${job.job_description.slice(0, 3000)}`
    : `Role: ${job.role_title} at ${job.company_name}`

  // Use web_search to get real company info, then synthesize prep
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    tools: [{
      type: 'web_search_20250305' as never,
      name: 'web_search',
      max_uses: 3,
    }],
    messages: [{
      role: 'user',
      content: `You are a senior interview coach preparing a candidate for an interview.

${profileCtx}
${analysisCtx}
${jobCtx}

Search for recent, accurate information about ${job.company_name} to help prepare the candidate.
Then respond ONLY with a valid JSON object (no markdown, no explanation):

{
  "generated_at": "<ISO8601>",
  "company_info": {
    "about": "<2-3 sentence description of the company, product, business model>",
    "culture": ["<culture/value 1>", "<culture/value 2>", "<culture/value 3>"],
    "recent_news": ["<recent notable thing 1>", "<recent notable thing 2>"]
  },
  "likely_topics": ["<technical topic 1>", "<topic 2>", "<topic 3>", "<topic 4>"],
  "likely_questions": [
    "<behavioral question 1>",
    "<technical question 2>",
    "<situational question 3>",
    "<question 4>",
    "<question 5>"
  ],
  "strengths": ["<strength from analysis 1>", "<strength 2>", "<strength 3>"],
  "gaps": ["<gap to address 1>", "<gap 2>"],
  "tips": ["<specific prep tip 1>", "<tip 2>", "<tip 3>"]
}`
    }],
  })

  // Extract the final text block (after tool use)
  const textBlock = response.content.findLast(b => b.type === 'text')
  const text = textBlock?.type === 'text' ? textBlock.text : ''

  // Extract JSON even if there's surrounding text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return Response.json({ error: 'parse_error', raw: text }, { status: 500 })

  let prep: object
  try {
    prep = JSON.parse(jsonMatch[0])
  } catch {
    return Response.json({ error: 'parse_error', raw: text }, { status: 500 })
  }

  // Persist
  await supabase
    .from('jobs')
    .update({ interview_prep: prep as unknown as Json, updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .eq('user_id', user.id)

  return Response.json({ prep })
}
