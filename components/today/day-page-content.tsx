import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { createServerClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { TodayCards } from '@/components/today/today-cards'
import { DayNotes } from '@/components/today/day-notes'
import { DAYS, WEEK_THEMES, getCurrentDay, getStreak } from '@/lib/days'
import type { DayDefinition, CardType } from '@/lib/days'
import { getProgramDay } from '@/lib/programs'
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

  // Resolve enrollment if not provided by parent
  let enrollmentId = enrollmentIdProp
  let programId = programIdProp
  let programName = programNameProp
  let slug = slugProp
  let totalDays = totalDaysProp ?? 30
  let programDay = programDayProp

  if (programDay === undefined) {
    // enrollment must be passed from parent — no auto-enrollment
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
    supabase
      .from('day_activities')
      .select('day_number, status, completed_at')
      .eq('user_id', user!.id)
      .eq('program_enrollment_id', enrollmentId ?? ''),
    supabase
      .from('day_activities')
      .select('status, checklist')
      .eq('user_id', user!.id)
      .eq('program_enrollment_id', enrollmentId ?? '')
      .eq('day_number', dayNumber)
      .maybeSingle(),
    (supabase as any)
      .from('action_notes')
      .select('id, title, content, type, checklist, completed, created_at')
      .eq('user_id', user!.id)
      .eq('program_enrollment_id', enrollmentId ?? '')
      .eq('day_number', dayNumber)
      .order('created_at', { ascending: true }),
    programDay === undefined && programId
      ? getProgramDay(programId, dayNumber, supabase)
      : Promise.resolve(programDay ?? null),
  ])

  if (programDay === undefined) programDay = resolvedProgramDay

  const allActivities = activities ?? []
  const completedDayNumbers = allActivities.filter(a => a.status === 'done').map(a => a.day_number)
  const streak = getStreak(allActivities)
  const currentDay = getCurrentDay(completedDayNumbers, totalDays)
  const doneCount = completedDayNumbers.length

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0]
    ?? (user?.email?.split('@')[0] ?? 'você')
  const activityStatus = activity?.status ?? 'pending'
  const savedState = (activity?.checklist as Record<string, boolean>) ?? {}

  // Build a DayDefinition-compatible object — from DB or fallback to hardcoded
  const dayDef: DayDefinition | undefined = programDay
    ? {
        number: dayNumber,
        week: programDay.week_number,
        name: programDay.name,
        description: programDay.description ?? '',
        cards: (programDay.cards as unknown as { type: string; title: string; description?: string; content?: string | { body: string }[] }[]).map(c => {
          const type: CardType = (c.type === 'ai' || c.type === 'action' || c.type === 'reflect' || c.type === 'learn') ? c.type : 'ai'

          // Normalise the text field: AI may save as "description" or "content" (string or block array)
          const rawContent = c.description
            ?? (Array.isArray(c.content)
              ? (c.content as { body: string }[]).map(b => b.body ?? '').join('\n')
              : typeof c.content === 'string' ? c.content : '')
            ?? ''

          const base = { type, title: c.title, preview: rawContent }

          const chatBase = `/chat?day=${dayNumber}${slug ? `&slug=${slug}` : ''}`

          if (type === 'action') {
            // Pipe-separated descriptions become checklist items
            const items = rawContent.split('|').map((s: string) => s.trim()).filter(Boolean)
            const isChecklist = items.length >= 2
            const prompt = `Quero começar o Dia ${dayNumber} — ${c.title}`
            return {
              ...base,
              content: isChecklist ? [] : (rawContent ? [{ body: rawContent }] : []),
              checklist: isChecklist ? items.map((label: string) => ({ label })) : undefined,
              cta: { label: 'Executar com IA', href: `${chatBase}&prompt=${encodeURIComponent(prompt)}` },
            }
          }

          if (type === 'ai') {
            const prompt = `Quero começar o Dia ${dayNumber} — ${c.title}`
            return {
              ...base,
              content: rawContent ? [{ body: rawContent }] : [],
              cta: { label: 'Iniciar sessão com mentor IA', href: `${chatBase}&prompt=${encodeURIComponent(prompt)}` },
            }
          }

          if (type === 'reflect') {
            const prompt = `Quero fazer a reflexão do Dia ${dayNumber}`
            return {
              ...base,
              content: rawContent ? [{ body: rawContent }] : [],
              cta: { label: 'Reflexão guiada', href: `/chat?day=${dayNumber}&mode=reflect${slug ? `&slug=${slug}` : ''}&prompt=${encodeURIComponent(prompt)}` },
            }
          }

          // learn — explicit CTA so description doesn't leak into the prompt
          const prompt = `Quero aprofundar o Dia ${dayNumber} — ${c.title}`
          return {
            ...base,
            content: rawContent ? [{ body: rawContent }] : [],
            cta: { label: 'Aprofundar com IA', href: `${chatBase}&prompt=${encodeURIComponent(prompt)}` },
          }
        }),
      }
    : DAYS.find(d => d.number === dayNumber)

  if (!dayDef) notFound()

  const nextDay: { day_number: number; week_number: number } | null = programDay
    ? await getProgramDay(programDay.program_id, dayNumber + 1, supabase).then(n => n ? { day_number: n.day_number, week_number: n.week_number } : null)
    : (() => { const n = DAYS.find(d => d.number === dayNumber + 1); return n ? { day_number: n.number, week_number: n.week } : null })()

  const hasPrev = dayNumber > 1
  const hasNext = dayNumber < totalDays && dayNumber < currentDay

  // Number of days in this week (for progress pips)
  const daysThisWeek = Math.min(7, totalDays - (dayDef.week - 1) * 7)
  const dayInWeek   = ((dayNumber - 1) % 7) + 1
  const completedInWeek = completedDayNumbers.filter(d => {
    const w = Math.ceil(d / 7)
    return w === dayDef.week && d !== dayNumber
  }).length

  // Render title: *word* → coral Instrument Serif italic  (e.g. "Experiências com *impacto* e métricas.")
  function renderTitle(name: string) {
    const parts = name.split(/(\*[^*]+\*)/)
    if (parts.length === 1) return <>{name}</>
    return (
      <>
        {parts.map((part, i) =>
          part.startsWith('*') && part.endsWith('*')
            ? <span key={i} className="accent">{part.slice(1, -1)}</span>
            : part
        )}
      </>
    )
  }

  // Topbar breadcrumb: ProgramName / Semana N / Dia N
  // .crumb-detail elements are hidden on mobile (≤768px)
  const breadcrumb = (
    <div className="topbar-crumb">
      <strong>{programName ?? 'Programa'}</strong>
      <span className="sep crumb-detail">/</span>
      <span className="crumb-detail">Semana {dayDef.week}</span>
      <span className="sep crumb-detail">/</span>
      <strong className="crumb-detail">Dia {dayNumber}</strong>
    </div>
  )

  // Nav arrows — shared style via className + small inline diff
  const arrowCls = "arrow-btn"

  return (
    <div className="page-col">
      <Topbar
        title={breadcrumb}
        streak={streak}
        actions={
          <div className="topbar-day-nav" style={{ display: 'flex', gap: 4 }}>
            {hasPrev ? (
              <Link href={`/${slug}/days/${dayNumber - 1}`} className={arrowCls} style={{ textDecoration: 'none' }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 13, height: 13 }}><polyline points="10,4 6,8 10,12" /></svg>
              </Link>
            ) : (
              <div className={arrowCls} style={{ opacity: 0.35, cursor: 'default' }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 13, height: 13 }}><polyline points="10,4 6,8 10,12" /></svg>
              </div>
            )}
            {hasNext ? (
              <Link href={`/${slug}/days/${dayNumber + 1}`} className={arrowCls} style={{ textDecoration: 'none' }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 13, height: 13 }}><polyline points="6,4 10,8 6,12" /></svg>
              </Link>
            ) : (
              <div className={arrowCls} style={{ opacity: 0.35, cursor: 'default' }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 13, height: 13 }}><polyline points="6,4 10,8 6,12" /></svg>
              </div>
            )}
          </div>
        }
      />

      <div className="page-scroll">
        <div className="page-content">

          {/* ── Greeting + Mini Dashboard (hoje only) ── */}
          {isToday && (
            <div className="today-greeting">
              <div className="today-greeting-hi">
                Oi, <strong>{firstName}</strong>{doneCount > 0 ? ` — de volta ao dia ${dayNumber}` : ' — bem-vindo ao programa'} 👋
              </div>
              {doneCount > 0 && (
                <div className="today-mini-stats">
                  <span><strong>{doneCount}</strong> de {totalDays} dias</span>
                  <span className="today-mini-sep">·</span>
                  <span>Semana <strong>{dayDef.week}</strong></span>
                  <span className="today-mini-sep">·</span>
                  <span><strong>{Math.round((doneCount / totalDays) * 100)}%</strong> completo</span>
                  {streak > 1 && (
                    <>
                      <span className="today-mini-sep">·</span>
                      <span>🔥 <strong>{streak}</strong> dias seguidos</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Day Header ── */}
          <div className="day-header">
            <div className="day-eyebrow">
              <span className="day-eyebrow-pill">Dia {dayNumber} · Semana {dayDef.week}</span>
              {dayDef.cards.some(c => c.type !== 'learn') && (
                <span className="day-eyebrow-meta">
                  {dayDef.cards
                    .map(c => c.type === 'ai' ? 'SESSÃO IA' : c.type === 'action' ? 'AÇÃO' : c.type === 'reflect' ? 'REFLEXÃO' : null)
                    .filter(Boolean).join(' + ')}
                </span>
              )}
            </div>

            <h1 className="day-title">{renderTitle(dayDef.name)}</h1>

            {dayDef.description && (
              <div className="day-sub">
                <ReactMarkdown>{dayDef.description}</ReactMarkdown>
              </div>
            )}

            {/* Progress pips — one per day in this week */}
            <div className="day-pips">
              {Array.from({ length: daysThisWeek }, (_, i) => {
                const pipDay    = (dayDef.week - 1) * 7 + i + 1
                const isDone    = completedDayNumbers.includes(pipDay)
                const isCurrent = pipDay === dayNumber
                return (
                  <div key={i} className={`pip${isDone ? ' done' : isCurrent ? ' current' : ''}`} />
                )
              })}
              <span className="pip-label">
                Semana {dayDef.week} · <strong>{dayInWeek}/{daysThisWeek} dias</strong>
              </span>
            </div>
          </div>

          {/* Welcome note on Day 1 */}
          {dayNumber === 1 && activityStatus === 'pending' && (
            <div className="day-welcome">
              <strong>Bem-vindo ao {programName ?? 'programa'}.</strong>{' '}
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
            weekThemes={WEEK_THEMES}
            slug={slugProp}
          />

          <DayNotes notes={dayNotes ?? []} />
        </div>
      </div>
    </div>
  )
}
