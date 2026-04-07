import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { TodayCards } from '@/components/today/today-cards'
import { DayNotes } from '@/components/today/day-notes'
import { DAYS, WEEK_THEMES, getCurrentDay, getStreak } from '@/lib/days'
import type { DayDefinition } from '@/lib/days'
import { ensureEnrollment, getProgramDay } from '@/lib/programs'
import type { ProgramDay } from '@/lib/programs'
import { notFound } from 'next/navigation'

interface Props {
  dayNumber: number
  isToday?: boolean
  totalDays?: number
  enrollmentId?: string
  programDay?: ProgramDay | null
}

export async function DayPageContent({ dayNumber, isToday, totalDays: totalDaysProp, enrollmentId: enrollmentIdProp, programDay: programDayProp }: Props) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Resolve enrollment if not provided by parent
  let enrollmentId = enrollmentIdProp
  let totalDays = totalDaysProp ?? 30
  let programDay = programDayProp
  let programId: string | undefined

  if (programDay === undefined) {
    const enrollment = await ensureEnrollment(user!.id, supabase)
    if (enrollment) {
      enrollmentId = enrollment.id
      totalDays = enrollment.program.total_days
      programId = enrollment.program_id
    }
  } else if (programDay) {
    programId = programDay.program_id
  }

  // Parallel fetch: all activities (streak + progress) + current day state + notes + programDay
  const [
    { data: activities },
    { data: activity },
    { data: dayNotes },
    resolvedProgramDay,
  ] = await Promise.all([
    supabase.from('day_activities').select('day_number, status, completed_at').eq('user_id', user!.id),
    supabase.from('day_activities').select('status, checklist').eq('user_id', user!.id).eq('day_number', dayNumber).maybeSingle(),
    (supabase as any).from('action_notes').select('id, title, content, type, checklist, completed, created_at').eq('user_id', user!.id).eq('day_number', dayNumber).order('created_at', { ascending: true }),
    programDay === undefined && programId ? getProgramDay(programId, dayNumber, supabase) : Promise.resolve(programDay ?? null),
  ])

  if (programDay === undefined) programDay = resolvedProgramDay

  const allActivities = activities ?? []
  const completedDayNumbers = allActivities.filter(a => a.status === 'done').map(a => a.day_number)
  const streak = getStreak(allActivities)
  const currentDay = getCurrentDay(completedDayNumbers, totalDays)
  const activityStatus = activity?.status ?? 'pending'
  const savedState = (activity?.checklist as Record<string, boolean>) ?? {}

  const dayDef: DayDefinition | undefined = programDay
    ? { number: dayNumber, week: programDay.week_number, name: programDay.name, description: programDay.description ?? '', cards: programDay.cards }
    : DAYS.find(d => d.number === dayNumber)

  if (!dayDef) notFound()

  const nextDay: { day_number: number; week_number: number } | null = programDay
    ? await getProgramDay(programDay.program_id, dayNumber + 1, supabase).then(n => n ? { day_number: n.day_number, week_number: n.week_number } : null)
    : (() => { const n = DAYS.find(d => d.number === dayNumber + 1); return n ? { day_number: n.number, week_number: n.week } : null })()

  const hasPrev = dayNumber > 1
  const hasNext = dayNumber < totalDays && dayNumber < currentDay

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar
        title={isToday ? `Hoje · Dia ${dayNumber}` : `Dia ${dayNumber}`}
        subtitle={`${dayDef.name} — ${dayDef.cards.length} atividades`}
        streak={streak}
        actions={
          <div style={{ display: 'flex', gap: 2 }}>
            {hasPrev ? (
              <Link href={`/days/${dayNumber - 1}`} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 'var(--rsm)',
                border: '0.5px solid var(--border)', background: 'var(--bg3)',
                color: 'var(--text3)', textDecoration: 'none',
              }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13 }}>
                  <polyline points="10,4 6,8 10,12" />
                </svg>
              </Link>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 'var(--rsm)',
                border: '0.5px solid var(--border)', background: 'var(--bg3)',
                color: 'var(--text4)', opacity: 0.35, cursor: 'default',
              }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13 }}>
                  <polyline points="10,4 6,8 10,12" />
                </svg>
              </div>
            )}
            {hasNext ? (
              <Link href={`/days/${dayNumber + 1}`} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 'var(--rsm)',
                border: '0.5px solid var(--border)', background: 'var(--bg3)',
                color: 'var(--text3)', textDecoration: 'none',
              }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13 }}>
                  <polyline points="6,4 10,8 6,12" />
                </svg>
              </Link>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 'var(--rsm)',
                border: '0.5px solid var(--border)', background: 'var(--bg3)',
                color: 'var(--text4)', opacity: 0.35, cursor: 'default',
              }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13 }}>
                  <polyline points="6,4 10,8 6,12" />
                </svg>
              </div>
            )}
          </div>
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '.1em',
            textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 3,
          }}>
            Dia {dayNumber} · Semana {dayDef.week}
          </div>
          <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>
            {dayDef.name}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65, maxWidth: 520 }}>
            {dayDef.description}
          </div>
        </div>

        <TodayCards
          dayDef={dayDef}
          dayNumber={dayNumber}
          savedState={savedState}
          alreadyCompleted={activityStatus === 'done'}
          totalDays={totalDays}
          enrollmentId={enrollmentId}
          nextDay={nextDay}
          weekThemes={WEEK_THEMES}
        />

        <DayNotes notes={dayNotes ?? []} />

        {dayNumber === 1 && activityStatus === 'pending' && (
          <div style={{
            marginTop: 24, maxWidth: 640,
            background: 'var(--accent-dim)',
            border: '0.5px solid rgba(228,253,139,.2)',
            borderRadius: 'var(--r)',
            padding: '12px 16px',
            fontSize: 12, color: 'var(--text2)', lineHeight: 1.65,
          }}>
            <span style={{ color: 'var(--accent)', fontWeight: 500 }}>Bem-vindo ao TNG Bootcamp.</span>{' '}
            Comece pelo primeiro card — a IA já tem seu contexto e vai guiar você do início.
          </div>
        )}
      </div>
    </div>
  )
}
