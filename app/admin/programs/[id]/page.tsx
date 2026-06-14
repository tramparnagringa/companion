import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { ProgramEditor } from '@/components/admin/program-editor'
import type { FunnelData, StudentRef } from '@/components/admin/program-funnel'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const service = createServiceClient()
  const { data } = await service.from('programs').select('name').eq('id', id).single()
  return { title: data?.name ?? 'Programa' }
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const service = createServiceClient()

  const [programRes, daysRes] = await Promise.all([
    service.from('programs').select('*').eq('id', id).single(),
    service.from('program_days').select('*').eq('program_id', id).order('day_number'),
  ])

  if (!programRes.data) notFound()

  // Enrollments for this program
  const { data: enrollments } = await service
    .from('user_programs')
    .select('id, user_id')
    .eq('program_id', id)
    .eq('status', 'active')

  const enrolledUserIds = (enrollments ?? []).map(e => e.user_id).filter((id): id is string => !!id)
  const enrollmentIds = (enrollments ?? []).map(e => e.id).filter((id): id is string => !!id)

  // Profiles + activities in parallel
  const [profilesRes, activitiesRes] = await Promise.all([
    enrolledUserIds.length > 0
      ? service.from('profiles').select('id, full_name, avatar_url').in('id', enrolledUserIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; avatar_url: string | null }[] }),
    enrollmentIds.length > 0
      ? service.from('day_activities').select('user_id, day_number, status').in('program_enrollment_id', enrollmentIds)
      : Promise.resolve({ data: [] as { user_id: string | null; day_number: number | null; status: string | null }[] }),
  ])

  const profilesMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {}
  for (const p of (profilesRes.data ?? []) as { id: string | null; full_name: string | null; avatar_url: string | null }[]) {
    if (p.id) profilesMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url }
  }

  const enrolledStudents: StudentRef[] = (enrollments ?? [])
    .filter(e => !!e.user_id)
    .map(e => ({
      user_id: e.user_id as string,
      full_name: profilesMap[e.user_id as string]?.full_name ?? null,
      avatar_url: profilesMap[e.user_id as string]?.avatar_url ?? null,
    }))

  // Map user_id → day_number → status
  const activityMap: Record<string, Map<number, string>> = {}
  for (const a of (activitiesRes.data ?? []) as { user_id: string | null; day_number: number | null; status: string | null }[]) {
    if (!a.user_id || a.day_number == null) continue
    if (!activityMap[a.user_id]) activityMap[a.user_id] = new Map()
    activityMap[a.user_id].set(a.day_number, a.status ?? 'pending')
  }

  const neverStarted = enrolledStudents.filter(
    s => !activityMap[s.user_id] || activityMap[s.user_id].size === 0
  )

  const totalDays = programRes.data.total_days
  const funnelDays = Array.from({ length: totalDays }, (_, i) => {
    const dayNum = i + 1
    const done: StudentRef[] = []
    const inProgress: StudentRef[] = []
    const pending: StudentRef[] = []
    const skipped: StudentRef[] = []
    const notStarted: StudentRef[] = []

    for (const s of enrolledStudents) {
      const status = activityMap[s.user_id]?.get(dayNum)
      switch (status) {
        case 'done':        done.push(s);       break
        case 'in_progress': inProgress.push(s); break
        case 'pending':     pending.push(s);    break
        case 'skipped':     skipped.push(s);    break
        default:            notStarted.push(s)
      }
    }

    return { day_number: dayNum, done, in_progress: inProgress, pending, skipped, not_started: notStarted }
  })

  const funnelData: FunnelData = {
    total: enrolledStudents.length,
    never_started: neverStarted,
    days: funnelDays,
  }

  const days = (daysRes.data ?? []).map(d => ({
    ...d,
    ai_model: d.ai_model ?? 'claude-haiku-4-5-20251001',
    ai_max_tokens: d.ai_max_tokens ?? 1024,
    cards: Array.isArray(d.cards) ? (d.cards as { type: 'learn' | 'ai' | 'action' | 'reflect'; title: string; description: string }[]) : undefined,
  }))

  const program = {
    ...programRes.data,
    days,
    is_published: programRes.data.is_published ?? false,
    week_themes: (programRes.data.week_themes ?? null) as Record<string, string> | null,
  }

  return <ProgramEditor program={program} funnelData={funnelData} />
}
