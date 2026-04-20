'use client'

import { useState, useTransition } from 'react'
import { approveUser } from '@/app/actions/admin'

interface PendingUser {
  id: string
  full_name: string | null
  created_at: string | null
}

const ROLE_OPTIONS = [
  { value: 'student', label: 'Aluno'  },
  { value: 'mentor',  label: 'Mentor' },
  { value: 'admin',   label: 'Admin'  },
]

function timeAgo(iso: string | null) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'agora'
  if (h < 24) return `${h}h atrás`
  const d = Math.floor(h / 24)
  return `${d}d atrás`
}

export function PendingRow({ user, isLast }: { user: PendingUser; isLast: boolean }) {
  const [role, setRole] = useState<string>('student')
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  if (done) return null

  function handleApprove() {
    startTransition(async () => {
      await approveUser(user.id, role as 'student' | 'mentor' | 'admin')
      setDone(true)
    })
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 140px 120px',
      padding: '12px 16px',
      borderBottom: isLast ? 'none' : '0.5px solid var(--border)',
      alignItems: 'center',
      opacity: isPending ? 0.5 : 1,
      transition: 'opacity 0.2s',
    }}>
      {/* Name + ID */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
          {user.full_name ?? 'Sem nome'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 1, fontFamily: 'var(--mono)' }}>
          {timeAgo(user.created_at)} · {user.id.slice(0, 8)}
        </div>
      </div>

      {/* Role selector */}
      <select
        value={role}
        onChange={e => setRole(e.target.value)}
        disabled={isPending}
        style={{
          fontSize: 12,
          background: 'var(--bg3)',
          color: 'var(--text)',
          border: '0.5px solid var(--border2)',
          borderRadius: 6,
          padding: '5px 8px',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {ROLE_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Approve button */}
      <button
        onClick={handleApprove}
        disabled={isPending}
        style={{
          fontSize: 12,
          fontWeight: 500,
          padding: '5px 14px',
          borderRadius: 6,
          border: 'none',
          background: 'var(--accent)',
          color: 'var(--accent-text)',
          cursor: isPending ? 'not-allowed' : 'pointer',
          justifySelf: 'end',
        }}
      >
        {isPending ? 'Aprovando…' : 'Aprovar'}
      </button>
    </div>
  )
}
