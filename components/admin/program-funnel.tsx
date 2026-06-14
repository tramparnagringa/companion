'use client'

import { useState } from 'react'
import Link from 'next/link'

export interface StudentRef {
  user_id: string
  full_name: string | null
  avatar_url: string | null
}

export interface DayFunnel {
  day_number: number
  done: StudentRef[]
  in_progress: StudentRef[]
  pending: StudentRef[]
  skipped: StudentRef[]
  not_started: StudentRef[]
}

export interface FunnelData {
  total: number
  never_started: StudentRef[]
  days: DayFunnel[]
}

export function ProgramFunnel({ data }: { data: FunnelData }) {
  const [open, setOpen] = useState(true)
  const [openDay, setOpenDay] = useState<number | null>(null)

  if (data.total === 0) {
    return (
      <div style={{
        background: 'var(--bg2)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--r)', padding: '20px 22px', marginBottom: 24,
        fontSize: 13, color: 'var(--text4)',
      }}>
        Nenhum aluno inscrito ainda.
      </div>
    )
  }

  const started = data.total - data.never_started.length

  return (
    <div style={{
      background: 'var(--bg2)', border: '0.5px solid var(--border)',
      borderRadius: 'var(--r)', marginBottom: 24, overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          width: '100%', padding: '14px 18px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text4)', flexShrink: 0 }}>
          Cohort
        </span>
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>
          {data.total}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>inscritos</span>
        <span style={{ fontSize: 12, color: 'var(--text4)' }}>·</span>
        <span style={{ fontSize: 12, color: started > 0 ? 'var(--green)' : 'var(--text4)' }}>
          {started} iniciaram
        </span>
        <span style={{ fontSize: 12, color: 'var(--text4)' }}>·</span>
        <span style={{ fontSize: 12, color: 'var(--text4)' }}>
          {data.never_started.length} nunca iniciaram
        </span>
        <div style={{ flex: 1 }} />
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
          style={{ width: 12, height: 12, color: 'var(--text4)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }}>
          <polyline points="6,4 10,8 6,12" />
        </svg>
      </button>

      {open && (
        <div style={{ borderTop: '0.5px solid var(--border)' }}>
          {data.days.map(day => {
            const started = (data.total - data.never_started.length) || 1
            const donePct = (day.done.length / started) * 100
            const ipPct = (day.in_progress.length / started) * 100
            const pendPct = (day.pending.length / started) * 100
            const isExpanded = openDay === day.day_number
            const hasActivity = day.done.length > 0 || day.in_progress.length > 0 || day.pending.length > 0 || day.skipped.length > 0
            const someoneStarted = hasActivity

            return (
              <div key={day.day_number}>
                <button
                  onClick={() => hasActivity && setOpenDay(isExpanded ? null : day.day_number)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', padding: '7px 18px',
                    background: isExpanded ? 'var(--bg3)' : 'none',
                    border: 'none', borderBottom: '0.5px solid var(--border)',
                    cursor: hasActivity ? 'pointer' : 'default', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text4)', width: 28, flexShrink: 0 }}>
                    D{String(day.day_number).padStart(2, '0')}
                  </span>

                  <div style={{ width: 120, height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
                    <div style={{ display: 'flex', height: '100%' }}>
                      <div style={{ width: `${donePct}%`, background: 'var(--green)' }} />
                      <div style={{ width: `${ipPct}%`, background: 'var(--purple)' }} />
                      <div style={{ width: `${pendPct}%`, background: 'var(--bg5)' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                    <span style={{ color: day.done.length > 0 ? 'var(--green)' : 'var(--text4)', minWidth: 30 }}>
                      {day.done.length} ✓
                    </span>
                    <span style={{ color: day.in_progress.length > 0 ? 'var(--purple)' : 'var(--text4)', minWidth: 20 }}>
                      {day.in_progress.length} ↻
                    </span>
                    <span style={{ color: 'var(--text4)', minWidth: 24 }}>
                      {day.not_started.length} —
                    </span>
                  </div>

                  {hasActivity && (
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                      style={{ width: 10, height: 10, color: 'var(--text4)', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform .12s', marginLeft: 'auto', flexShrink: 0 }}>
                      <polyline points="6,4 10,8 6,12" />
                    </svg>
                  )}
                </button>

                {isExpanded && (
                  <div style={{
                    padding: '10px 18px 14px 58px',
                    borderBottom: '0.5px solid var(--border)',
                    background: 'var(--bg3)',
                    display: 'flex', gap: 28, flexWrap: 'wrap',
                  }}>
                    {([
                      { list: day.done,        label: 'Concluíram',   color: 'var(--green)'  },
                      { list: day.in_progress, label: 'Em andamento', color: 'var(--purple)' },
                      { list: day.pending,     label: 'Pendente',     color: 'var(--text3)'  },
                      { list: day.skipped,     label: 'Pularam',      color: 'var(--orange)' },
                      ...(someoneStarted ? [{ list: day.not_started, label: 'Não iniciaram', color: 'var(--text4)' }] : []),
                    ] as { list: StudentRef[]; label: string; color: string }[])
                      .filter(g => g.list.length > 0)
                      .map(group => (
                        <div key={group.label}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: group.color, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                            {group.label} ({group.list.length})
                          </div>
                          {group.list.map(s => (
                            <Link
                              key={s.user_id}
                              href={`/admin/students/${s.user_id}`}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, textDecoration: 'none' }}
                            >
                              <div style={{
                                width: 18, height: 18, borderRadius: '50%', background: 'var(--bg4)',
                                flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: 9, color: 'var(--text4)',
                              }}>
                                {s.avatar_url
                                  ? <img src={s.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : (s.full_name?.[0]?.toUpperCase() ?? '?')}
                              </div>
                              <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                                {s.full_name ?? s.user_id.slice(0, 8)}
                              </span>
                            </Link>
                          ))}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
