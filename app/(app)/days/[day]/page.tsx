import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ensureEnrollment, getProgramDay } from '@/lib/programs'
import { DayPageContent } from '@/components/today/day-page-content'

export default async function DayRedirect({
  params,
}: {
  params: Promise<{ day: string }>
}) {
  const { day } = await params
  const dayNumber = parseInt(day, 10)
  const supabase   = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const enrollment = await ensureEnrollment(user!.id, supabase)
  if (!enrollment) redirect('/pending')
  const totalDays = enrollment.program.total_days

  if (dayNumber > totalDays) notFound()

  const programDay = enrollment
    ? await getProgramDay(enrollment.program_id, dayNumber, supabase)
    : null

  return (
    <DayPageContent
      dayNumber={dayNumber}
      totalDays={totalDays}
      enrollmentId={enrollment?.id}
      programDay={programDay}
    />
  )
}
