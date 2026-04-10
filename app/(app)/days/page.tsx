import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { WEEK_THEMES, getCurrentDay } from '@/lib/days'
import { ensureEnrollment, getProgramDays } from '@/lib/programs'

function getDayTags(cards: { type: string }[]): string[] {
  const types = new Set(cards.map(c => c.type))
  const tags: string[] = []
  if (types.has('ai'))      tags.push('ai')
  if (types.has('action'))  tags.push('action')
  if (types.has('reflect')) tags.push('retro')
  return tags
}

export default async function DaysRedirect() {
  const supabase   = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const enrollment = await ensureEnrollment(user!.id, supabase)
  const totalDays = enrollment?.program.total_days ?? 30

  const [
    programDays,
    { data: activities },
    { count: totalApplied },
    { count: responded },
    { count: keywordCount },
  ] = await Promise.all([
    enrollment ? getProgramDays(enrollment.program_id, supabase) : Promise.resolve([]),
    supabase.from('day_activities').select('day_number, status').eq('user_id', user!.id),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('user_id', user!.id).not('applied_at', 'is', null),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('user_id', user!.id).in('status', ['interviewing', 'offer']),
    supabase.from('keywords').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
  ])

  // Use program-specific week themes when available, fall back to bootcamp defaults
  const weekThemes: Record<number, string> = enrollment?.program.week_themes
    ? Object.fromEntries(
        Object.entries(enrollment.program.week_themes as Record<string, string>).map(([k, v]) => [Number(k), v])
      )
    : WEEK_THEMES

  const numWeeks = programDays.length > 0
    ? Math.max(...programDays.map(d => d.week_number))
    : 4

  const allActivities = activities ?? []
  const completedDayNumbers = allActivities
    .filter(a => a.status === 'done')
    .map(a => a.day_number)

  const currentDay = getCurrentDay(completedDayNumbers, totalDays)
  const statusMap = new Map(allActivities.map(a => [a.day_number, a.status]))

  const doneCount = completedDayNumbers.length
  const appliedCount = totalApplied ?? 0
  const responseRate = appliedCount > 0 ? Math.round(((responded ?? 0) / appliedCount) * 100) : null
  const kwCount = keywordCount ?? 0

  const weeks = Array.from({ length: numWeeks }, (_, i) => i + 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title="Todos os dias" subtitle={`${totalDays} dias · ${numWeeks} semanas`} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* ── Stats ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 10,
          marginBottom: 22,
        }}>
          {[
            { label: 'Dias concluídos', value: doneCount,    sub: `de ${totalDays}`,    color: 'var(--accent)' },
            { label: 'Aplicações',      value: appliedCount, sub: 'meta: 1/dia',         color: 'var(--green)' },
            { label: 'Taxa resposta',   value: responseRate !== null ? `${responseRate}%` : '—', sub: appliedCount === 0 ? 'cedo demais' : 'respostas', color: 'var(--orange)' },
            { label: 'Keywords',        value: kwCount,      sub: 'no banco',            color: 'var(--purple)' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{
              background: 'var(--bg2)',
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--r)',
              padding: '14px 16px',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>{label}</div>
              <div style={{ fontSize: 26, fontWeight: 500, fontFamily: 'var(--mono)', color }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{sub}</div>
            </div>
          ))}
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
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 8,
              }}>
                {weekDays.map((dayDef) => {
                  const day    = dayDef.day_number
                  const status    = statusMap.get(day) ?? 'pending'
                  const isDone    = status === 'done'
                  const isCurrent = day === currentDay
                  const isLocked  = day > currentDay
                  const tags      = getDayTags(dayDef.cards as { type: string }[])

                  const cardContent = (
                    <div style={{ padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 'var(--rsm)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 600, flexShrink: 0, fontFamily: 'var(--mono)',
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
                            <span style={{
                              fontSize: 9, padding: '2px 6px', borderRadius: 8,
                              background: 'var(--green-dim)', color: 'var(--green)',
                            }}>
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
                      background: 'var(--bg2)',
                      border: '0.5px solid var(--border)',
                      borderRadius: 'var(--r)', overflow: 'hidden',
                      opacity: 0.3,
                    }}>
                      {cardContent}
                    </div>
                  ) : (
                    <Link key={day} href={`/days/${day}`} style={{
                      display: 'block', textDecoration: 'none',
                      background: 'var(--bg2)',
                      border: `0.5px solid ${isCurrent ? 'rgba(228,253,139,.3)' : isDone ? 'rgba(74,222,128,.15)' : 'var(--border)'}`,
                      borderRadius: 'var(--r)', overflow: 'hidden',
                      transition: 'border-color .15s, background .15s',
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
