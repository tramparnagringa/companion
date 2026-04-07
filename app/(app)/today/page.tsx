import { createServerClient } from '@/lib/supabase/server'
import { getCurrentDay } from '@/lib/days'
import { ensureEnrollment, getProgramDay } from '@/lib/programs'
import { DayPageContent } from '@/components/today/day-page-content'

export default async function TodayPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const enrollment = await ensureEnrollment(user!.id, supabase)
  const totalDays = enrollment?.program.total_days ?? 30

  const { data: activities } = await supabase
    .from('day_activities')
    .select('day_number, status')
    .eq('user_id', user!.id)

  const completedDayNumbers = (activities ?? [])
    .filter(a => a.status === 'done')
    .map(a => a.day_number)

  const currentDay = getCurrentDay(completedDayNumbers, totalDays)

  const programDay = enrollment
    ? await getProgramDay(enrollment.program_id, currentDay, supabase)
    : null

  return (
    <DayPageContent
      dayNumber={currentDay}
      isToday
      totalDays={totalDays}
      enrollmentId={enrollment?.id}
      programDay={programDay}
    />
  )
}
