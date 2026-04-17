import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getActiveEnrollment } from '@/lib/programs'

export default async function PlansRedirect() {
  const supabase   = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const enrollment = await getActiveEnrollment(user!.id, supabase)
  if (!enrollment) redirect('/pending')
  redirect(`/${enrollment.program.slug}/plans`)
}
