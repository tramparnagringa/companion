import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { MentorWorkspace } from '@/components/mentor/mentor-workspace'
import type { StudentSummary } from '@/components/mentor/mentor-workspace'

function health(lastActivity: string | null): 'green' | 'yellow' | 'red' {
  if (!lastActivity) return 'red'
  const h = (Date.now() - new Date(lastActivity).getTime()) / 3_600_000
  if (h < 24) return 'green'
  if (h < 96) return 'yellow'
  return 'red'
}

async function getStudentList(): Promise<StudentSummary[]> {
  const service = createServiceClient()

  const [profilesRes, activitiesRes] = await Promise.all([
    service
      .from('profiles')
      .select('id, full_name, role')
      .in('role', ['bootcamp', 'mentoria', 'mentor', 'admin'])
      .order('created_at', { ascending: false }),
    service
      .from('day_activities')
      .select('user_id, day_number, status, updated_at'),
  ])

  const profiles   = profilesRes.data ?? []
  const activities = activitiesRes.data ?? []

  return profiles.map(p => {
    const userActs   = activities.filter(a => a.user_id === p.id)
    const completed  = userActs.filter(a => a.status === 'done').map(a => a.day_number)
    const allDays    = userActs.map(a => a.day_number).sort((a, b) => a - b)
    const currentDay = allDays.find(d => !completed.includes(d)) ?? (completed.length + 1)
    const lastAct    = [...userActs].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )[0]

    return {
      id:             p.id,
      name:           p.full_name,
      role:           p.role,
      currentDay,
      lastActivityAt: lastAct?.updated_at ?? null,
      health:         health(lastAct?.updated_at ?? null),
    }
  })
}

export default async function MentorPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [students, profileRes] = await Promise.all([
    getStudentList(),
    supabase.from('profiles').select('role').eq('id', user!.id).single(),
  ])

  return (
    <MentorWorkspace
      students={students}
      currentUserRole={profileRes.data?.role ?? 'mentor'}
      currentUser={user}
    />
  )
}
