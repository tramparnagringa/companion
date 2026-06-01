import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getEnrollmentBySlug } from '@/lib/programs'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createServerClient()
  const { data: program } = await supabase
    .from('programs')
    .select('name')
    .eq('slug', slug)
    .maybeSingle()

  const name = program?.name ?? slug
  return { title: { template: `%s — ${name} | TNG Companion`, default: `${name} | TNG Companion` } }
}

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
