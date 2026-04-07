import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/app-shell'
import { getCurrentDay } from '@/lib/days'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: balances }, { data: activities }] = await Promise.all([
    supabase
      .from('token_balance')
      .select('tokens_total, tokens_used, product_type')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString()),
    supabase
      .from('day_activities')
      .select('day_number, status')
      .eq('user_id', user.id),
  ])

  const tokenTotal = balances?.reduce((s, b) => s + b.tokens_total, 0) ?? 0
  const tokenUsed  = balances?.reduce((s, b) => s + b.tokens_used,  0) ?? 0
  const plan       = balances?.[0]?.product_type ?? 'student'

  const completedDays = (activities ?? [])
    .filter(a => a.status === 'done')
    .map(a => a.day_number)
  const currentDay = getCurrentDay(completedDays)
  const completedCount = completedDays.length

  return (
    <AppShell
      user={user}
      tokenUsed={tokenUsed}
      tokenTotal={tokenTotal}
      plan={plan}
      currentDay={currentDay}
      completedCount={completedCount}
    >
      {children}
    </AppShell>
  )
}
