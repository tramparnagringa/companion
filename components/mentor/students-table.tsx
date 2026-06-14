'use client'

import Link from 'next/link'

interface StudentRow {
  id: string
  full_name: string | null
  email?: string | null
  role: string | null
  currentDay: number
  completedCount: number
  lastActivity: string | null
  tokensTotal: number
  tokensUsed: number
}

function timeAgo(iso: string | null) {
  if (!iso) return 'nunca'
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'agora'
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

function isActiveThisWeek(iso: string | null) {
  if (!iso) return false
  return Date.now() - new Date(iso).getTime() < 7 * 24 * 3_600_000
}

const ROLE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  student: { label: 'Aluno',  color: 'var(--accent)',  bg: 'var(--accent-dim)'  },
  mentor:  { label: 'Mentor', color: 'var(--teal)',    bg: 'var(--teal-dim)'    },
  admin:   { label: 'Admin',  color: 'var(--orange)',  bg: 'var(--orange-dim)'  },
}

function StudentCard({ s, basePath }: { s: StudentRow; basePath: string }) {
  const usedPct    = s.tokensTotal > 0 ? Math.min((s.tokensUsed / s.tokensTotal) * 100, 100) : 0
  const remaining  = s.tokensTotal - s.tokensUsed
  const role       = ROLE_MAP[s.role ?? ''] ?? { label: s.role ?? '—', color: 'var(--text3)', bg: 'var(--bg4)' }
  const initials   = (s.full_name ?? s.id).slice(0, 2).toUpperCase()

  return (
    <Link href={`${basePath}/${s.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--bg2)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--r)', padding: '16px 18px',
        transition: 'border-color .12s, background .12s',
        cursor: 'pointer',
      }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = 'var(--border2)'
          el.style.background  = 'var(--bg3)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = 'var(--border)'
          el.style.background  = 'var(--bg2)'
        }}
      >
        {/* Top row: avatar + name + role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: 'var(--bg4)', border: '0.5px solid var(--border2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 600, color: 'var(--text3)',
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.full_name ?? 'Sem nome'}
            </div>
            {s.email && (
              <div style={{ fontSize: 12, color: 'var(--text4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                {s.email}
              </div>
            )}
          </div>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 8,
            background: role.bg, color: role.color,
            textTransform: 'uppercase', letterSpacing: '.06em', flexShrink: 0,
          }}>
            {role.label}
          </span>
        </div>

        {/* Last activity */}
        <div style={{ fontSize: 12, color: 'var(--text4)', marginBottom: 10 }}>
          {timeAgo(s.lastActivity)}
        </div>

        {/* Token bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text4)', marginBottom: 4 }}>
            <span>Tokens</span>
            <span style={{ fontFamily: 'var(--mono)', color: usedPct > 90 ? 'var(--red)' : 'var(--text3)' }}>
              {remaining.toLocaleString()}
            </span>
          </div>
          <div style={{ height: 3, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${100 - usedPct}%`,
              background: usedPct > 90 ? 'var(--red)' : usedPct > 70 ? 'var(--orange)' : 'var(--purple)',
            }} />
          </div>
        </div>
      </div>
    </Link>
  )
}

function Group({ title, color, students, basePath, defaultOpen = true }: {
  title: string
  color: string
  students: StudentRow[]
  basePath: string
  defaultOpen?: boolean
}) {
  if (students.length === 0) return null

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color }}>{title}</span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8,
          background: 'var(--bg3)', color: 'var(--text4)',
        }}>
          {students.length}
        </span>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: 12,
        opacity: defaultOpen ? 1 : 0.6,
      }}>
        {students.map(s => <StudentCard key={s.id} s={s} basePath={basePath} />)}
      </div>
    </div>
  )
}

export function StudentsTable({ students, basePath = '/mentor/students' }: { students: StudentRow[]; basePath?: string }) {
  if (students.length === 0) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text4)', fontSize: 14 }}>
        Nenhum aluno cadastrado.
      </div>
    )
  }

  const ativos   = students.filter(s => isActiveThisWeek(s.lastActivity))
  const inativos = students.filter(s => !isActiveThisWeek(s.lastActivity))

  return (
    <div>
      <Group title="Ativos esta semana" color="var(--green)"  students={ativos}   basePath={basePath} />
      <Group title="Sem atividade"      color="var(--text4)"  students={inativos}  basePath={basePath} defaultOpen={false} />
    </div>
  )
}
