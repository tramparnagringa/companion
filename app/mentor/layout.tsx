import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ContextRail } from '@/components/layout/context-rail'
import { MentorShell } from '@/components/mentor/mentor-shell'

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (!['mentor', 'admin'].includes(profile?.role ?? '')) redirect('/today')

  const role = profile?.role ?? 'mentor'

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
      <ContextRail role={role} user={user} />
      <MentorShell>{children}</MentorShell>
    </div>
  )
}
