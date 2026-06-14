'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ActiveStudent {
  id: string
  full_name: string | null
  avatar_url: string | null
  last_activity: string | null
  completed_days: number
  current_day: number
}

interface DashboardData {
  ativos_hoje: ActiveStudent[]
  ativos_semana: ActiveStudent[]
  sem_atividade: ActiveStudent[]
  custo_mes_tokens: number
  custo_mes_usd: number
  total_students: number
}

function timeAgo(iso: string | null) {
  if (!iso) return 'nunca'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 60) return `${m}min atrás`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

function Avatar({ s }: { s: ActiveStudent }) {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      background: 'var(--bg4)', border: '0.5px solid var(--border2)',
      overflow: 'hidden', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text3)',
    }}>
      {s.avatar_url
        ? <img src={s.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (s.full_name?.[0]?.toUpperCase() ?? '?')}
    </div>
  )
}

function StudentRow({ s }: { s: ActiveStudent }) {
  return (
    <Link
      href={`/admin/students/${s.id}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px', textDecoration: 'none',
        borderBottom: '0.5px solid var(--border)',
        transition: 'background .1s',
      }}
      className="admin-dash-row"
    >
      <Avatar s={s} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {s.full_name ?? 'Sem nome'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text4)', marginTop: 1 }}>
          Dia {s.current_day} · {s.completed_days} concluídos
        </div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0 }}>
        {timeAgo(s.last_activity)}
      </div>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
        style={{ width: 12, height: 12, color: 'var(--text4)', flexShrink: 0 }}>
        <polyline points="6,4 10,8 6,12" />
      </svg>
    </Link>
  )
}

function Section({ title, color, students, collapsible, defaultOpen = true }: {
  title: string
  color: string
  students: ActiveStudent[]
  collapsible?: boolean
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  if (students.length === 0) return null

  return (
    <div style={{
      background: 'var(--bg2)', border: '0.5px solid var(--border)',
      borderRadius: 'var(--r)', overflow: 'hidden', marginBottom: 16,
    }}>
      <button
        onClick={() => collapsible && setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          width: '100%', padding: '12px 16px',
          background: 'none', border: 'none',
          borderBottom: open ? '0.5px solid var(--border)' : 'none',
          cursor: collapsible ? 'pointer' : 'default', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color }}>{title}</span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 8,
          background: 'var(--bg4)', color: 'var(--text3)',
        }}>{students.length}</span>
        <div style={{ flex: 1 }} />
        {collapsible && (
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
            style={{ width: 12, height: 12, color: 'var(--text4)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }}>
            <polyline points="6,4 10,8 6,12" />
          </svg>
        )}
      </button>
      {open && students.map(s => <StudentRow key={s.id} s={s} />)}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  const kpis = data ? [
    { label: 'Ativos hoje',        value: data.ativos_hoje.length,    color: 'var(--green)'  },
    { label: 'Ativos esta semana', value: data.ativos_semana.length,   color: 'var(--purple)' },
    { label: 'Total de alunos',    value: data.total_students,         color: 'var(--text)'   },
    { label: 'Custo este mês',     value: `$${data.custo_mes_usd.toFixed(2)}`, color: 'var(--text3)' },
  ] : []

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: 'var(--bg)' }}>
      <style>{`.admin-dash-row:hover { background: var(--bg3) !important; }`}</style>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Atividade</h1>
        <p style={{ fontSize: 14, color: 'var(--text3)', margin: '4px 0 0' }}>
          O que os alunos estão fazendo agora
        </p>
      </div>

      {/* KPIs */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28,
      }}>
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                background: 'var(--bg2)', border: '0.5px solid var(--border)',
                borderRadius: 'var(--r)', padding: '16px 18px',
                height: 72,
              }} />
            ))
          : kpis.map(k => (
              <div key={k.label} style={{
                background: 'var(--bg2)', border: '0.5px solid var(--border)',
                borderRadius: 'var(--r)', padding: '16px 18px',
              }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: k.color, lineHeight: 1 }}>
                  {k.value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text4)', marginTop: 4 }}>{k.label}</div>
              </div>
            ))}
      </div>

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text4)', fontSize: 14 }}>
          Carregando…
        </div>
      ) : !data || (data.ativos_hoje.length === 0 && data.ativos_semana.length === 0 && data.sem_atividade.length === 0) ? (
        <div style={{
          background: 'var(--bg2)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--r)', padding: '48px', textAlign: 'center',
          fontSize: 14, color: 'var(--text4)',
        }}>
          Nenhum aluno ativo ainda.
        </div>
      ) : (
        <>
          <Section
            title="Ativos hoje"
            color="var(--green)"
            students={data.ativos_hoje}
          />
          <Section
            title="Ativos esta semana"
            color="var(--purple)"
            students={data.ativos_semana}
          />
          <Section
            title="Sem atividade há +3 dias"
            color="var(--text4)"
            students={data.sem_atividade}
            collapsible
            defaultOpen={false}
          />
        </>
      )}

      <div style={{ marginTop: 8, paddingTop: 16, borderTop: '0.5px solid var(--border)', display: 'flex', gap: 12 }}>
        <Link href="/admin/students" style={{ fontSize: 13, color: 'var(--text4)', textDecoration: 'none' }}>
          → Todos os alunos
        </Link>
        <Link href="/admin/programs" style={{ fontSize: 13, color: 'var(--text4)', textDecoration: 'none' }}>
          → Programas
        </Link>
        <Link href="/admin/tokens" style={{ fontSize: 13, color: 'var(--text4)', textDecoration: 'none' }}>
          → Tokens
        </Link>
      </div>
    </div>
  )
}
