import { createServerClient } from '@/lib/supabase/server'
import { getAllEnrollments, ensureEnrollment } from '@/lib/programs'
import { TodayRedirectClient } from './redirect-client'

export default async function TodayRedirect() {
  const supabase    = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const enrollments = await getAllEnrollments(user!.id, supabase)

  if (enrollments.length === 0) {
    const e = await ensureEnrollment(user!.id, supabase)
    return <TodayRedirectClient
      defaultSlug={e?.program.slug ?? 'tng-bootcamp'}
      slugs={e ? [e.program.slug] : []}
    />
  }

  return <TodayRedirectClient
    defaultSlug={enrollments[0].program.slug}
    slugs={enrollments.map(e => e.program.slug)}
  />
}
