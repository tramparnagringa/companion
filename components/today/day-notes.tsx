'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PlanCard } from '@/components/plans/plan-card'

interface ChecklistItem {
  id: string
  label: string
  done: boolean
}

interface ActionNote {
  id: string
  title: string
  content: string
  type: 'plan' | 'note' | 'summary' | 'action_items'
  checklist?: ChecklistItem[]
  completed?: boolean
  created_at: string
}

const TYPE_META: Record<string, { label: string; color: string; dimColor: string }> = {
  summary: { label: 'Resumo', color: 'var(--accent)',  dimColor: 'var(--accent-dim)' },
  note:    { label: 'Nota',   color: 'var(--text2)',   dimColor: 'var(--bg4)' },
}

export function DayNotes({ notes }: { notes: ActionNote[] }) {
  if (notes.length === 0) return null

  const planNotes   = notes.filter(n => n.type === 'plan' || n.type === 'action_items')
  const inlineNotes = notes.filter(n => n.type !== 'plan' && n.type !== 'action_items')

  return (
    <div style={{ marginTop: 28, maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Plans / action items — use interactive PlanCard */}
      {planNotes.length > 0 && (
        <div>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '.1em',
            textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            Planos de ação
            <span style={{ flex: 1, height: '0.5px', background: 'var(--border)', display: 'block' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {planNotes.map(note => (
              <PlanCard
                key={note.id}
                id={note.id}
                title={note.title}
                content={note.content}
                type={note.type}
                checklist={note.checklist ?? []}
                completed={note.completed}
                createdAt={note.created_at}
              />
            ))}
          </div>
        </div>
      )}

      {/* Notes / summaries — inline, no collapse */}
      {inlineNotes.length > 0 && (
        <div>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '.1em',
            textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            Gerado pelo assistente
            <span style={{ flex: 1, height: '0.5px', background: 'var(--border)', display: 'block' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {inlineNotes.map(note => {
              const meta = TYPE_META[note.type] ?? TYPE_META.note
              return (
                <div key={note.id} style={{
                  background: 'var(--bg2)',
                  border: '0.5px solid var(--border)',
                  borderLeft: `2px solid ${meta.color}`,
                  borderRadius: 'var(--r)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '10px 14px 8px',
                    borderBottom: '0.5px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '.05em',
                      textTransform: 'uppercase',
                      background: meta.dimColor, color: meta.color,
                      padding: '2px 7px', borderRadius: 4,
                    }}>
                      {meta.label}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                      {note.title}
                    </span>
                  </div>
                  <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p:      ({ children }) => <p style={{ margin: '0 0 8px' }}>{children}</p>,
                        h3:     ({ children }) => <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '10px 0 4px' }}>{children}</h3>,
                        ul:     ({ children }) => <ul style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{children}</ul>,
                        ol:     ({ children }) => <ol style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{children}</ol>,
                        li:     ({ children }) => <li style={{ marginBottom: 3 }}>{children}</li>,
                        strong: ({ children }) => <strong style={{ fontWeight: 600, color: 'var(--text)' }}>{children}</strong>,
                        code:   ({ children }) => <code style={{ fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4 }}>{children}</code>,
                        hr:     () => <hr style={{ border: 'none', borderTop: '0.5px solid var(--border2)', margin: '8px 0' }} />,
                        table:  ({ children }) => <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%', marginBottom: 8 }}>{children}</table>,
                        th:     ({ children }) => <th style={{ padding: '5px 8px', borderBottom: '0.5px solid var(--border2)', textAlign: 'left', fontWeight: 600 }}>{children}</th>,
                        td:     ({ children }) => <td style={{ padding: '5px 8px', borderBottom: '0.5px solid var(--border2)' }}>{children}</td>,
                      }}
                    >
                      {note.content}
                    </ReactMarkdown>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
