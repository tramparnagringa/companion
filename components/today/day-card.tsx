'use client'

import { useState, useTransition, useEffect } from 'react'
import { saveCardState } from '@/app/actions/day-activity'
import type { DayCard as DayCardType } from '@/lib/days'
import { isCardComplete } from '@/lib/days'

const TYPE_CONFIG = {
  learn:   { bg: 'var(--blue-dim)',   text: 'var(--blue)',   label: 'CONCEITO',   icon: '◈'  },
  ai:      { bg: 'var(--purple-dim)', text: 'var(--purple)', label: 'SESSÃO IA',  icon: '✦'  },
  action:  { bg: 'var(--green-dim)',  text: 'var(--green)',  label: 'AÇÃO',       icon: '→'  },
  reflect: { bg: 'var(--orange-dim)', text: 'var(--orange)', label: 'REFLEXÃO',   icon: '◎'  },
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

  const cfg    = TYPE_CONFIG[card.type]
  const isDone = (card.type === 'learn' || card.type === 'reflect') ? read : executed

  // Notify parent whenever completion state changes
  useEffect(() => {
    const currentState: Record<string, boolean> = {}
    if (card.type === 'learn' || card.type === 'reflect') currentState[readKey] = read
    if (card.type === 'ai' || card.type === 'action') currentState[executedKey] = executed
    onComplete?.(cardIndex, isCardComplete(card, cardIndex, currentState))
  }, [read, executed]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const aiLinkStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 500, padding: '6px 12px', borderRadius: 'var(--rsm)',
    background: 'var(--purple-dim)', color: 'var(--purple)',
    border: '0.5px solid rgba(167,139,250,.2)',
    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
    transition: 'opacity .15s',
  }
  const reflectLinkStyle: React.CSSProperties = {
    ...aiLinkStyle,
    background: 'var(--orange-dim)', color: 'var(--orange)',
    border: '0.5px solid rgba(251,146,60,.2)',
  }
  const doneBtnStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 500, padding: '6px 12px', borderRadius: 'var(--rsm)',
    background: 'var(--green-dim)', color: 'var(--green)',
    border: '0.5px solid rgba(74,222,128,.2)',
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
  }
  const idleBtnStyle: React.CSSProperties = {
    ...doneBtnStyle,
    background: 'var(--bg4)', color: 'var(--text2)',
    border: '0.5px solid var(--border2)',
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
          {!open && (
            <div style={{
              fontSize: 12, color: 'var(--text3)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {card.preview}
            </div>
          )}
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
          {card.content.length > 0 && (
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
                  {block.body.split('\n').filter(Boolean).map((para, j) => (
                    <p key={j} style={{ marginBottom: 8 }}>{para}</p>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Checklist */}
          {card.checklist && card.checklist.length > 0 && (
            <div style={{ paddingTop: 12 }}>
              {card.checklist.map((item, i) => (
                <label key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  fontSize: 13, color: checks[i] ? 'var(--text3)' : 'var(--text2)',
                  marginBottom: 6, cursor: 'pointer',
                  textDecoration: checks[i] ? 'line-through' : 'none',
                }}>
                  <input
                    type="checkbox"
                    checked={checks[i] ?? false}
                    onChange={() => toggleCheck(i)}
                    style={{ marginTop: 2, accentColor: 'var(--accent)', flexShrink: 0 }}
                  />
                  {item}
                </label>
              ))}
            </div>
          )}

          {/* Footer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 14, paddingTop: 12, borderTop: '0.5px solid var(--border)',
          }}>
            {/* Left: status */}
            {isDone ? (
              <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 500 }}>
                ✓ {card.type === 'learn' ? 'Lido' : 'Concluído'}
              </span>
            ) : card.tokenCost ? (
              <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                ~{card.tokenCost.toLocaleString()} tokens
              </span>
            ) : (
              <span />
            )}

            {/* Right: CTA */}
            {card.type === 'learn' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <a
                  href={`/chat?day=${dayNumber}${slug ? `&slug=${slug}` : ''}&prompt=${encodeURIComponent(`Quero aprofundar o tema do Dia ${dayNumber}: "${card.title}". ${card.content[0]?.body ?? ''}`)}`}
                  style={aiLinkStyle}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '.75')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  ✦ Aprofundar com IA
                </a>
                <button onClick={toggleRead} style={read ? doneBtnStyle : idleBtnStyle}>
                  {read ? '✓ Lido' : 'Marcar como lido'}
                </button>
              </div>
            )}

            {(card.type === 'ai' || card.type === 'action') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <a
                  href={card.cta?.href ?? `/chat?day=${dayNumber}${slug ? `&slug=${slug}` : ''}&prompt=${encodeURIComponent(`Dia ${dayNumber} — ${card.title}. ${card.content[0]?.body ?? ''}`)}`}
                  style={aiLinkStyle}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '.75')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  ✦ {card.cta?.label ?? (card.type === 'action' ? 'Executar com IA' : 'Iniciar sessão')}
                </a>
                <button onClick={toggleExecuted} style={executed ? doneBtnStyle : idleBtnStyle}>
                  {executed ? '✓ Feito' : 'Marcar como feito'}
                </button>
              </div>
            )}

            {card.type === 'reflect' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <a
                  href={card.cta?.href ?? `/chat?day=${dayNumber}&mode=reflect${slug ? `&slug=${slug}` : ''}&prompt=${encodeURIComponent(`Dia ${dayNumber} — reflexão do dia`)}`}
                  style={reflectLinkStyle}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '.75')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  ◎ {card.cta?.label ?? 'Reflexão do dia'}
                </a>
                <button onClick={toggleRead} style={read ? doneBtnStyle : idleBtnStyle}>
                  {read ? '✓ Feito' : 'Marcar como feito'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
