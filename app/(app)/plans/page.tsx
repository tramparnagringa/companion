import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ensureEnrollment } from '@/lib/programs'

export default async function PlansRedirect() {
  const supabase   = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const enrollment = await ensureEnrollment(user!.id, supabase)
  redirect(`/${enrollment?.program.slug ?? 'tng-bootcamp'}/plans`)
}
