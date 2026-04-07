import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { ensureEnrollment } from '@/lib/programs'
import { DayPageContent } from '@/components/today/day-page-content'

interface Props {
  params: Promise<{ day: string }>
}

export default async function DayPage({ params }: Props) {
  const { day: dayParam } = await params
  const dayNumber = parseInt(dayParam, 10)

  if (isNaN(dayNumber) || dayNumber < 1) notFound()

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const enrollment = await ensureEnrollment(user!.id, supabase)
  const totalDays = enrollment?.program.total_days ?? 30

  if (dayNumber > totalDays) notFound()

  return (
    <DayPageContent
      dayNumber={dayNumber}
      totalDays={totalDays}
      enrollmentId={enrollment?.id}
    />
  )
}
