'use client'

import { useState, useTransition } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  plan:         { label: 'Plano',         color: 'var(--accent)' },
  action_items: { label: 'Ações',         color: 'var(--purple)' },
  summary:      { label: 'Resumo',        color: '#2dd4bf' },
  note:         { label: 'Nota',          color: 'var(--text3)' },
}

export function PlanCard({ id, title, content, type, dayNumber, checklist: initial, completed: initialCompleted = false, createdAt }: PlanCardProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initial)
  const [completed, setCompleted] = useState(initialCompleted)
  const [expanded, setExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [, startTransition] = useTransition()

  async function deleteNote() {
    await fetch(`/api/plans/${id}`, { method: 'DELETE' })
    setDeleted(true)
  }

  if (deleted) return null

  const meta = TYPE_LABELS[type] ?? TYPE_LABELS.note
  const doneCount = checklist.filter(i => i.done).length
  const total = checklist.length
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0
  const allDone = (total > 0 && doneCount === total) || completed

  const date = new Date(createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short',
  })

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
    <div style={{
      background: 'var(--bg2)',
      border: `0.5px solid ${allDone ? 'rgba(74,222,128,.3)' : 'var(--border)'}`,
      borderRadius: 'var(--r)',
      overflow: 'hidden',
      transition: 'border-color .2s',
    }}>
      {/* Header */}
      <div style={{ position: 'relative' }}>
        {/* Expand area — no buttons inside */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setExpanded(v => !v)}
          onKeyDown={e => e.key === 'Enter' && setExpanded(v => !v)}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            width: '100%', padding: '14px 16px', paddingRight: 44,
            cursor: 'pointer', textAlign: 'left',
          }}
        >
          {/* Progress ring */}
          {total > 0 && (
            <svg width={36} height={36} viewBox="0 0 36 36" style={{ flexShrink: 0 }}>
              <circle cx={18} cy={18} r={14} fill="none" stroke="var(--bg4)" strokeWidth={3} />
              <circle
                cx={18} cy={18} r={14} fill="none"
                stroke={allDone ? '#4ade80' : meta.color}
                strokeWidth={3}
                strokeDasharray={`${(pct / 100) * 2 * Math.PI * 14} ${2 * Math.PI * 14}`}
                strokeLinecap="round"
                transform="rotate(-90 18 18)"
                style={{ transition: 'stroke-dasharray .4s ease' }}
              />
              <text x={18} y={22} textAnchor="middle" fontSize={9} fontWeight={700}
                fill={allDone ? '#4ade80' : meta.color}>
                {pct}%
              </text>
            </svg>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10,
                background: meta.color + '18', color: meta.color,
                border: `0.5px solid ${meta.color}33`,
              }}>
                {meta.label}
              </span>
              {dayNumber && (
                <span style={{ fontSize: 10, color: 'var(--text4)' }}>Dia {dayNumber}</span>
              )}
              <span style={{ fontSize: 10, color: 'var(--text4)', marginLeft: 'auto' }}>{date}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>
              {title}
            </div>
            {total > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 4 }}>
                {doneCount}/{total} concluídos
              </div>
            )}
          </div>

          {/* Chevron */}
          <svg
            width={14} height={14} viewBox="0 0 14 14" fill="none"
            stroke="var(--text4)" strokeWidth={1.5}
            style={{ flexShrink: 0, transition: 'transform .2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', marginTop: 2 }}
          >
            <polyline points="2,5 7,9 12,5" />
          </svg>
        </div>

        {/* Delete — absolute, outside the expand div */}
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
          {confirmDelete ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>Remover?</span>
              <button onClick={deleteNote} style={{
                fontSize: 10, fontWeight: 600, color: '#f87171',
                background: 'rgba(248,113,113,.1)', border: '0.5px solid rgba(248,113,113,.3)',
                borderRadius: 4, padding: '2px 8px', cursor: 'pointer',
              }}>Sim</button>
              <button onClick={() => setConfirmDelete(false)} style={{
                fontSize: 10, color: 'var(--text4)',
                background: 'var(--bg4)', border: '0.5px solid var(--border2)',
                borderRadius: 4, padding: '2px 8px', cursor: 'pointer',
              }}>Não</button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              title="Remover plano"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text4)', padding: 4, borderRadius: 4,
                display: 'flex', alignItems: 'center',
                opacity: 0.4, transition: 'opacity .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}
            >
              <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <polyline points="1,3 11,3" />
                <path d="M2,3 L2.5,10.5 Q2.5,11 3,11 H9 Q9.5,11 9.5,10.5 L10,3" />
                <path d="M4.5,3 L4.5,1.5 Q4.5,1 5,1 H7 Q7.5,1 7.5,1.5 L7.5,3" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div style={{ borderTop: '0.5px solid var(--border)', padding: '14px 16px' }}>
          {/* Checklist */}
          {checklist.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: content ? 16 : 0 }}>
              {checklist.map(item => (
                <label
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    cursor: 'pointer', padding: '7px 10px',
                    borderRadius: 6,
                    background: item.done ? 'rgba(74,222,128,.06)' : 'var(--bg3)',
                    border: `0.5px solid ${item.done ? 'rgba(74,222,128,.2)' : 'var(--border2)'}`,
                    transition: 'all .15s',
                  }}
                >
                  {/* Custom checkbox */}
                  <div
                    onClick={() => toggle(item.id)}
                    style={{
                      width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
                      border: `1.5px solid ${item.done ? '#4ade80' : 'var(--border2)'}`,
                      background: item.done ? '#4ade80' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all .15s',
                    }}
                  >
                    {item.done && (
                      <svg width={9} height={9} viewBox="0 0 9 9" fill="none" stroke="var(--bg)" strokeWidth={2}>
                        <polyline points="1.5,4.5 3.5,6.5 7.5,2.5" />
                      </svg>
                    )}
                  </div>
                  <span
                    onClick={() => toggle(item.id)}
                    style={{
                      fontSize: 13, color: item.done ? 'var(--text4)' : 'var(--text)',
                      lineHeight: 1.5,
                      textDecoration: item.done ? 'line-through' : 'none',
                      transition: 'all .15s',
                    }}
                  >
                    {item.label}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* Markdown content */}
          {content && (
            <div style={{
              borderTop: checklist.length ? '0.5px solid var(--border2)' : 'none',
              paddingTop: checklist.length ? 12 : 0,
            }}
              className="plan-markdown"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}

          {/* Mark as done — only when no checklist */}
          {total === 0 && (
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
              {completed ? (
                <span style={{
                  fontSize: 11, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2}>
                    <polyline points="2,6 5,9 10,3" />
                  </svg>
                  Concluído
                </span>
              ) : (
                <button
                  onClick={markDone}
                  style={{
                    fontSize: 11, color: 'var(--text3)', background: 'var(--bg4)',
                    border: '0.5px solid var(--border2)', borderRadius: 6,
                    padding: '5px 12px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all .15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = '#4ade80'
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(74,222,128,.3)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--text3)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'
                  }}
                >
                  <svg width={11} height={11} viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <polyline points="1.5,5.5 4,8 9.5,2.5" />
                  </svg>
                  Marcar como concluído
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
