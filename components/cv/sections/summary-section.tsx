'use client'

import { useState } from 'react'

interface Props {
  data: string[]
  onChange: (data: string[]) => void
  onAiAction: (prompt: string) => void
}

export function SummarySection({ data, onChange, onAiAction }: Props) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [draft, setDraft] = useState('')

  function startEdit(idx: number) {
    setEditingIdx(idx)
    setDraft(data[idx] ?? '')
  }

  function commitEdit(idx: number) {
    setEditingIdx(null)
    const updated = [...data]
    if (draft.trim()) {
      updated[idx] = draft.trim()
    } else {
      updated.splice(idx, 1)
    }
    onChange(updated.length ? updated : [''])
  }

  function addParagraph() {
    onChange([...data, ''])
    setEditingIdx(data.length)
    setDraft('')
  }

  function removeParagraph(idx: number) {
    const updated = data.filter((_, i) => i !== idx)
    onChange(updated.length ? updated : [''])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 0', marginBottom: 8,
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Resumo Profissional
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => onAiAction('Reescreva o resumo profissional do meu CV para soar mais sênior e impactante no mercado internacional. Ofereça 2-3 versões alternativas.')}
            style={{ fontSize: 11, color: 'var(--purple)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: 'var(--rsm)', opacity: 0.7 }}
            title="Melhorar com IA"
          >
            ✦
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.map((paragraph, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              {editingIdx === idx ? (
                <textarea
                  autoFocus
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onBlur={() => commitEdit(idx)}
                  rows={3}
                  style={{
                    width: '100%', background: 'var(--bg3)', border: '0.5px solid var(--accent)',
                    borderRadius: 'var(--rsm)', padding: '6px 8px', fontSize: 12,
                    color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none', resize: 'vertical',
                    lineHeight: 1.6,
                  }}
                />
              ) : (
                <div
                  onClick={() => startEdit(idx)}
                  style={{
                    fontSize: 12, color: paragraph ? 'var(--text2)' : 'var(--text4)',
                    padding: '6px 8px', borderRadius: 'var(--rsm)', cursor: 'text',
                    border: '0.5px solid transparent', lineHeight: 1.6, minHeight: 36,
                    transition: 'border-color 0.1s, background 0.1s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'
                    ;(e.currentTarget as HTMLElement).style.background = 'var(--bg3)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                  }}
                >
                  {paragraph || <span style={{ color: 'var(--text4)' }}>Clique para escrever um parágrafo…</span>}
                </div>
              )}
            </div>
            {data.length > 1 && (
              <button
                onClick={() => removeParagraph(idx)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer',
                  fontSize: 13, padding: '6px 4px', borderRadius: 'var(--rsm)',
                  flexShrink: 0, marginTop: 2,
                }}
                title="Remover parágrafo"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addParagraph}
        style={{
          marginTop: 6, alignSelf: 'flex-start', fontSize: 11, color: 'var(--text3)',
          background: 'none', border: '0.5px dashed var(--border2)', borderRadius: 'var(--rsm)',
          padding: '4px 10px', cursor: 'pointer',
        }}
      >
        + parágrafo
      </button>
    </div>
  )
}
