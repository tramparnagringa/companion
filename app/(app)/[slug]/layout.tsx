import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getEnrollmentBySlug } from '@/lib/programs'

export default async function ProgramLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase  = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const enrollment = await getEnrollmentBySlug(user!.id, slug, supabase)
  if (!enrollment) notFound()

  return <>{children}</>
}
