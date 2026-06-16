import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getEnrollmentBySlug, getProgramDay } from '@/lib/programs'
import { DayPageContent } from '@/components/today/day-page-content'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ day: string }>
}): Promise<Metadata> {
  const { day } = await params
  const n = parseInt(day, 10)
  return { title: isNaN(n) ? 'Dia' : `Dia ${n}` }
}

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
  // No content for this day in the DB → this day doesn't exist for this program
  if (!programDay) notFound()

  return (
    <DayPageContent
      dayNumber={dayNumber}
      totalDays={totalDays}
      enrollmentId={enrollment.id}
      programId={enrollment.program_id}
      programName={enrollment.program.name}
      programWeekThemes={enrollment.program.week_themes as Record<string, string> | undefined}
      slug={slug}
      programDay={programDay}
    />
  )
}
