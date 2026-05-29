'use client'

import { useState, useTransition, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BookOpen, Sparkles, Zap, Brain } from 'lucide-react'
import { saveCardState } from '@/app/actions/day-activity'
import type { DayCard as DayCardType } from '@/lib/days'
import { isCardComplete } from '@/lib/days'

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
  learn:   { label: 'CONCEITO', icon: BookOpen },
  ai:      { label: 'SESSÃO IA', icon: Sparkles },
  action:  { label: 'AÇÃO',     icon: Zap      },
  reflect: { label: 'REFLEXÃO', icon: Brain    },
}

interface DayCardProps {
  card: DayCardType
  cardIndex: number
  dayNumber: number
  enrollmentId?: string
  savedState?: Record<string, boolean>
  defaultOpen?: boolean
  onComplete?: (cardIndex: number, complete: boolean) => void
  slug?: string
}

export function DayCard({ card, cardIndex, dayNumber, savedState = {}, defaultOpen = false, onComplete, enrollmentId, slug }: DayCardProps) {
  const readKey     = `card_${cardIndex}_read`
  const executedKey = `card_${cardIndex}_executed`
  const checkKey    = (i: number) => `card_${cardIndex}_check_${i}`

  const [open, setOpen]         = useState(defaultOpen)
  const [read, setRead]         = useState(savedState[readKey] ?? false)
  const [executed, setExecuted] = useState(savedState[executedKey] ?? false)
  const [checks, setChecks]     = useState<boolean[]>(
    () => (card.checklist ?? []).map((_, i) => savedState[checkKey(i)] ?? false)
  )
  const [, startTransition] = useTransition()

  const cfg         = TYPE_CONFIG[card.type]
  const isDone      = (card.type === 'learn' || card.type === 'reflect') ? read : executed
  const hasChecklist = !!(card.checklist && card.checklist.length > 0)

  // 'learn' maps to 'concept' for the CSS class; others match directly
  const typeClass = card.type === 'learn' ? 'concept' : card.type

  useEffect(() => {
    const currentState: Record<string, boolean> = {}
    if (card.type === 'learn' || card.type === 'reflect') currentState[readKey] = read
    if (card.type === 'ai' || card.type === 'action') currentState[executedKey] = executed
    onComplete?.(cardIndex, isCardComplete(card, cardIndex, currentState))
  }, [read, executed]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-complete action cards when every checklist item is ticked
  useEffect(() => {
    if (card.type !== 'action' || !card.checklist || card.checklist.length === 0) return
    const allDone = checks.length > 0 && checks.every(Boolean)
    if (allDone && !executed) {
      setExecuted(true)
      startTransition(() => { saveCardState(dayNumber, executedKey, true, enrollmentId) })
    } else if (!allDone && executed) {
      setExecuted(false)
      startTransition(() => { saveCardState(dayNumber, executedKey, false, enrollmentId) })
    }
  }, [checks]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleRead() {
    const next = !read
    setRead(next)
    startTransition(() => { saveCardState(dayNumber, readKey, next, enrollmentId) })
  }

  function toggleExecuted() {
    const next = !executed
    setExecuted(next)
    startTransition(() => { saveCardState(dayNumber, executedKey, next, enrollmentId) })
  }

  function toggleCheck(i: number) {
    const next = !checks[i]
    setChecks(prev => prev.map((v, idx) => idx === i ? next : v))
    startTransition(() => { saveCardState(dayNumber, checkKey(i), next, enrollmentId) })
  }

  const ctaHref = card.cta?.href ?? `/chat?day=${dayNumber}${slug ? `&slug=${slug}` : ''}&prompt=${encodeURIComponent(`Quero começar o Dia ${dayNumber} — ${card.title}`)}`

  return (
    <div className={`lesson-card ${typeClass}${open ? ' open' : ''}${isDone ? ' done' : ''}`}>

      {/* ── Header (always visible) ── */}
      <div className="lesson-head" onClick={() => setOpen(o => !o)}>

        {/* Type mark — 40×40, 2-letter abbreviation */}
        <div className={`lesson-mark ${isDone ? 'done' : typeClass}`}>
          {isDone ? <Check size={16} /> : <cfg.icon size={18} strokeWidth={1.8} />}
        </div>

        <div className="lesson-head-body">
          {/* Type label */}
          <div className={`lesson-type ${isDone ? 'done' : typeClass}`}>
            {cfg.label}{card.timeEst ? ` · ${card.timeEst}` : ''}
          </div>

          {/* Title */}
          <div className="lesson-title">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ children }) => <>{children}</> }}>
              {card.title}
            </ReactMarkdown>
          </div>

          {/* Preview snippet when collapsed */}
          {!open && card.preview && (
            <div className="lesson-snip">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p:      ({ children }) => <>{children}</>,
                  ul:     ({ children }) => <span>{children}</span>,
                  ol:     ({ children }) => <span>{children}</span>,
                  li:     ({ children }) => <span> · {children}</span>,
                  h1:     ({ children }) => <span>{children}</span>,
                  h2:     ({ children }) => <span>{children}</span>,
                  h3:     ({ children }) => <span>{children}</span>,
                  hr:     () => <span> — </span>,
                  br:     () => <span> </span>,
                }}
              >
                {card.preview}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Chevron */}
        <svg
          className="lesson-chev"
          width="16" height="16" viewBox="0 0 16 16"
          fill="none" stroke="currentColor" strokeWidth="1.7"
        >
          <polyline points="4,6 8,10 12,6" />
        </svg>
      </div>

      {/* ── Expanded body ── */}
      {open && (
        <>
          {/* Content blocks — CSS (.lesson-body) handles all markdown typography */}
          {card.content.length > 0 && (
            <div className="lesson-body">
              {card.content.map((block, i) => (
                <div key={i}>
                  {block.heading && (
                    <div style={{
                      fontSize: 16, fontWeight: 600,
                      color: 'var(--tng-ink)',
                      fontFamily: 'var(--tng-font-display)',
                      margin: i === 0 ? '0 0 12px' : '20px 0 12px',
                      letterSpacing: '-0.01em',
                    }}>
                      {block.heading}
                    </div>
                  )}
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {block.body}
                  </ReactMarkdown>
                </div>
              ))}
            </div>
          )}

          {/* Checklist */}
          {card.checklist && card.checklist.length > 0 && (
            <div className="lesson-checks">
              {card.checklist.map((item, i) => (
                <label key={i} className={checks[i] ? 'checked' : ''}>
                  <input
                    type="checkbox"
                    checked={checks[i] ?? false}
                    onChange={() => toggleCheck(i)}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="lesson-foot">

            {/* Left spacer — placeholder for future status indicator */}
            <span />

            {/* Right: done → só o toggle; pendente → CTA + toggle */}
            {card.type === 'learn' && (
              <button onClick={toggleRead} className={`btn-mark${read ? ' done' : ''}`}>
                {read ? <><Check size={11} /> Lido</> : 'Marcar como lido'}
              </button>
            )}

            {(card.type === 'ai' || card.type === 'action') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* CTA: hide for checklist-action cards (tasks are manual), always hide when done */}
                {!executed && !(card.type === 'action' && hasChecklist) && (
                  <a href={ctaHref} className={card.type === 'action' ? 'btn-action' : 'btn-ai'}>
                    {card.type === 'action' ? '→' : '✦'}{' '}
                    {card.cta?.label ?? (card.type === 'action' ? 'Executar com IA' : 'Iniciar sessão')}
                  </a>
                )}
                {/* Manual toggle: hidden for checklist-action (auto-complete drives it) unless already done */}
                {(card.type === 'ai' || !hasChecklist || executed) && (
                  <button onClick={toggleExecuted} className={`btn-mark${executed ? ' done' : ''}`}>
                    {executed ? <><Check size={11} /> Feito</> : 'Marcar como feito'}
                  </button>
                )}
              </div>
            )}

            {card.type === 'reflect' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {!read && (
                  <a
                    href={card.cta?.href ?? `/chat?day=${dayNumber}&mode=reflect${slug ? `&slug=${slug}` : ''}&prompt=${encodeURIComponent(`Dia ${dayNumber} — reflexão do dia`)}`}
                    className="btn-action"
                  >
                    ◎ {card.cta?.label ?? 'Reflexão do dia'}
                  </a>
                )}
                <button onClick={toggleRead} className={`btn-mark${read ? ' done' : ''}`}>
                  {read ? <><Check size={11} /> Feito</> : 'Marcar como feito'}
                </button>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  )
}
