'use client'

import { useState, useTransition, useEffect } from 'react'
import { saveCardState } from '@/app/actions/day-activity'
import type { DayCard as DayCardType } from '@/lib/days'
import { isCardComplete } from '@/lib/days'

const TYPE_CONFIG = {
  learn:   { bg: 'var(--blue-dim)',   text: 'var(--blue)',   label: 'CONCEITO', icon: '📖' },
  ai:      { bg: 'var(--purple-dim)', text: 'var(--purple)', label: 'IA',       icon: '✦'  },
  action:  { bg: 'var(--green-dim)',  text: 'var(--green)',  label: 'AÇÃO',     icon: '→'  },
  reflect: { bg: 'var(--orange-dim)', text: 'var(--orange)', label: 'REFLEXÃO', icon: '◎'  },
}

interface DayCardProps {
  card: DayCardType
  cardIndex: number
  dayNumber: number
  enrollmentId?: string
  savedState?: Record<string, boolean>
  defaultOpen?: boolean
  onComplete?: (cardIndex: number, complete: boolean) => void
}

export function DayCard({ card, cardIndex, dayNumber, enrollmentId, savedState = {}, defaultOpen = false, onComplete }: DayCardProps) {
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

  const cfg    = TYPE_CONFIG[card.type]
  const isDone = card.type === 'learn' || card.type === 'reflect'
    ? read
    : card.type === 'ai'
    ? executed
    : checks.length > 0 && checks.every(Boolean)
  const doneCount = checks.filter(Boolean).length

  // Notify parent whenever completion state changes
  useEffect(() => {
    const currentState: Record<string, boolean> = {}
    if (card.type === 'learn' || card.type === 'reflect') currentState[readKey] = read
    if (card.type === 'ai') currentState[executedKey] = executed
    checks.forEach((v, i) => { currentState[checkKey(i)] = v })
    onComplete?.(cardIndex, isCardComplete(card, cardIndex, currentState))
  }, [read, executed, checks]) // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <div
      style={{
        background: 'var(--bg2)',
        border: `0.5px solid ${open ? 'var(--border2)' : 'var(--border)'}`,
        borderRadius: 'var(--rlg)',
        overflow: 'hidden',
        opacity: isDone ? 0.5 : 1,
        transition: 'border-color .15s, opacity .3s',
      }}
    >
      {/* Header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '15px 17px', cursor: 'pointer',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 'var(--rsm)',
          background: cfg.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontSize: 14,
        }}>
          {isDone ? '✓' : cfg.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '.1em',
            textTransform: 'uppercase', color: cfg.text, marginBottom: 4,
          }}>
            {cfg.label}{card.timeEst ? ` · ${card.timeEst}` : ''}
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>
            {card.title}
          </div>
          <div style={{
            fontSize: 12, color: 'var(--text3)',
            whiteSpace: 'nowrap', maxWidth: 400,
          }}>
            {card.preview}
          </div>
        </div>

        <svg
          width="14" height="14" viewBox="0 0 16 16" fill="none"
          stroke="currentColor" strokeWidth="1.5"
          style={{
            color: 'var(--text4)', flexShrink: 0, marginTop: 2,
            transition: 'transform .2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <polyline points="4,6 8,10 12,6" />
        </svg>
      </div>

      {/* Body */}
      {open && (
        <div style={{ borderTop: '0.5px solid var(--border)', padding: '0 17px 16px' }}>
          {/* Content blocks */}
          <div style={{ paddingTop: 14, fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
            {card.content.map((block, i) => (
              <div key={i}>
                {block.heading && (
                  <div style={{
                    fontSize: 12, fontWeight: 500, color: 'var(--text)',
                    margin: i === 0 ? '0 0 6px' : '12px 0 6px',
                  }}>
                    {block.heading}
                  </div>
                )}
                <p style={{ marginBottom: 8 }}>{block.body}</p>
              </div>
            ))}
          </div>

          {/* Checklist (action / reflect cards) */}
          {card.checklist && card.checklist.length > 0 && (
            <div style={{ margin: '10px 0' }}>
              {card.checklist.map((item, i) => (
                <div
                  key={i}
                  onClick={() => toggleCheck(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '7px 0',
                    borderBottom: i < card.checklist!.length - 1 ? '0.5px solid var(--border)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                    border: checks[i] ? 'none' : '0.5px solid var(--border2)',
                    background: checks[i] ? 'var(--green)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s',
                  }}>
                    {checks[i] && (
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <polyline points="1,3.5 3.5,6 8,1" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span style={{
                    fontSize: 12,
                    color: checks[i] ? 'var(--text4)' : 'var(--text2)',
                    textDecoration: checks[i] ? 'line-through' : 'none',
                    transition: 'color .15s',
                  }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 14, paddingTop: 12, borderTop: '0.5px solid var(--border)',
          }}>
            {/* Left: status label */}
            {isDone ? (
              <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 500 }}>
                ✓ {card.type === 'learn' ? 'Lido' : 'Concluído'}
              </span>
            ) : card.checklist && card.checklist.length > 0 ? (
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                {doneCount} de {card.checklist.length} feitos
              </span>
            ) : card.tokenCost ? (
              <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                ~{card.tokenCost.toLocaleString()} tokens
              </span>
            ) : (
              <span />
            )}

            {/* Right: CTA */}
            {(card.type === 'learn' || card.type === 'reflect') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {card.type === 'learn' && (() => {
                  const prompt = `Quero aprofundar o tema do Dia ${dayNumber}: "${card.title}". ${card.content[0]?.body ?? ''}`
                  return (
                    <a
                      href={`/chat?day=${dayNumber}&prompt=${encodeURIComponent(prompt)}`}
                      style={{
                        fontSize: 12, fontWeight: 500,
                        padding: '6px 12px', borderRadius: 'var(--rsm)',
                        background: 'var(--purple-dim)', color: 'var(--purple)',
                        border: '0.5px solid rgba(167,139,250,.2)',
                        textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
                        transition: 'opacity .15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '.75')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      ✦ Aprofundar
                    </a>
                  )
                })()}
                <button
                  onClick={toggleRead}
                  style={{
                    fontSize: 12, fontWeight: 500,
                    padding: '6px 12px', borderRadius: 'var(--rsm)',
                    background: read ? 'var(--green-dim)' : 'var(--bg4)',
                    color: read ? 'var(--green)' : 'var(--text2)',
                    border: read ? '0.5px solid rgba(74,222,128,.2)' : '0.5px solid var(--border2)',
                    cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all .2s',
                  }}
                >
                  {read ? '✓ Lido' : 'Marcar como lido'}
                </button>
              </div>
            )}

            {card.type === 'ai' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {card.cta && (() => {
                  const prompt = `Dia ${dayNumber} — ${card.title}. ${card.content[0]?.body ?? ''}`
                  return (
                    <a
                      href={`/chat?day=${dayNumber}&prompt=${encodeURIComponent(prompt)}`}
                      style={{
                        fontSize: 12, fontWeight: 500,
                        padding: '6px 12px', borderRadius: 'var(--rsm)',
                        background: 'var(--purple-dim)', color: 'var(--purple)',
                        border: '0.5px solid rgba(167,139,250,.2)',
                        textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5,
                        transition: 'opacity .15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '.75')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      
                      {card.cta.label}
                    </a>
                  )
                })()}
                <button
                  onClick={toggleExecuted}
                  style={{
                    fontSize: 12, fontWeight: 500,
                    padding: '6px 12px', borderRadius: 'var(--rsm)',
                    background: executed ? 'var(--green-dim)' : 'var(--bg4)',
                    color: executed ? 'var(--green)' : 'var(--text2)',
                    border: executed ? '0.5px solid rgba(74,222,128,.2)' : '0.5px solid var(--border2)',
                    cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all .2s',
                  }}
                >
                  {executed ? '✓ Feito' : 'Marcar como feito'}
                </button>
              </div>
            )}

            {card.cta && card.type !== 'learn' && card.type !== 'ai' && (
              <a
                href={card.cta.href}
                style={{
                  fontSize: 12, fontWeight: 500,
                  padding: '7px 13px', borderRadius: 'var(--rsm)',
                  background: 'var(--accent)', color: 'var(--accent-text)',
                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                  transition: 'opacity .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '.88')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {card.cta.label}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
