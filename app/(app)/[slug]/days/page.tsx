import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createServerClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
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

  const doneCount = completedDayNumbers.length
  const weeks     = Array.from({ length: numWeeks }, (_, i) => i + 1)

  // Breadcrumb matching the day/hoje topbar style
  const breadcrumb = (
    <div className="topbar-crumb">
      <strong>{enrollment.program.name}</strong>
      <span className="sep crumb-detail">/</span>
      <span className="crumb-detail">Dia {currentDay} de {totalDays}</span>
      {doneCount > 0 && (
        <>
          <span className="sep crumb-detail">/</span>
          <strong className="crumb-detail">{doneCount} concluído{doneCount !== 1 ? 's' : ''}</strong>
        </>
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title={breadcrumb} streak={streak} />

      <div className="prog-wrap">

        {/* ── Program Hero ── */}
        <div className="prog-hero">
          <div className="prog-hero-eyebrow">
            <span className="prog-hero-pill">{totalDays} dias · {numWeeks} semana{numWeeks !== 1 ? 's' : ''}</span>
          </div>
          <h1 className="prog-hero-title">{enrollment.program.name}</h1>
          {enrollment.program.description && (
            <p className="prog-hero-desc">{enrollment.program.description}</p>
          )}
          <div className="prog-hero-bar-wrap">
            <div
              className="prog-hero-bar-fill"
              style={{ width: `${totalDays > 0 ? Math.round((doneCount / totalDays) * 100) : 0}%` }}
            />
          </div>
          <div className="prog-hero-stats">
            <span>Dia <strong>{currentDay}</strong> de {totalDays}</span>
            <span className="prog-hero-sep">·</span>
            <span><strong>{doneCount}</strong> concluído{doneCount !== 1 ? 's' : ''}</span>
            <span className="prog-hero-sep">·</span>
            <span><strong>{totalDays > 0 ? Math.round((doneCount / totalDays) * 100) : 0}%</strong> completo</span>
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
