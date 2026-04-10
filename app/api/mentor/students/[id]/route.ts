import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

function health(lastActivity: string | null): 'green' | 'yellow' | 'red' {
  if (!lastActivity) return 'red'
  const h = (Date.now() - new Date(lastActivity).getTime()) / 3_600_000
  if (h < 24) return 'green'
  if (h < 96) return 'yellow'
  return 'red'
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['mentor', 'admin'].includes(caller?.role ?? '')) {
    return new Response('Forbidden', { status: 403 })
  }

  const { id } = await params
  const service = createServiceClient()

  const [profileRes, candidateRes, activitiesRes, jobsRes, balancesRes, interviewRes, actionsRes] =
    await Promise.all([
      service.from('profiles').select('id, full_name, role, created_at').eq('id', id).single(),
      service.from('candidate_profiles').select('*').eq('user_id', id).single(),
      service.from('day_activities').select('day_number, status, updated_at').eq('user_id', id),
      service.from('jobs').select('status').eq('user_id', id),
      service.from('token_balance')
        .select('tokens_total, tokens_used, expires_at, is_active')
        .eq('user_id', id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString()),
      service.from('interview_prep').select('performance_map').eq('user_id', id).single(),
      service.from('mentor_actions')
        .select('created_at')
        .eq('target_user_id', id)
        .order('created_at', { ascending: false })
        .limit(1),
    ])

  if (!profileRes.data) return new Response('Not found', { status: 404 })

  const activities   = activitiesRes.data ?? []
  const jobs         = jobsRes.data ?? []
  const balances     = balancesRes.data ?? []
  const completed    = activities.filter(a => a.status === 'done')
  const completedNums = completed.map(a => a.day_number)
  const currentDay   = (activities.map(a => a.day_number).sort((a,b) => a-b).find(d => !completedNums.includes(d))) ?? (completedNums.length + 1)
  const lastAct      = [...activities].sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]

  const tokensTotal  = balances.reduce((s, b) => s + b.tokens_total, 0)
  const tokensUsed   = balances.reduce((s, b) => s + b.tokens_used,  0)
  const expiresAt    = balances.sort((a,b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime())[0]?.expires_at ?? null

  const c = candidateRes.data

  // Extract vulnerabilities from performance_map
  let vulnerabilities: string[] = []
  try {
    const pm = interviewRes.data?.performance_map as Record<string, unknown> | null
    if (pm && Array.isArray(pm.vulnerabilities)) vulnerabilities = pm.vulnerabilities as string[]
    else if (pm && Array.isArray(pm.weaknesses)) vulnerabilities = pm.weaknesses as string[]
  } catch {}

  return Response.json({
    id,
    name:          profileRes.data.full_name,
    role:          profileRes.data.role,
    currentDay,
    completedCount: completed.length,
    lastActivityAt: lastAct?.updated_at ?? null,
    health:        health(lastAct?.updated_at ?? null),
    target: {
      role:           c?.target_role ?? null,
      seniority:      c?.seniority ?? null,
      stack:          c?.tech_stack ?? [],
      regions:        c?.target_regions ?? [],
      workPreference: c?.work_preference ?? null,
      salaryMin:      c?.salary_min ?? null,
      salaryMax:      c?.salary_max ?? null,
      salaryCurrency: c?.salary_currency ?? 'USD',
    },
    pipeline: {
      total:       jobs.length,
      applied:     jobs.filter(j => ['applied','interviewing','offer'].includes(j.status)).length,
      interviewing: jobs.filter(j => ['interviewing','offer'].includes(j.status)).length,
      offers:      jobs.filter(j => j.status === 'offer').length,
    },
    tokens: {
      remaining: tokensTotal - tokensUsed,
      total:     tokensTotal,
      expiresAt,
    },
    vulnerabilities,
    valueProp:         c?.value_proposition ?? null,
    lastMentorSession: actionsRes.data?.[0]?.created_at ?? null,
  })
}
