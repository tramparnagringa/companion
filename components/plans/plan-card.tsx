'use client'

import { useState, useTransition } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Brain, Zap, Sparkles, BookOpen } from 'lucide-react'

function Check({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden style={{ flexShrink: 0 }}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

const TYPE_CONFIG = {
  plan:         { label: 'PLANO',  cssClass: 'concept', Icon: Brain    },
  action_items: { label: 'AÇÕES',  cssClass: 'action',  Icon: Zap      },
  summary:      { label: 'RESUMO', cssClass: 'ai',      Icon: Sparkles },
  note:         { label: 'NOTA',   cssClass: 'reflect', Icon: BookOpen },
}

interface ChecklistItem {
  id: string
  label: string
  done: boolean
}

interface PlanCardProps {
  id: string
  title: string
  content: string
  type: string
  dayNumber?: number | null
  checklist: ChecklistItem[]
  completed?: boolean
  createdAt: string
}

export function PlanCard({
  id, title, content, type, dayNumber,
  checklist: initial, completed: initialCompleted = false, createdAt,
}: PlanCardProps) {
  const [checklist, setChecklist]     = useState<ChecklistItem[]>(initial)
  const [completed, setCompleted]     = useState(initialCompleted)
  const [open, setOpen]               = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleted, setDeleted]         = useState(false)
  const [, startTransition]           = useTransition()

  if (deleted) return null

  const cfg       = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.note
  const doneCount = checklist.filter(i => i.done).length
  const total     = checklist.length
  const allDone   = (total > 0 && doneCount === total) || completed

  const date = new Date(createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

  // "PLANO · DIA 5 · 15 ago"
  const typeLabel = [
    cfg.label,
    dayNumber ? `DIA ${dayNumber}` : null,
    date,
  ].filter(Boolean).join(' · ')

  // Collapsed preview text
  const snip = total > 0
    ? `${doneCount}/${total} itens concluídos`
    : content
      ? content.replace(/[#*_`[\]()]/g, '').slice(0, 90)
      : null

  async function markDone() {
    setCompleted(true)
    startTransition(async () => {
      await fetch(`/api/plans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      })
    })
  }

  async function deleteNote() {
    await fetch(`/api/plans/${id}`, { method: 'DELETE' })
    setDeleted(true)
  }

  async function toggle(itemId: string) {
    const next = checklist.map(i => i.id === itemId ? { ...i, done: !i.done } : i)
    setChecklist(next)
    startTransition(async () => {
      await fetch(`/api/plans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist: next }),
      })
    })
  }

  return (
    <div className={`lesson-card ${cfg.cssClass}${open ? ' open' : ''}${allDone ? ' done' : ''}`}>

      {/* ── Header (always visible) ── */}
      <div className="lesson-head" onClick={() => setOpen(v => !v)}>

        <div className={`lesson-mark ${allDone ? 'done' : cfg.cssClass}`}>
          {allDone ? <Check size={16} /> : <cfg.Icon size={18} strokeWidth={1.8} />}
        </div>

        <div className="lesson-head-body">
          <div className={`lesson-type ${allDone ? 'done' : cfg.cssClass}`}>
            {typeLabel}
          </div>
          <div className="lesson-title">{title}</div>
          {!open && snip && (
            <div className="lesson-snip">{snip}</div>
          )}
        </div>

        <svg className="lesson-chev" width="16" height="16" viewBox="0 0 16 16"
          fill="none" stroke="currentColor" strokeWidth="1.7">
          <polyline points="4,6 8,10 12,6" />
        </svg>
      </div>

      {/* ── Expanded body ── */}
      {open && (
        <>
          {content && (
            <div className="lesson-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}

          {checklist.length > 0 && (
            <div className="lesson-checks">
              {checklist.map(item => (
                <label key={item.id} className={item.done ? 'checked' : ''}>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggle(item.id)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          )}

          <div className="lesson-foot">

            {/* Left: delete */}
            {confirmDelete ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--tng-ink-3)' }}>Remover?</span>
                <button onClick={deleteNote} style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--tng-danger)',
                  background: 'rgba(200,68,43,.08)', border: '1px solid rgba(200,68,43,.25)',
                  borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
                }}>Sim</button>
                <button onClick={() => setConfirmDelete(false)} style={{
                  fontSize: 11, color: 'var(--tng-ink-3)',
                  background: 'transparent', border: '1px solid var(--tng-rule)',
                  borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
                }}>Não</button>
              </span>
            ) : (
              <button
                onClick={e => { e.stopPropagation(); setConfirmDelete(true) }}
                title="Remover plano"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--tng-ink-3)', padding: '4px 6px', borderRadius: 6,
                  display: 'flex', alignItems: 'center', gap: 5, fontSize: 11,
                  opacity: 0.45, transition: 'opacity .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0.45')}
              >
                <svg width={11} height={11} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <polyline points="1,3 11,3" />
                  <path d="M2,3 L2.5,10.5 Q2.5,11 3,11 H9 Q9.5,11 9.5,10.5 L10,3" />
                  <path d="M4.5,3 L4.5,1.5 Q4.5,1 5,1 H7 Q7.5,1 7.5,1.5 L7.5,3" />
                </svg>
                Remover
              </button>
            )}

            {/* Right: completion — only for notes without checklist */}
            {total === 0 ? (
              completed ? (
                <span className="lesson-status">
                  <Check size={10} /> Concluído
                </span>
              ) : (
                <button onClick={markDone} className="btn-mark">
                  Marcar como concluído
                </button>
              )
            ) : (
              <span />
            )}

          </div>
        </>
      )}
    </div>
  )
}
