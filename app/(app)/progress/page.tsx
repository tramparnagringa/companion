import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { DAYS, WEEK_THEMES, getCurrentDay, getStreak } from '@/lib/days'

export default async function ProgressPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: activities }, { data: jobs }, { data: keywords }] = await Promise.all([
    supabase.from('day_activities').select('day_number, status, completed_at').eq('user_id', user!.id),
    supabase.from('jobs').select('status').eq('user_id', user!.id),
    supabase.from('keywords').select('word, frequency').eq('user_id', user!.id).order('frequency', { ascending: false }).limit(30),
  ])

  const allActivities = activities ?? []
  const completedDayNumbers = allActivities.filter(a => a.status === 'done').map(a => a.day_number)
  const currentDay    = getCurrentDay(completedDayNumbers)
  const streak        = getStreak(allActivities)

  const doneCount     = completedDayNumbers.length
  const appliedCount  = jobs?.filter(j => j.status === 'applied').length ?? 0
  const responseCount = jobs?.filter(j => ['interviewing', 'offer'].includes(j.status)).length ?? 0
  const responseRate  = appliedCount > 0 ? Math.round((responseCount / appliedCount) * 100) : 0

  const statusMap = new Map(allActivities.map(a => [a.day_number, a.status]))

  const weeks = [1, 2, 3, 4]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{`
        .progress-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
          margin-bottom: 22px;
        }
        .progress-heatmap-weeks {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .progress-heatmap-week {
          flex: 1 1 0;
          min-width: 0;
        }
        @media (max-width: 600px) {
          .progress-stats {
            grid-template-columns: 1fr;
          }
          .progress-heatmap-weeks {
            flex-direction: column;
            gap: 14px;
          }
          .progress-heatmap-week {
            flex: none;
            width: 100%;
          }
        }
      `}</style>
      <Topbar title="Progresso" subtitle="Sua jornada de 30 dias" streak={streak} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

        {/* Stats grid */}
        <div className="progress-stats">
          {[
            { label: 'Dias completos', value: doneCount, sub: 'de 30', color: 'var(--text)' },
            { label: 'Vagas aplicadas', value: appliedCount, sub: 'total', color: 'var(--text)' },
            { label: 'Taxa de resposta', value: `${responseRate}%`, sub: 'entrevistas / aplicações', color: responseRate > 20 ? 'var(--green)' : 'var(--text)' },
            { label: 'Keywords salvas', value: keywords?.length ?? 0, sub: 'no banco', color: 'var(--text)' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} style={{
              background: 'var(--bg2)', border: '0.5px solid var(--border)',
              borderRadius: 'var(--r)', padding: '14px 16px',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>{label}</div>
              <div style={{ fontSize: 26, fontWeight: 500, fontFamily: 'var(--mono)', color }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Heatmap por semana */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 12 }}>
            Mapa dos 30 dias
          </div>
          <div className="progress-heatmap-weeks">
            {weeks.map(week => {
              const weekDays = DAYS.filter(d => d.week === week)
              return (
                <div key={week} className="progress-heatmap-week">
                  <div style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: '.1em',
                    textTransform: 'uppercase', color: 'var(--text4)',
                    marginBottom: 6,
                  }}>
                    {WEEK_THEMES[week] ?? `Semana ${week}`}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {weekDays.map(({ number: day, name }) => {
                      const status    = statusMap.get(day)
                      const isDone    = status === 'done'
                      const isCurrent = day === currentDay
                      const isLocked  = day > currentDay

                      const cell = (
                        <div title={`Dia ${day} · ${name}`} style={{
                          width: 28, height: 28, borderRadius: 4,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, fontWeight: 500, fontFamily: 'var(--mono)',
                          background: isDone ? 'var(--green-dim)' : isCurrent ? 'var(--accent)' : 'var(--bg3)',
                          color: isDone ? 'var(--green)' : isCurrent ? 'var(--accent-text)' : 'var(--text4)',
                          border: isDone
                            ? '0.5px solid rgba(74,222,128,.2)'
                            : isCurrent
                            ? '0.5px solid rgba(228,253,139,.3)'
                            : '0.5px solid transparent',
                          transition: 'opacity .1s, transform .1s',
                        }}>
                          {day}
                        </div>
                      )

                      return isLocked ? (
                        <div key={day} style={{ opacity: 0.3 }}>{cell}</div>
                      ) : (
                        <Link key={day} href={`/days/${day}`} style={{ display: 'block', textDecoration: 'none' }}>
                          {cell}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Keyword cloud */}
        {keywords && keywords.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 10 }}>
              Keywords mais frequentes
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {keywords.map(kw => (
                <span key={kw.word} style={{
                  fontSize: 11, padding: '4px 10px', borderRadius: 20,
                  background: (kw.frequency ?? 1) > 3 ? 'var(--purple-dim)' : 'var(--bg3)',
                  color: (kw.frequency ?? 1) > 3 ? 'var(--purple)' : 'var(--text2)',
                  border: '0.5px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  {kw.word}
                  <span style={{ fontSize: 9, opacity: 0.6, fontFamily: 'var(--mono)' }}>{kw.frequency}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
