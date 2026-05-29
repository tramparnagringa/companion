import { createServerClient } from '@/lib/supabase/server'
import { ArenaShell } from '@/components/arena/arena-shell'

export default async function ArenaPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: userMeta }] = await Promise.all([
    supabase
      .from('candidate_profiles')
      .select('target_role, seniority, tech_stack, years_experience, value_proposition, salary_min, salary_max, salary_currency')
      .eq('user_id', user!.id)
      .single(),
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user!.id)
      .single(),
  ])

  const userName = userMeta?.full_name ?? user?.email?.split('@')[0] ?? 'Candidato'

  return (
    <div style={{ height: '100%', overflow: 'hidden' }}>
      <ArenaShell profile={profile} userName={userName} />
    </div>
  )
}
