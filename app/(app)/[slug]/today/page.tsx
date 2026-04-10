import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentDay } from '@/lib/days'
import { getEnrollmentBySlug, getProgramDay } from '@/lib/programs'
import { DayPageContent } from '@/components/today/day-page-content'

export default async function ProgramTodayPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase  = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const enrollment = await getEnrollmentBySlug(user!.id, slug, supabase)
  if (!enrollment) notFound()

  const totalDays = enrollment.program.total_days

  const { data: activities } = await supabase
    .from('day_activities')
    .select('day_number, status')
    .eq('user_id', user!.id)
    .eq('program_enrollment_id', enrollment.id)

  const completedDayNumbers = (activities ?? [])
    .filter(a => a.status === 'done')
    .map(a => a.day_number)

  const currentDay = getCurrentDay(completedDayNumbers, totalDays)

  const programDay = await getProgramDay(enrollment.program_id, currentDay, supabase)

  return (
    <DayPageContent
      dayNumber={currentDay}
      isToday
      totalDays={totalDays}
      enrollmentId={enrollment.id}
      programId={enrollment.program_id}
      programName={enrollment.program.name}
      slug={slug}
      programDay={programDay}
    />
  )
}
