import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getAllEnrollments } from '@/lib/programs'
import { TodayRedirectClient } from './redirect-client'

export default async function TodayRedirect() {
  const supabase    = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const enrollments = await getAllEnrollments(user!.id, supabase)

  if (enrollments.length === 0) {
    redirect('/pending')
  }

  return <TodayRedirectClient
    defaultSlug={enrollments[0].program.slug}
    slugs={enrollments.map(e => e.program.slug)}
  />
}
