import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/app-shell'
import { getAllEnrollments } from '@/lib/programs'

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

  // 1 crédito = 1.000 tokens. Fixed display ratio — no credit_ratio dependency.
  const CREDIT_RATIO = 1_000
  const creditTotal  = Math.floor(tokenTotal / CREDIT_RATIO)
  const creditUsed   = Math.floor(tokenUsed  / CREDIT_RATIO)

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
      tokenUsed={creditUsed}
      tokenTotal={creditTotal}
      plan={plan}
    >
      {children}
    </AppShell>
  )
}
