import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { computeCostUsd } from '@/lib/anthropic/pricing'

export async function GET() {
  const auth = await createServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await auth.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['mentor', 'admin'].includes(profile.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServiceClient()
  const now = new Date()
  const todayStart  = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const weekStart   = new Date(now); weekStart.setDate(now.getDate() - 7)
  const inactiveThreshold = new Date(now); inactiveThreshold.setDate(now.getDate() - 3)
  const monthStart  = new Date(now.getFullYear(), now.getMonth(), 1)

  const [activitiesRes, profilesRes, tokenUsageRes] = await Promise.all([
    supabase
      .from('day_activities')
      .select('user_id, day_number, status, updated_at, outputs')
      .order('updated_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role')
      .in('role', ['student', 'mentor', 'admin']),
    supabase
      .from('token_usage')
      .select('user_id, tokens_consumed, created_at')
      .gte('created_at', monthStart.toISOString()),
  ])

  const activities = activitiesRes.data ?? []
  const profiles   = profilesRes.data ?? []
  const usage      = tokenUsageRes.data ?? []

  // Build per-user latest activity timestamp
  const latestByUser = new Map<string, string>()
  for (const a of activities) {
    if (!a.user_id || !a.updated_at) continue
    const existing = latestByUser.get(a.user_id)
    if (!existing || a.updated_at > existing) latestByUser.set(a.user_id, a.updated_at)
  }

  // Build per-user day counts
  const dayCountByUser = new Map<string, { completed: number; total: number; currentDay: number }>()
  for (const a of activities) {
    if (!a.user_id) continue
    const entry = dayCountByUser.get(a.user_id) ?? { completed: 0, total: 0, currentDay: 1 }
    entry.total++
    if (a.status === 'done') entry.completed++
    dayCountByUser.set(a.user_id, entry)
  }

  const profileMap = new Map(profiles.map(p => [p.id, p]))

  const ativos_hoje: typeof activeStudents = []
  const ativos_semana: typeof activeStudents = []
  const sem_atividade: typeof activeStudents = []

  type ActiveStudent = {
    id: string
    full_name: string | null
    avatar_url: string | null
    last_activity: string | null
    completed_days: number
    current_day: number
  }

  const activeStudents: ActiveStudent[] = profiles
    .filter(p => p.role === 'student')
    .map(p => {
      const last = latestByUser.get(p.id) ?? null
      const counts = dayCountByUser.get(p.id) ?? { completed: 0, total: 0, currentDay: 1 }
      return {
        id: p.id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        last_activity: last,
        completed_days: counts.completed,
        current_day: counts.completed + 1,
      }
    })
    .sort((a, b) => {
      if (!a.last_activity && !b.last_activity) return 0
      if (!a.last_activity) return 1
      if (!b.last_activity) return -1
      return b.last_activity.localeCompare(a.last_activity)
    })

  for (const s of activeStudents) {
    if (!s.last_activity) {
      sem_atividade.push(s)
    } else if (s.last_activity >= todayStart.toISOString()) {
      ativos_hoje.push(s)
    } else if (s.last_activity >= weekStart.toISOString()) {
      ativos_semana.push(s)
    } else if (s.last_activity < inactiveThreshold.toISOString()) {
      sem_atividade.push(s)
    } else {
      ativos_semana.push(s)
    }
  }

  const custo_mes_tokens = usage.reduce((s, u) => s + (u.tokens_consumed ?? 0), 0)
  const custo_mes_usd    = computeCostUsd(null, null, null, custo_mes_tokens)

  return NextResponse.json({
    ativos_hoje,
    ativos_semana,
    sem_atividade,
    custo_mes_tokens,
    custo_mes_usd,
    total_students: activeStudents.length,
  })
}
