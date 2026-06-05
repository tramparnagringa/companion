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
  programDescription?: string | null
  programFeatures?: string[]
  programWeekThemes?: Record<string, string>
  slug?: string
  programDay?: ProgramDay | null
}

export async function DayPageContent({ dayNumber, isToday, totalDays: totalDaysProp, enrollmentId: enrollmentIdProp, programId: programIdProp, programName: programNameProp, programDescription, programFeatures, programWeekThemes, slug: slugProp, programDay: programDayProp }: Props) {
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

  // Hero: shown on any Day 1 view — gives program context on the first day
  const showHero = dayNumber === 1

  // Week chips — only from DB; if empty/missing, stepper doesn't render
  const weekChips: { week: number; theme: string }[] = programWeekThemes
    ? Object.entries(programWeekThemes)
        .map(([k, v]) => ({ week: parseInt(k, 10), theme: v.trim() }))
        .filter(c => !isNaN(c.week) && c.theme.length > 0)
        .sort((a, b) => a.week - b.week)
    : []

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

  const currentWeekTheme = programWeekThemes?.[String(dayDef.week)]

  // Topbar breadcrumb: ProgramName / Semana N / Dia N
  // .crumb-detail elements are hidden on mobile (≤768px)
  const breadcrumb = (
    <div className="topbar-crumb">
      <strong>{programName ?? 'Programa'}</strong>
      <span className="sep crumb-detail">/</span>
      <span className="crumb-detail">
        Semana {dayDef.week}{currentWeekTheme ? ` — ${currentWeekTheme}` : ''}
      </span>
      <span className="sep crumb-detail">/</span>
      <strong className="crumb-detail">Dia {dayNumber}</strong>
    </div>
  )

  // Nav arrows — shared style via className + small inline diff
  const arrowCls = "arrow-btn"

  return (
    <div className="page-col">
      <style>{`
        /* ── Day 1 program hero — two-panel card ───────────────── */
        .phero-card {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          border: 1.5px solid var(--tng-ink);
          border-radius: 18px;
          overflow: hidden;
          margin-bottom: 112px;
          max-width: 960px;
        }
        .phero-left {
          background: var(--tng-purple-900);
          padding: 36px 40px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        .phero-left-wm {
          position: absolute; right: -20px; bottom: -30px;
          font-size: 160px; line-height: 1; opacity: .05;
          transform: rotate(-10deg); pointer-events: none; user-select: none;
        }
        .phero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: var(--tng-font-mono); font-size: 11px; font-weight: 700;
          letter-spacing: .18em; text-transform: uppercase;
          color: var(--tng-lime); margin-bottom: 14px;
        }
        .phero-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--tng-lime); flex-shrink: 0; display: inline-block;
        }
        .phero-name {
          font-family: var(--tng-font-display); font-weight: 800;
          font-size: clamp(26px, 3.2vw, 36px); color: var(--tng-cream);
          line-height: 1.1; letter-spacing: -.03em; margin-bottom: 16px;
          position: relative; z-index: 1;
        }
        .phero-desc {
          font-size: 16px; color: var(--tng-night-ink2);
          line-height: 1.65; flex: 1; margin-bottom: 32px;
          position: relative; z-index: 1;
        }
        /* Week stepper */
        .phero-stepper {
          display: flex; align-items: flex-start;
          position: relative; z-index: 1;
        }
        .phero-stepper::before {
          content: '';
          position: absolute; top: 13px;
          left: 14px; right: 14px; height: 1px;
          background: rgba(255,255,255,.18);
        }
        .phero-step {
          display: flex; flex-direction: column; align-items: center;
          flex: 1; position: relative; z-index: 1;
        }
        .phero-step-circle {
          width: 28px; height: 28px; border-radius: 50%;
          background: transparent; border: 1.5px solid rgba(255,255,255,.22);
          color: rgba(255,255,255,.35);
          font-family: var(--tng-font-mono); font-size: 12px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 7px;
        }
        .phero-step-circle.ph-active {
          background: var(--tng-lime); border-color: var(--tng-lime);
          color: var(--tng-purple-900);
        }
        .phero-step-label {
          font-size: 10px; color: rgba(255,255,255,.3);
          text-align: center; white-space: nowrap; letter-spacing: .01em;
        }
        .phero-step-label.ph-active {
          color: var(--tng-cream); font-weight: 600;
        }
        /* Right panel */
        .phero-right {
          background: var(--tng-paper);
          padding: 36px 40px;
          display: flex; flex-direction: column;
          border-left: 1.5px solid var(--tng-ink);
        }
        .phero-features {
          list-style: none; padding: 0; margin: 0;
          display: flex; flex-direction: column; gap: 16px; flex: 1;
        }
        .phero-feature-item {
          display: flex; align-items: flex-start; gap: 12px;
          font-size: 15.5px; color: var(--tng-ink-2); line-height: 1.45;
        }
        .phero-check {
          width: 22px; height: 22px; border-radius: 50%;
          background: var(--tng-lime); flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          margin-top: 1px;
        }
        .phero-cta {
          display: flex; align-items: center; justify-content: center;
          margin-top: 32px; padding: 18px 28px;
          background: var(--tng-coral); color: #fff;
          border: 1.5px solid var(--tng-ink); border-radius: 999px;
          font-size: 17px; font-weight: 600; font-family: inherit;
          text-decoration: none; transition: transform .12s, box-shadow .12s;
        }
        .phero-cta:hover {
          transform: translate(-2px,-2px);
          box-shadow: 4px 4px 0 var(--tng-ink);
        }
        /* ── Stack below 1200px ─────────────────────────────────── */
        @media (max-width: 1200px) {
          .phero-card {
            grid-template-columns: 1fr;
            margin-bottom: 64px;
          }
          .phero-right {
            border-left: none;
            border-top: 1.5px solid var(--tng-ink);
            padding: 28px 28px;
          }
          .phero-left         { padding: 32px 28px 10px; }
          .phero-desc         { font-size: 15px; margin-bottom: 24px; }
          .phero-step-label   { font-size: 9.5px; }
          .phero-features     { gap: 13px; }
          .phero-feature-item { font-size: 14.5px; }
          .phero-cta          { font-size: 16px; padding: 16px 24px; margin-top: 24px; }
        }
      `}</style>
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

        {/* ── Program Hero (Day 1) — full-width, outside page-content ── */}
        {showHero && (() => {
          const features = (programFeatures && programFeatures.length > 0)
            ? programFeatures
            : [`${totalDays} dias guiados por IA com sessões diárias personalizadas`,
               'CV otimizado para recrutadores e sistemas ATS internacionais',
               'LinkedIn que atrai recrutadores 24h por dia',
               'Networking real com recrutadores das suas empresas-alvo',
               'Simulação de entrevistas com feedback imediato']
          return (
            <div className="phero-card">
              {/* Left: dark panel */}
              <div className="phero-left">
                <div className="phero-left-wm" aria-hidden>✌️</div>
                <img src="/logo-mark.svg" alt="" width={36} height={36}
                  style={{ marginBottom: 22, opacity: 0.9, position: 'relative', zIndex: 1 }} />
                <div className="phero-eyebrow">
                  <span className="phero-dot" />
                  Seu programa
                </div>
                <div className="phero-name">{programName ?? 'Bem-vindo'}</div>
                <div className="phero-desc">
                  {programDescription
                    ? programDescription
                    : `${totalDays} dias para sair do zero a entrevistas internacionais. Aplicações diárias, CV otimizado, LinkedIn irresistível e networking real com recrutadores.`}
                </div>
                {weekChips.length > 0 && (
                  <div className="phero-stepper">
                    {weekChips.map(({ week, theme }) => {
                      const active = week === dayDef.week
                      return (
                        <div key={week} className="phero-step">
                          <div className={`phero-step-circle${active ? ' ph-active' : ''}`}>
                            {week}
                          </div>
                          <div className={`phero-step-label${active ? ' ph-active' : ''}`}>
                            {theme}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Right: features + CTA */}
              <div className="phero-right">
                <ul className="phero-features">
                  {features.map((f, i) => (
                    <li key={i} className="phero-feature-item">
                      <span className="phero-check" aria-hidden>
                        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor"
                          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                          width="10" height="10" style={{ color: 'var(--tng-purple-900)' }}>
                          <polyline points="2,6.5 5,9.5 10,2.5" />
                        </svg>
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="#day-content" className="phero-cta">
                  Começar Dia 1 →
                </a>
              </div>
            </div>
          )
        })()}

        <div className="page-content">

          {/* ── Greeting + Mini Dashboard (returning user, hoje only) ── */}
          {isToday && !showHero && (
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
          <div id="day-content" className="day-header" style={{ scrollMarginTop: '32px' }}>
            <div className="day-eyebrow">
              <span className="day-eyebrow-pill">Dia {dayNumber} · Semana {dayDef.week}{currentWeekTheme ? ` — ${currentWeekTheme}` : ''}</span>
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
                Semana {dayDef.week}{currentWeekTheme ? ` — ${currentWeekTheme}` : ''} · <strong>{dayInWeek}/{daysThisWeek} dias</strong>
              </span>
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
            slug={slugProp}
          />

          <DayNotes notes={dayNotes ?? []} />
        </div>
      </div>
    </div>
  )
}
