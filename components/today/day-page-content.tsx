import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { TodayCards } from '@/components/today/today-cards'
import { DayNotes } from '@/components/today/day-notes'
import { DAYS, getCurrentDay, getStreak } from '@/lib/days'
import type { DayDefinition, CardType } from '@/lib/days'
import { ensureEnrollment, getProgramDay } from '@/lib/programs'
import type { ProgramDay } from '@/lib/programs'
import { notFound } from 'next/navigation'

interface Props {
  dayNumber: number
  isToday?: boolean
  totalDays?: number
  enrollmentId?: string
  programId?: string
  programName?: string
  slug?: string
  programDay?: ProgramDay | null
}

export async function DayPageContent({ dayNumber, isToday, totalDays: totalDaysProp, enrollmentId: enrollmentIdProp, programId: programIdProp, programName: programNameProp, slug: slugProp, programDay: programDayProp }: Props) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Resolve enrollment if programDay not passed
  let enrollmentId = enrollmentIdProp
  let programId = programIdProp
  let programName = programNameProp
  let slug = slugProp
  let totalDays = totalDaysProp ?? 30
  let programDay = programDayProp

  if (programDay === undefined) {
    const enrollment = await ensureEnrollment(user!.id, supabase)
    if (enrollment) {
      enrollmentId = enrollment.id
      programId = enrollment.program_id
      programName = enrollment.program.name
      slug = enrollment.program.slug
      totalDays = enrollment.program.total_days
      programDay = await getProgramDay(enrollment.program_id, dayNumber, supabase)
    }
  }

  const { data: activities } = await supabase
    .from('day_activities')
    .select('day_number, status, completed_at')
    .eq('user_id', user!.id)
    .eq('program_enrollment_id', enrollmentId ?? '')

  const allActivities = activities ?? []
  const completedDayNumbers = allActivities.filter(a => a.status === 'done').map(a => a.day_number)
  const streak = getStreak(allActivities)

  const currentDay = getCurrentDay(completedDayNumbers, totalDays)

  // Build a DayDefinition-compatible object — from DB or fallback to hardcoded
  const dayDef: DayDefinition | undefined = programDay
    ? {
        number: dayNumber,
        week: programDay.week_number,
        name: programDay.name,
        description: programDay.description ?? '',
        cards: (programDay.cards as unknown as { type: string; title: string; description: string }[]).map(c => {
          const type: CardType = (c.type === 'ai' || c.type === 'action' || c.type === 'reflect' || c.type === 'learn') ? c.type : 'ai'
          const base = { type, title: c.title, preview: c.description }

          if (type === 'action') {
            const prompt = `Dia ${dayNumber} — ${c.title}. ${c.description}`
            return {
              ...base,
              content: c.description ? [{ body: c.description }] : [],
              cta: { label: 'Executar com IA', href: `/chat?day=${dayNumber}${slug ? `&slug=${slug}` : ''}&prompt=${encodeURIComponent(prompt)}` },
            }
          }

          if (type === 'ai') {
            const prompt = `Dia ${dayNumber} — ${c.title}. ${c.description}`
            return {
              ...base,
              content: c.description ? [{ body: c.description }] : [],
              cta: { label: 'Iniciar sessão com mentor IA', href: `/chat?day=${dayNumber}${slug ? `&slug=${slug}` : ''}&prompt=${encodeURIComponent(prompt)}` },
            }
          }

          if (type === 'reflect') {
            const prompt = `Dia ${dayNumber} — ${c.title}. ${c.description} Quero fazer uma reflexão guiada.`
            return {
              ...base,
              content: c.description ? [{ body: c.description }] : [],
              cta: { label: 'Reflexão guiada', href: `/chat?day=${dayNumber}&mode=reflect${slug ? `&slug=${slug}` : ''}&prompt=${encodeURIComponent(prompt)}` },
            }
          }

          // learn
          return { ...base, content: c.description ? [{ body: c.description }] : [] }
        }),
      }
    : DAYS.find(d => d.number === dayNumber)

  if (!dayDef) notFound()

  // Fetch next day for completion banners
  let nextDay: { day_number: number; week_number: number } | null = null
  if (programDay && enrollmentId) {
    const next = await getProgramDay(programDay.program_id, dayNumber + 1, supabase)
    if (next) nextDay = { day_number: next.day_number, week_number: next.week_number }
  } else {
    const next = DAYS.find(d => d.number === dayNumber + 1)
    if (next) nextDay = { day_number: next.number, week_number: next.week }
  }

  // Week themes — from program or fallback to hardcoded WEEK_THEMES
  const weekThemes: Record<string, string> = programDay
    ? {} // program week_themes come from the program row; we'd need to pass them — use WEEK_THEMES as fallback
    : { 1: 'Semana 1 — Clareza', 2: 'Semana 2 — Construção', 3: 'Semana 3 — Escalar', 4: 'Semana 4 — Performar' }

  const { data: activity } = await supabase
    .from('day_activities')
    .select('status, checklist')
    .eq('user_id', user!.id)
    .eq('program_enrollment_id', enrollmentId ?? '')
    .eq('day_number', dayNumber)
    .single()

  const activityStatus = activity?.status ?? 'pending'
  const savedState = (activity?.checklist as Record<string, boolean>) ?? {}

  const { data: dayNotes } = await (supabase as any)
    .from('action_notes')
    .select('id, title, content, type, checklist, completed, created_at')
    .eq('user_id', user!.id)
    .eq('program_enrollment_id', enrollmentId ?? '')
    .eq('day_number', dayNumber)
    .order('created_at', { ascending: true })

  const hasPrev = dayNumber > 1
  const hasNext = dayNumber < totalDays && dayNumber < currentDay

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar
        title={isToday
          ? `Hoje: ${programName ?? 'Programa'} · Dia ${dayNumber}`
          : `${programName ?? 'Programa'} · Dia ${dayNumber}`}
        streak={streak}
        actions={
          <div style={{ display: 'flex', gap: 2 }}>
            {hasPrev ? (
              <Link href={`/${slug}/days/${dayNumber - 1}`} style={{
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
              <Link href={`/${slug}/days/${dayNumber + 1}`} style={{
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
        {/* Day header */}
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
          <div style={{
            fontSize: 13, color: 'var(--text2)',
            lineHeight: 1.65, maxWidth: 520,
          }}>
            {dayDef.description}
          </div>
        </div>

        {dayNumber === 1 && activityStatus === 'pending' && (
          <div style={{
            marginBottom: 16, maxWidth: 640,
            background: 'var(--accent-dim)',
            border: '0.5px solid rgba(228,253,139,.2)',
            borderRadius: 'var(--r)',
            padding: '12px 16px',
            fontSize: 12, color: 'var(--text2)', lineHeight: 1.65,
          }}>
            <span style={{ color: 'var(--accent)', fontWeight: 500 }}>Bem-vindo ao {programName ?? 'programa'}.</span>{' '}
            Comece pelo primeiro card — a IA já tem seu contexto e vai guiar você do início.
          </div>
        )}

        <TodayCards
          dayDef={dayDef}
          dayNumber={dayNumber}
          savedState={savedState}
          alreadyCompleted={activityStatus === 'done'}
          totalDays={totalDays}
          enrollmentId={enrollmentId}
          nextDay={nextDay}
          weekThemes={weekThemes}
          slug={slugProp}
        />

        <DayNotes notes={dayNotes ?? []} />
      </div>
    </div>
  )
}
