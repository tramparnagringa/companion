import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/admin/admin-shell'
import { ContextRail } from '@/components/layout/context-rail'

export const metadata: Metadata = {
  title: { template: '%s — Admin | TNG Companion', default: 'Admin | TNG Companion' },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role ?? ''
  if (!['mentor', 'admin'].includes(role)) redirect('/days')

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
      <ContextRail role={role} user={user} />
      <AdminShell role={role}>{children}</AdminShell>
    </div>
  )
}
