import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createServerClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { LogoMark } from '@/components/ui/logo-mark'
import { getCurrentDay, getStreak } from '@/lib/days'
import { getEnrollmentBySlug, getProgramDays } from '@/lib/programs'

export const metadata: Metadata = { title: 'Programa' }

function getDayTags(cards: { type: string }[]): string[] {
  const types = new Set(cards.map(c => c.type))
  const tags: string[] = []
  if (types.has('ai'))      tags.push('ai')
  if (types.has('action'))  tags.push('action')
  if (types.has('reflect')) tags.push('retro')
  return tags
}

export default async function ProgramDaysPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase  = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const enrollment = await getEnrollmentBySlug(user!.id, slug, supabase)
  if (!enrollment) notFound()

  const totalDays   = enrollment.program.total_days
  const weekThemes: Record<number, string> = enrollment.program.week_themes
    ? Object.fromEntries(
        Object.entries(enrollment.program.week_themes as Record<string, string>).map(([k, v]) => [Number(k), v])
      )
    : { 1: 'Semana 1', 2: 'Semana 2', 3: 'Semana 3', 4: 'Semana 4' }

  const programDays = await getProgramDays(enrollment.program_id, supabase)
  const numWeeks    = programDays.length > 0 ? Math.max(...programDays.map(d => d.week_number)) : 4

  const { data: activities } = await supabase
    .from('day_activities').select('day_number, status, completed_at')
    .eq('user_id', user!.id).eq('program_enrollment_id', enrollment.id)

  const allActivities       = activities ?? []
  const completedDayNumbers = allActivities.filter(a => a.status === 'done').map(a => a.day_number)
  const currentDay          = getCurrentDay(completedDayNumbers, totalDays)
  const statusMap           = new Map(allActivities.map(a => [a.day_number, a.status]))
  const streak              = getStreak(allActivities)

  const doneCount    = completedDayNumbers.length
  const weeks        = Array.from({ length: numWeeks }, (_, i) => i + 1)
  const currentWeek  = programDays.find(d => d.day_number === currentDay)?.week_number ?? 1
  const weekChips    = Object.entries(weekThemes)
    .map(([k, v]) => ({ week: parseInt(k, 10), theme: String(v).trim() }))
    .filter(c => !isNaN(c.week) && c.theme.length > 0)
    .sort((a, b) => a.week - b.week)
  const features: string[] = (enrollment.program as { features?: string[] }).features?.length
    ? (enrollment.program as { features?: string[] }).features!
    : [`${totalDays} dias guiados por IA com sessões diárias personalizadas`,
       'CV otimizado para recrutadores e sistemas ATS internacionais',
       'LinkedIn que atrai recrutadores 24h por dia',
       'Networking real com recrutadores das suas empresas-alvo',
       'Simulação de entrevistas com feedback imediato']

  // Breadcrumb matching the day/hoje topbar style
  const breadcrumb = (
    <div className="topbar-crumb">
      <strong>{enrollment.program.name}</strong>
      <span className="sep crumb-detail">/</span>
      <span className="crumb-detail">O Programa</span>
      <span className="sep crumb-detail">/</span>
      {doneCount >= totalDays ? (
        <strong className="crumb-detail">Concluído</strong>
      ) : (
        <span className="crumb-detail">Dia {currentDay} de {totalDays}</span>
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title={breadcrumb} streak={streak} />

      <div className="prog-wrap">

        {/* ── Program hero card ── */}
        <div className="phero-card">
          <div className="phero-left">
            <div className="phero-left-wm" aria-hidden>✌️</div>
            <LogoMark size={32} style={{ marginBottom: 20, opacity: 0.9, position: 'relative', zIndex: 1 }} />
            <div className="phero-eyebrow">
              <span className="phero-dot" />
              Seu programa
            </div>
            <div className="phero-name">{enrollment.program.name}</div>
            {enrollment.program.description && (
              <div className="phero-desc">{enrollment.program.description}</div>
            )}
            {weekChips.length > 0 && (
              <div className="phero-stepper">
                {weekChips.map(({ week, theme }) => (
                  <div key={week} className="phero-step">
                    <div className={`phero-step-circle${week === currentWeek ? ' ph-active' : ''}`}>{week}</div>
                    <div className={`phero-step-label${week === currentWeek ? ' ph-active' : ''}`}>{theme}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="phero-right">
            <ul className="phero-features">
              {features.map((f, i) => (
                <li key={i} className="phero-feature-item">
                  <span className="phero-check" aria-hidden>
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="10" height="10" style={{ color: 'var(--tng-purple-900)' }}>
                      <polyline points="2,6.5 5,9.5 10,2.5" />
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Link href={`/${slug}/days/${currentDay}`} className="phero-cta">
              {doneCount === 0 ? 'Começar Dia 1 →' : `Continuar — Dia ${currentDay} →`}
            </Link>
          </div>
        </div>

        <div className="prog-weeks">
          {weeks.map(week => {
            const weekDays = programDays.filter(d => d.week_number === week)
            return (
              <div key={week}>
                <div className="prog-week-label">
                  {weekThemes[week] ?? `Semana ${week}`}
                </div>
                <div className="prog-week-grid">
                  {weekDays.map((dayDef) => {
                    const day       = dayDef.day_number
                    const status    = statusMap.get(day) ?? 'pending'
                    const isDone    = status === 'done'
                    const isCurrent = day === currentDay
                    const isLocked  = day > currentDay
                    const tags      = getDayTags(dayDef.cards)
                    const stateClass = isDone ? 'done' : isCurrent ? 'current' : isLocked ? 'locked' : ''

                    const inner = (
                      <>
                        <div className={`prog-day-num${isDone ? ' done' : isCurrent ? ' current' : ''}`}>
                          {String(day).padStart(2, '0')}
                        </div>
                        <div className="prog-day-body">
                          <div className={`prog-day-title${stateClass ? ` ${stateClass}` : ''}`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ children }) => <>{children}</> }}>
                              {dayDef.name}
                            </ReactMarkdown>
                          </div>
                          <div className="prog-day-badges">
                            {isDone ? (
                              <span className="prog-badge b-done">concluído</span>
                            ) : tags.map(tag => (
                              <span key={tag} className={`prog-badge b-${tag}`}>{tag}</span>
                            ))}
                          </div>
                        </div>
                      </>
                    )

                    return isLocked ? (
                      <div key={day} className={`prog-day-card ${stateClass}`}>
                        {inner}
                      </div>
                    ) : (
                      <Link key={day} href={`/${slug}/days/${day}`} className={`prog-day-card ${stateClass}`}>
                        {inner}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
