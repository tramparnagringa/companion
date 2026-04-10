import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getEnrollmentBySlug, getProgramDay } from '@/lib/programs'
import { DayPageContent } from '@/components/today/day-page-content'

export default async function ProgramDayPage({
  params,
}: {
  params: Promise<{ slug: string; day: string }>
}) {
  const { slug, day: dayParam } = await params
  const dayNumber = parseInt(dayParam, 10)
  if (isNaN(dayNumber) || dayNumber < 1) notFound()

  const supabase   = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const enrollment = await getEnrollmentBySlug(user!.id, slug, supabase)
  if (!enrollment) notFound()

  const totalDays = enrollment.program.total_days
  if (dayNumber > totalDays) notFound()

  const programDay = await getProgramDay(enrollment.program_id, dayNumber, supabase)

  return (
    <DayPageContent
      dayNumber={dayNumber}
      totalDays={totalDays}
      enrollmentId={enrollment.id}
      programId={enrollment.program_id}
      programName={enrollment.program.name}
      slug={slug}
      programDay={programDay}
    />
  )
}
