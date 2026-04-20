import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/app-shell'
import { getAllEnrollments } from '@/lib/programs'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: balances }, enrollments, { count: plansCount }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase
      .from('token_balance')
      .select('tokens_total, tokens_used, product_type')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString()),
    getAllEnrollments(user.id, supabase),
    (supabase as any)
      .from('action_notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  const activeEnrollments = enrollments

  const tokenTotal  = balances?.reduce((s, b) => s + b.tokens_total, 0) ?? 0
  const tokenUsed   = balances?.reduce((s, b) => s + b.tokens_used,  0) ?? 0
  const plan        = balances?.[0]?.product_type ?? 'student'

  // credit_ratio comes from the first active enrollment's program (display only)
  const creditRatio  = (enrollments[0]?.program as { credit_ratio?: number | null } | undefined)?.credit_ratio ?? 10
  const creditTotal  = Math.floor(tokenTotal / creditRatio)
  const creditUsed   = Math.floor(tokenUsed  / creditRatio)

  return (
    <AppShell
      user={user}
      role={profile?.role ?? 'student'}
      enrollments={activeEnrollments.map(e => ({
        id: e.id,
        slug: e.program.slug,
        name: e.program.name,
        totalDays: e.program.total_days,
      }))}
      hasPlans={(plansCount ?? 0) > 0}
      tokenUsed={creditUsed}
      tokenTotal={creditTotal}
      plan={plan}
    >
      {children}
    </AppShell>
  )
}
