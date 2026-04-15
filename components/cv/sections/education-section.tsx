'use client'

import { useState } from 'react'

interface EducationEntry {
  degree: string
  institution: string
  year: string
}

interface Props {
  data: EducationEntry[]
  onChange: (data: EducationEntry[]) => void
  onAiAction: (prompt: string) => void
}

function EntryField({
  value, placeholder, onChange,
}: { value: string; placeholder: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function commit() {
    setEditing(false)
    if (draft !== value) onChange(draft)
  }

  return editing ? (
    <input
      autoFocus
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => e.key === 'Enter' && commit()}
      style={{
        background: 'var(--bg3)', border: '0.5px solid var(--accent)',
        borderRadius: 'var(--rsm)', padding: '3px 7px', fontSize: 12,
        color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none',
      }}
    />
  ) : (
    <span
      onClick={() => { setDraft(value); setEditing(true) }}
      style={{
        fontSize: 12, cursor: 'text', padding: '2px 4px', borderRadius: 4,
        color: value ? 'var(--text)' : 'var(--text4)',
        border: '0.5px solid transparent',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
    >
      {value || placeholder}
    </span>
  )
}

export function EducationSection({ data, onChange, onAiAction }: Props) {
  function updateEntry(idx: number, field: keyof EducationEntry, value: string) {
    const updated = data.map((e, i) => i === idx ? { ...e, [field]: value } : e)
    onChange(updated)
  }

  function addEntry() {
    onChange([...data, { degree: '', institution: '', year: '' }])
  }

  function removeEntry(idx: number) {
    onChange(data.filter((_, i) => i !== idx))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 0', marginBottom: 8,
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Formação Acadêmica
        </span>
        <button
          onClick={() => onAiAction('Revise a seção de formação acadêmica do meu CV. Como posso apresentá-la de forma mais relevante para o mercado internacional?')}
          style={{ fontSize: 11, color: 'var(--purple)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', opacity: 0.7 }}
          title="Melhorar com IA"
        >
          ✦
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.map((entry, idx) => (
          <div key={idx} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '8px 10px', borderRadius: 'var(--rsm)',
            border: '0.5px solid var(--border)', background: 'var(--bg3)',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <EntryField
                  value={entry.degree}
                  placeholder="Bacharelado em Ciência da Computação"
                  onChange={v => updateEntry(idx, 'degree', v)}
                />
                <span style={{ color: 'var(--text4)', fontSize: 11 }}>·</span>
                <EntryField
                  value={entry.institution}
                  placeholder="Universidade"
                  onChange={v => updateEntry(idx, 'institution', v)}
                />
                <span style={{ color: 'var(--text4)', fontSize: 11 }}>·</span>
                <EntryField
                  value={entry.year}
                  placeholder="2020"
                  onChange={v => updateEntry(idx, 'year', v)}
                />
              </div>
            </div>
            <button
              onClick={() => removeEntry(idx)}
              style={{
                background: 'none', border: 'none', color: 'var(--text4)', cursor: 'pointer',
                fontSize: 14, padding: '0 2px', flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={addEntry}
        style={{
          marginTop: 6, alignSelf: 'flex-start', fontSize: 11, color: 'var(--text3)',
          background: 'none', border: '0.5px dashed var(--border2)', borderRadius: 'var(--rsm)',
          padding: '4px 10px', cursor: 'pointer',
        }}
      >
        + formação
      </button>
    </div>
  )
}
