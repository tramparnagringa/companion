'use client'

import { useState } from 'react'
import type { CVContent } from '../types'

type Personal = CVContent['personal']

interface Props {
  data: Personal
  onChange: (data: Personal) => void
  onAiAction: (prompt: string) => void
}

const FIELDS: Array<{ key: keyof Personal; label: string; placeholder: string; type?: string }> = [
  { key: 'full_name', label: 'Nome completo', placeholder: 'John Doe' },
  { key: 'position',  label: 'Cargo/Título',  placeholder: 'Senior Software Engineer' },
  { key: 'location',  label: 'Localização',   placeholder: 'São Paulo, BR (Remote)' },
  { key: 'email',     label: 'Email',          placeholder: 'john@example.com', type: 'email' },
  { key: 'phone',     label: 'Telefone',       placeholder: '+55 11 99999-9999' },
  { key: 'linkedin',  label: 'LinkedIn',       placeholder: 'linkedin.com/in/johndoe' },
  { key: 'github',    label: 'GitHub',         placeholder: 'github.com/johndoe' },
  { key: 'website',   label: 'Website',        placeholder: 'johndoe.dev' },
]

export function PersonalSection({ data, onChange, onAiAction }: Props) {
  const [editingField, setEditingField] = useState<keyof Personal | null>(null)
  const [draft, setDraft] = useState<string>('')

  function startEdit(key: keyof Personal) {
    setEditingField(key)
    setDraft(data[key] ?? '')
  }

  function commitEdit(key: keyof Personal) {
    setEditingField(null)
    if (draft !== (data[key] ?? '')) {
      onChange({ ...data, [key]: draft })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 0', marginBottom: 8,
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Informações Pessoais
        </span>
        <button
          onClick={() => onAiAction('Melhore as informações pessoais do meu CV para soar mais profissional no mercado internacional.')}
          style={{
            fontSize: 11, color: 'var(--purple)', background: 'none', border: 'none',
            cursor: 'pointer', padding: '2px 6px', borderRadius: 'var(--rsm)',
            opacity: 0.7,
          }}
          title="Melhorar com IA"
        >
          ✦
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
        {FIELDS.map(({ key, label, placeholder, type }) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <label style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500 }}>{label}</label>
            {editingField === key ? (
              <input
                autoFocus
                type={type ?? 'text'}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onBlur={() => commitEdit(key)}
                onKeyDown={e => e.key === 'Enter' && commitEdit(key)}
                style={{
                  background: 'var(--bg3)', border: '0.5px solid var(--accent)',
                  borderRadius: 'var(--rsm)', padding: '5px 8px', fontSize: 12,
                  color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none', width: '100%',
                }}
              />
            ) : (
              <div
                onClick={() => startEdit(key)}
                style={{
                  fontSize: 12, color: data[key] ? 'var(--text)' : 'var(--text4)',
                  padding: '5px 8px', borderRadius: 'var(--rsm)', cursor: 'text',
                  border: '0.5px solid transparent', minHeight: 28,
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
                {data[key] || <span style={{ color: 'var(--text4)' }}>{placeholder}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
