'use client'

import { useState } from 'react'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 11px', borderRadius: 'var(--rsm)',
  background: 'var(--bg3)', border: '0.5px solid var(--border2)',
  color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
}
const labelStyle: React.CSSProperties = {
  fontSize: 11, color: 'var(--text3)', marginBottom: 5,
  textTransform: 'uppercase', letterSpacing: '.08em', display: 'block',
}

const PRESETS = [
  { label: '100k',  value: '100000',  note: 'Pack starter' },
  { label: '400k',  value: '400000',  note: 'Pack pro' },
  { label: '500k',  value: '500000',  note: 'Meio bootcamp' },
  { label: '1M',    value: '1000000', note: 'Bootcamp completo' },
  { label: '2M',    value: '2000000', note: 'Bootcamp + margem' },
]

export function GrantTokensForm() {
  const [userId, setUserId]         = useState('')
  const [tokens, setTokens]         = useState('')
  const [days, setDays]             = useState('365')
  const [reason, setReason]         = useState('')
  const [productType, setProductType] = useState('manual_grant')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage]       = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      const res = await fetch('/api/mentor/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_user_id: userId.trim(),
          tokens: parseInt(tokens),
          validity_days: parseInt(days),
          reason,
          product_type: productType,
        }),
      })
      if (res.ok) {
        setMessage({ type: 'ok', text: `${parseInt(tokens).toLocaleString()} tokens concedidos para ${userId.trim()}.` })
        setUserId('')
        setTokens('')
        setReason('')
      } else {
        const body = await res.json().catch(() => ({}))
        setMessage({ type: 'err', text: body.error ?? 'Erro ao conceder tokens.' })
      }
    } catch {
      setMessage({ type: 'err', text: 'Erro de rede.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{
        background: 'var(--bg2)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--r)', padding: '22px 24px',
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>User ID do aluno</label>
            <input
              type="text" required
              value={userId} onChange={e => setUserId(e.target.value)}
              placeholder="uuid do aluno (ex: da página de alunos)"
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 4 }}>
              Encontre o UUID na página <a href="/admin/students" style={{ color: 'var(--purple)', textDecoration: 'none' }}>Alunos</a>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Tokens</label>
            <input
              type="number" min="1" required
              value={tokens} onChange={e => setTokens(e.target.value)}
              placeholder="quantidade"
              style={inputStyle}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {PRESETS.map(p => (
                <button
                  key={p.value} type="button"
                  onClick={() => setTokens(p.value)}
                  title={p.note}
                  style={{
                    padding: '4px 10px', borderRadius: 'var(--rsm)', fontSize: 11,
                    border: '0.5px solid var(--border2)',
                    background: tokens === p.value ? 'var(--purple-dim)' : 'var(--bg3)',
                    color: tokens === p.value ? 'var(--purple)' : 'var(--text3)',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Validade (dias)</label>
              <input
                type="number" min="1" required
                value={days} onChange={e => setDays(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Tipo de produto</label>
              <select value={productType} onChange={e => setProductType(e.target.value)} style={inputStyle}>
                <option value="manual_grant">Manual grant</option>
                <option value="bootcamp">Bootcamp</option>
                <option value="mentoria">Mentoria</option>
                <option value="pack_starter">Pack starter</option>
                <option value="pack_pro">Pack pro</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Motivo (opcional)</label>
            <input
              type="text"
              value={reason} onChange={e => setReason(e.target.value)}
              placeholder="ex: compensação por downtime"
              style={inputStyle}
            />
          </div>

          {message && (
            <div style={{
              padding: '10px 14px', borderRadius: 'var(--rsm)', fontSize: 13,
              background: message.type === 'ok' ? 'var(--green-dim)' : 'var(--red-dim)',
              color: message.type === 'ok' ? 'var(--green)' : 'var(--red)',
              border: `0.5px solid ${message.type === 'ok' ? 'var(--green)' : 'var(--red)'}`,
            }}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !userId || !tokens}
            style={{
              padding: '10px 20px', borderRadius: 'var(--rsm)',
              background: submitting || !userId || !tokens ? 'var(--bg4)' : 'var(--purple-dim)',
              color: submitting || !userId || !tokens ? 'var(--text4)' : 'var(--purple)',
              border: `0.5px solid ${submitting || !userId || !tokens ? 'var(--border)' : 'var(--purple)'}`,
              fontSize: 13, fontWeight: 500,
              cursor: submitting || !userId || !tokens ? 'not-allowed' : 'pointer',
              alignSelf: 'flex-start', fontFamily: 'inherit',
            }}
          >
            {submitting ? 'Concedendo...' : 'Conceder tokens'}
          </button>
        </form>
      </div>
    </div>
  )
}
