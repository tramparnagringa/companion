import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/app-shell'
import { getAllEnrollments, ensureEnrollment } from '@/lib/programs'

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

  // Ensure at least one enrollment exists (creates default if needed)
  const activeEnrollments = enrollments.length > 0
    ? enrollments
    : await ensureEnrollment(user.id, supabase).then(e => e ? [e] : [])

  const tokenTotal = balances?.reduce((s, b) => s + b.tokens_total, 0) ?? 0
  const tokenUsed  = balances?.reduce((s, b) => s + b.tokens_used,  0) ?? 0
  const plan       = balances?.[0]?.product_type ?? 'student'

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
      tokenUsed={tokenUsed}
      tokenTotal={tokenTotal}
      plan={plan}
    >
      {children}
    </AppShell>
  )
}
