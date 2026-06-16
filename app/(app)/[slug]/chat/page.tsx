import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getEnrollmentBySlug } from '@/lib/programs'
import { ProgramChatClient } from './chat-client'

export default async function ProgramChatPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const enrollment = await getEnrollmentBySlug(user.id, slug, supabase)
  if (!enrollment) redirect('/days')

  const userName = (user.user_metadata?.full_name as string | undefined)?.split(' ')[0]
    ?? user.email?.split('@')[0]

  return <ProgramChatClient slug={slug} programName={enrollment.program.name} userName={userName} />
}
