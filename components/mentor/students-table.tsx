'use client'

import Link from 'next/link'

interface StudentRow {
  id: string
  full_name: string | null
  role: string
  currentDay: number
  completedCount: number
  lastActivity: string | null
  tokensTotal: number
  tokensUsed: number
}

function timeAgo(iso: string | null) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'agora'
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

function roleBadge(role: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    bootcamp: { label: 'Bootcamp', color: 'var(--accent)',  bg: 'var(--accent-dim)'  },
    mentoria: { label: 'Mentoria', color: 'var(--purple)',  bg: 'var(--purple-dim)'  },
    mentor:   { label: 'Mentor',   color: 'var(--teal)',    bg: 'var(--teal-dim)'    },
    admin:    { label: 'Admin',    color: 'var(--orange)',  bg: 'var(--orange-dim)'  },
  }
  const s = map[role] ?? { label: role, color: 'var(--text3)', bg: 'var(--bg4)' }
  return (
    <span style={{
      fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 10,
      background: s.bg, color: s.color, textTransform: 'uppercase', letterSpacing: '.06em',
    }}>
      {s.label}
    </span>
  )
}

export function StudentsTable({ students }: { students: StudentRow[] }) {
  if (students.length === 0) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text4)', fontSize: 13 }}>
        Nenhum aluno cadastrado.
      </div>
    )
  }

  return (
    <>
      {/* ── Desktop: grid table ── */}
      <div className="students-table-desktop">
        {students.map((s, i) => {
          const usedPct = s.tokensTotal > 0 ? Math.min((s.tokensUsed / s.tokensTotal) * 100, 100) : 0
          const progressPct = Math.round((s.completedCount / 30) * 100)
          const isLast = i === students.length - 1

          return (
            <Link
              key={s.id}
              href={`/mentor/students/${s.id}`}
              className="mentor-student-row"
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 100px 80px 80px 120px 100px',
                padding: '12px 16px',
                borderBottom: isLast ? 'none' : '0.5px solid var(--border)',
                textDecoration: 'none',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                  {s.full_name ?? 'Sem nome'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 1 }}>
                  {s.id.slice(0, 8)}
                </div>
              </div>

              <div>{roleBadge(s.role)}</div>

              <div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 3 }}>
                  {s.completedCount}/30
                </div>
                <div style={{ height: 3, background: 'var(--bg4)', borderRadius: 2, width: 60, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    width: `${progressPct}%`,
                    background: progressPct >= 100 ? 'var(--green)' : 'var(--accent)',
                  }} />
                </div>
              </div>

              <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                Dia {s.currentDay}
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', marginBottom: 3 }}>
                  {(s.tokensTotal - s.tokensUsed).toLocaleString()} rest.
                </div>
                <div style={{ height: 3, background: 'var(--bg4)', borderRadius: 2, width: 90, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    width: `${100 - usedPct}%`,
                    background: usedPct > 90 ? 'var(--red)' : usedPct > 70 ? 'var(--orange)' : 'var(--purple)',
                  }} />
                </div>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                {timeAgo(s.lastActivity)}
              </div>
            </Link>
          )
        })}
      </div>

      {/* ── Mobile: card list ── */}
      <div className="students-table-mobile" style={{ display: 'none' }}>
        {students.map(s => {
          const usedPct = s.tokensTotal > 0 ? Math.min((s.tokensUsed / s.tokensTotal) * 100, 100) : 0
          const progressPct = Math.round((s.completedCount / 30) * 100)

          return (
            <Link
              key={s.id}
              href={`/mentor/students/${s.id}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px',
                borderBottom: '0.5px solid var(--border)',
                textDecoration: 'none',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: 'var(--bg3)', border: '0.5px solid var(--border2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 600, color: 'var(--text3)',
              }}>
                {(s.full_name ?? s.id).slice(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.full_name ?? 'Sem nome'}
                  </span>
                  {roleBadge(s.role)}
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text4)', fontFamily: 'var(--mono)' }}>
                    Dia {s.currentDay}
                  </span>
                  <div style={{ height: 3, background: 'var(--bg4)', borderRadius: 2, width: 48, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      width: `${progressPct}%`,
                      background: progressPct >= 100 ? 'var(--green)' : 'var(--accent)',
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text4)' }}>
                    {timeAgo(s.lastActivity)}
                  </span>
                </div>
                {/* Token bar */}
                <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ height: 2, background: 'var(--bg4)', borderRadius: 2, width: 80, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      width: `${100 - usedPct}%`,
                      background: usedPct > 90 ? 'var(--red)' : usedPct > 70 ? 'var(--orange)' : 'var(--purple)',
                    }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text4)', fontFamily: 'var(--mono)' }}>
                    {(s.tokensTotal - s.tokensUsed).toLocaleString()} tk
                  </span>
                </div>
              </div>

              {/* Chevron */}
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                style={{ width: 13, height: 13, color: 'var(--text4)', flexShrink: 0 }}>
                <polyline points="6,4 10,8 6,12" />
              </svg>
            </Link>
          )
        })}
      </div>
    </>
  )
}
