import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/app-shell'
import { getAllEnrollments } from '@/lib/programs'
import { getCurrentDay } from '@/lib/days'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: balances }, enrollments] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase
      .from('token_balance')
      .select('tokens_total, tokens_used, product_type')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString()),
    getAllEnrollments(user.id, supabase),
  ])

  const activeEnrollments = enrollments.sort((a, b) =>
    a.program.name.localeCompare(b.program.name, 'pt')
  )

  const tokenTotal  = balances?.reduce((s, b) => s + b.tokens_total, 0) ?? 0
  const tokenUsed   = balances?.reduce((s, b) => s + b.tokens_used,  0) ?? 0
  const plan        = balances?.[0]?.product_type ?? 'student'

  const CREDIT_RATIO = 1_000
  const creditTotal  = Math.floor(tokenTotal / CREDIT_RATIO)
  const creditUsed   = Math.floor(tokenUsed  / CREDIT_RATIO)

  // Fetch completed day activities for all enrollments in a single query
  const enrollmentIds = activeEnrollments.map(e => e.id)
  const { data: doneActivities } = enrollmentIds.length > 0
    ? await supabase
        .from('day_activities')
        .select('program_enrollment_id, day_number')
        .in('program_enrollment_id', enrollmentIds)
        .eq('status', 'done')
    : { data: [] as { program_enrollment_id: string | null; day_number: number }[] }

  // Group completed day numbers per enrollment
  const completedDaysByEnrollment = new Map<string, number[]>()
  for (const row of doneActivities ?? []) {
    if (!row.program_enrollment_id) continue
    const existing = completedDaysByEnrollment.get(row.program_enrollment_id) ?? []
    existing.push(row.day_number)
    completedDaysByEnrollment.set(row.program_enrollment_id, existing)
  }

  const enrolledProgramIds = new Set(activeEnrollments.map(e => e.program_id))

  // Fetch first store-visible program not enrolled, ordered by display_order
  const { data: storePrograms } = await supabase
    .from('programs')
    .select('id, slug, name, description, price_brl, duration_days')
    .eq('store_visible', true)
    .order('display_order')

  const recommendedProgram = storePrograms?.find(p => !enrolledProgramIds.has(p.id)) ?? null

  return (
    <AppShell
      user={user}
      role={profile?.role ?? 'student'}
      enrollments={activeEnrollments.map(e => {
        const completedDayNumbers = completedDaysByEnrollment.get(e.id) ?? []
        return {
          id: e.id,
          slug: e.program.slug,
          name: e.program.name,
          totalDays: e.program.total_days,
          completedDays: completedDayNumbers.length,
          currentDay: getCurrentDay(completedDayNumbers, e.program.total_days),
          status: e.status,
        }
      })}
      tokenUsed={creditUsed}
      tokenTotal={creditTotal}
      plan={plan}
      recommendedProgram={recommendedProgram}
    >
      {children}
    </AppShell>
  )
}
