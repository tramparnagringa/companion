'use client'

import { useState } from 'react'
import type { ICIScores } from './ici-card'

type State = 'idle' | 'loading' | 'done' | 'error'

export function ICIShareButton({ scores, programName, colorKey }: { scores: ICIScores; programName?: string; colorKey?: string }) {
  const [state, setState] = useState<State>('idle')

  async function handleDownload() {
    setState('loading')
    try {
      const c   = colorKey ?? 'random'
      const s   = encodeURIComponent(JSON.stringify(scores))
      const p   = programName ? `&p=${encodeURIComponent(programName)}` : ''
      const res = await fetch(`/api/og/ici?s=${s}&c=${c}${p}`)
      if (!res.ok) throw new Error('failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `ici-${scores.overall.toFixed(1)}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setState('done')
      setTimeout(() => setState('idle'), 2500)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 2000)
    }
  }

  const label =
    state === 'loading' ? 'Gerando imagem…'
    : state === 'done'  ? '✓ Imagem baixada'
    : state === 'error' ? 'Erro — tente novamente'
    : '↓ Salvar imagem para compartilhar'

  return (
    <button
      onClick={handleDownload}
      disabled={state === 'loading'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 18px',
        borderRadius: 8,
        border: '1px solid',
        borderColor:
          state === 'done'  ? 'rgba(94,122,15,0.4)'
          : state === 'error' ? 'rgba(200,68,43,0.4)'
          : 'rgba(67,0,73,0.35)',
        backgroundColor:
          state === 'done'  ? 'rgba(94,122,15,0.08)'
          : state === 'error' ? 'rgba(200,68,43,0.07)'
          : 'rgba(67,0,73,0.06)',
        color:
          state === 'done'  ? '#5E7A0F'
          : state === 'error' ? 'var(--tng-danger)'
          : 'var(--tng-purple-700)',
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '0.02em',
        cursor: state === 'loading' ? 'default' : 'pointer',
        opacity: state === 'loading' ? 0.65 : 1,
        transition: 'opacity 0.15s, background-color 0.2s',
        fontFamily: 'var(--tng-font-body)',
      }}
    >
      {label}
    </button>
  )
}
