'use client'

import { useState, useTransition } from 'react'
import { approveUser } from '@/app/actions/admin'

interface PendingUser {
  id: string
  full_name: string | null
  email: string | null
  created_at: string | null
}

interface Program {
  id: string
  name: string
  slug: string
  token_allocation: number | null
  validity_days: number | null
  credit_ratio: number | null
}

const ROLE_OPTIONS = [
  { value: 'student', label: 'Aluno'  },
  { value: 'mentor',  label: 'Mentor' },
  { value: 'admin',   label: 'Admin'  },
]

const MANUAL_TOKEN_PRESETS = [
  { label: '100k',  tokens: 100_000,  days: 180 },
  { label: '500k',  tokens: 500_000,  days: 365 },
  { label: '2M',    tokens: 2_000_000, days: 365 },
]

function timeAgo(iso: string | null) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'agora'
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

const selectStyle: React.CSSProperties = {
  fontSize: 12,
  background: 'var(--bg3)',
  color: 'var(--text)',
  border: '0.5px solid var(--border2)',
  borderRadius: 6,
  padding: '5px 8px',
  cursor: 'pointer',
  outline: 'none',
}

export function PendingRow({
  user,
  programs,
  isLast,
}: {
  user: PendingUser
  programs: Program[]
  isLast: boolean
}) {
  const [role, setRole]           = useState<string>('student')
  const [programId, setProgramId] = useState<string>('')
  const [manualTokens, setManualTokens]   = useState<string>('')
  const [manualDays, setManualDays]       = useState<string>('365')
  const [isPending, startTransition]      = useTransition()
  const [done, setDone] = useState(false)

  if (done) return null

  const selectedProgram = programs.find(p => p.id === programId) ?? null
  const programHasTokens = !!selectedProgram?.token_allocation && !!selectedProgram?.validity_days

  // Displayed credit count for programs with credit_ratio
  const creditRatio = selectedProgram?.credit_ratio ?? 10
  const autoCredits = programHasTokens
    ? Math.round(selectedProgram!.token_allocation! / creditRatio).toLocaleString('pt-BR')
    : null

  function handleApprove() {
    startTransition(async () => {
      await approveUser({
        userId: userId,
        role: role as 'student' | 'mentor' | 'admin',
        programId: programId || undefined,
        manualTokens: manualTokens ? Number(manualTokens) : undefined,
        manualValidityDays: manualTokens ? Number(manualDays) : undefined,
      })
      setDone(true)
    })
  }

  const { id: userId } = user

  return (
    <div style={{
      padding: '14px 16px',
      borderBottom: isLast ? 'none' : '0.5px solid var(--border)',
      opacity: isPending ? 0.5 : 1,
      transition: 'opacity 0.2s',
    }}>
      {/* Row 1: identity */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
          {user.full_name ?? 'Sem nome'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 2 }}>
          {user.email ?? user.id.slice(0, 8)}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 1 }}>
          registrou {timeAgo(user.created_at)}
        </div>
      </div>

      {/* Row 2: controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>

        {/* Role */}
        <select value={role} onChange={e => setRole(e.target.value)} disabled={isPending} style={selectStyle}>
          {ROLE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Program */}
        <select value={programId} onChange={e => setProgramId(e.target.value)} disabled={isPending} style={selectStyle}>
          <option value="">Sem programa</option>
          {programs.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Token info / manual grant */}
        {programHasTokens ? (
          <span style={{
            fontSize: 11, padding: '4px 8px', borderRadius: 6,
            background: 'var(--accent-dim)', color: 'var(--accent)',
            fontWeight: 500,
          }}>
            {autoCredits} créditos incluídos
          </span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text4)' }}>Tokens:</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {MANUAL_TOKEN_PRESETS.map(p => (
                <button
                  key={p.label}
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    if (manualTokens === String(p.tokens)) {
                      setManualTokens('')
                    } else {
                      setManualTokens(String(p.tokens))
                      setManualDays(String(p.days))
                    }
                  }}
                  style={{
                    fontSize: 11, padding: '3px 8px', borderRadius: 5, cursor: 'pointer',
                    border: '0.5px solid var(--border2)',
                    background: manualTokens === String(p.tokens) ? 'var(--accent)' : 'var(--bg3)',
                    color: manualTokens === String(p.tokens) ? 'var(--accent-text)' : 'var(--text3)',
                    fontWeight: manualTokens === String(p.tokens) ? 600 : 400,
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {manualTokens && (
              <input
                type="number"
                value={manualDays}
                onChange={e => setManualDays(e.target.value)}
                min={1}
                disabled={isPending}
                style={{ ...selectStyle, width: 60 }}
                title="Validade em dias"
              />
            )}
            {manualTokens && (
              <span style={{ fontSize: 10, color: 'var(--text4)' }}>dias</span>
            )}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Approve */}
        <button
          onClick={handleApprove}
          disabled={isPending}
          style={{
            fontSize: 12, fontWeight: 500, padding: '5px 14px', borderRadius: 6,
            border: 'none', background: 'var(--accent)', color: 'var(--accent-text)',
            cursor: isPending ? 'not-allowed' : 'pointer', flexShrink: 0,
          }}
        >
          {isPending ? 'Aprovando…' : 'Aprovar'}
        </button>
      </div>
    </div>
  )
}
