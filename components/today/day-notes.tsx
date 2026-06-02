'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Sparkles } from 'lucide-react'
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

export function DayNotes({ notes }: { notes: ActionNote[] }) {
  if (notes.length === 0) return null

  const planNotes   = notes.filter(n => n.type === 'plan' || n.type === 'action_items')
  const inlineNotes = notes.filter(n => n.type !== 'plan' && n.type !== 'action_items')

  return (
    <div style={{ marginTop: 16, maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 16 }}>

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

      {/* Result cards — same lesson-card structure, success-green accent */}
      {inlineNotes.length > 0 && (
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '.12em',
            textTransform: 'uppercase', color: 'var(--tng-success)', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Sparkles size={11} strokeWidth={2} style={{ flexShrink: 0 }} />
            Resultado do dia
            <span style={{ flex: 1, height: '0.5px', background: 'var(--tng-rule)', display: 'block' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {inlineNotes.map(note => (
              <div key={note.id} className="lesson-card" style={{
                borderColor: 'var(--tng-success)',
                boxShadow: '0 0 0 1px var(--tng-success), 0 6px 24px -8px rgba(24,137,90,0.12)',
              }}>
                {/* Header */}
                <div className="lesson-head" style={{ cursor: 'default' }}>
                  <div className="lesson-mark done">
                    <Sparkles size={18} strokeWidth={1.8} />
                  </div>
                  <div className="lesson-head-body">
                    <div className="lesson-type" style={{ color: 'var(--tng-success)' }}>
                      GERADO PELO ASSISTENTE
                    </div>
                    <div className="lesson-title">{note.title}</div>
                  </div>
                </div>

                {/* Body — lesson-body handles font size, spacing, markdown typography */}
                <div className="lesson-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {note.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
