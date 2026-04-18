import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { getCurrentDay } from '@/lib/days'
import { getEnrollmentBySlug, getProgramDays } from '@/lib/programs'

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
    .from('day_activities').select('day_number, status')
    .eq('user_id', user!.id).eq('program_enrollment_id', enrollment.id)

  const allActivities       = activities ?? []
  const completedDayNumbers = allActivities.filter(a => a.status === 'done').map(a => a.day_number)
  const currentDay          = getCurrentDay(completedDayNumbers, totalDays)
  const statusMap           = new Map(allActivities.map(a => [a.day_number, a.status]))

  const doneCount = completedDayNumbers.length
  const weeks     = Array.from({ length: numWeeks }, (_, i) => i + 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title={enrollment.program.name} subtitle={`${totalDays} dias · ${numWeeks} semanas`} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* Progress */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>
              Dia {currentDay} de {totalDays}
              {doneCount > 0 && (
                <span style={{ marginLeft: 8, color: 'var(--text4)' }}>· {doneCount} concluído{doneCount !== 1 ? 's' : ''}</span>
              )}
            </span>
            <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
              {Math.round((doneCount / totalDays) * 100)}%
            </span>
          </div>
          <div style={{ height: 3, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${(doneCount / totalDays) * 100}%`,
              background: 'var(--accent)', transition: 'width .4s',
            }} />
          </div>
        </div>

        {weeks.map(week => {
          const weekDays = programDays.filter(d => d.week_number === week)
          return (
            <div key={week} style={{ marginBottom: 24 }}>
              <div style={{
                fontSize: 10, fontWeight: 600, letterSpacing: '.1em',
                textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 10,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {weekThemes[week] ?? `Semana ${week}`}
                <span style={{ flex: 1, height: '0.5px', background: 'var(--border)', display: 'block' }} />
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8,
              }}>
                {weekDays.map((dayDef) => {
                  const day       = dayDef.day_number
                  const status    = statusMap.get(day) ?? 'pending'
                  const isDone    = status === 'done'
                  const isCurrent = day === currentDay
                  const isLocked  = day > currentDay
                  const tags      = getDayTags(dayDef.cards)

                  const cardContent = (
                    <div style={{ padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 'var(--rsm)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 600, fontFamily: 'var(--mono)',
                        background: isDone ? 'var(--green-dim)' : isCurrent ? 'var(--accent)' : 'var(--bg4)',
                        color: isDone ? 'var(--green)' : isCurrent ? 'var(--accent-text)' : 'var(--text4)',
                      }}>
                        {String(day).padStart(2, '0')}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 500, overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          color: isCurrent ? 'var(--accent)' : isDone ? 'var(--text2)' : 'var(--text)',
                        }}>
                          {dayDef.name}
                        </div>
                        <div style={{ display: 'flex', gap: 3, marginTop: 5, flexWrap: 'wrap' }}>
                          {isDone ? (
                            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 8, background: 'var(--green-dim)', color: 'var(--green)' }}>
                              concluído
                            </span>
                          ) : tags.map(tag => (
                            <span key={tag} style={{
                              fontSize: 9, padding: '2px 6px', borderRadius: 8,
                              background: tag === 'ai' ? 'var(--purple-dim)' : tag === 'action' ? 'var(--green-dim)' : 'var(--orange-dim)',
                              color: tag === 'ai' ? 'var(--purple)' : tag === 'action' ? 'var(--green)' : 'var(--orange)',
                            }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )

                  return isLocked ? (
                    <div key={day} style={{
                      background: 'var(--bg2)', border: '0.5px solid var(--border)',
                      borderRadius: 'var(--r)', overflow: 'hidden', opacity: 0.3,
                    }}>
                      {cardContent}
                    </div>
                  ) : (
                    <Link key={day} href={`/${slug}/days/${day}`} style={{
                      display: 'block', textDecoration: 'none',
                      background: 'var(--bg2)',
                      border: `0.5px solid ${isCurrent ? 'rgba(228,253,139,.3)' : isDone ? 'rgba(74,222,128,.15)' : 'var(--border)'}`,
                      borderRadius: 'var(--r)', overflow: 'hidden', transition: 'border-color .15s, background .15s',
                    }}>
                      {cardContent}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
