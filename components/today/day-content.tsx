'use client'

import { useState, useTransition, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useRouter } from 'next/navigation'
import { startDayActivity, completeDayActivity, saveCardState } from '@/app/actions/day-activity'
import type { DayDefinition } from '@/lib/days'

interface DayContentProps {
  dayDef: DayDefinition
  dayNumber: number
  activityStatus: string
  savedState: Record<string, boolean>
  enrollmentId?: string
  nextDay?: { day_number: number; week_number: number } | null
  slug?: string
  lastSession?: { id: string; title: string | null; updated_at: string | null } | null
}

export function DayContent({ dayDef, dayNumber, activityStatus, savedState, enrollmentId, nextDay, slug, lastSession }: DayContentProps) {
  const router = useRouter()
  const [cardChecks, setCardChecks] = useState<Record<string, boolean>>(savedState)
  const [, startTransition] = useTransition()

  // Auto-progress: pending → in_progress on page load; in_progress → done on return
  useEffect(() => {
    if (!enrollmentId) return
    if (activityStatus === 'pending') {
      startTransition(() => { startDayActivity(dayNumber, enrollmentId) })
    } else if (activityStatus === 'in_progress') {
      startTransition(async () => {
        await completeDayActivity(dayNumber, enrollmentId)
        router.refresh()
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleCheck(cardIndex: number, checkIndex: number) {
    const key = `card_${cardIndex}_check_${checkIndex}`
    const next = !cardChecks[key]
    setCardChecks(prev => ({ ...prev, [key]: next }))
    startTransition(() => { saveCardState(dayNumber, key, next, enrollmentId) })
  }

  // Build chat CTA: prefer first ai/action card's href, else generic day chat
  const ctaCard = dayDef.cards.find(c => c.type === 'ai' || c.type === 'action')
  const chatBase = slug ? `/${slug}/days/${dayNumber}/chat` : `/chat?day=${dayNumber}`
  const ctaHref = ctaCard?.cta?.href
    ?? `${chatBase}?prompt=${encodeURIComponent(`Quero começar o Dia ${dayNumber} — ${dayDef.name}`)}`

  const nextDayHref = nextDay
    ? (slug ? `/${slug}/days/${nextDay.day_number}` : `/days/${nextDay.day_number}`)
    : null

  return (
    <>
      <div className="day-prose-body">
        {dayDef.cards.map((card, cardIndex) => {
          const hasChecklist = !!(card.checklist && card.checklist.length > 0)
          // External CTA: action cards pointing somewhere other than /chat
          const isExternalCta = card.type === 'action' && !!card.cta?.href && !card.cta.href.includes('/chat')

          return (
            <div key={cardIndex} className={cardIndex > 0 ? 'day-prose-section' : undefined}>
              {card.content.length > 0 && (
                <div className="day-prose-blocks">
                  {card.content.map((block, i) => (
                    <div key={i}>
                      {block.heading && (
                        <div style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: 'var(--tng-ink)',
                          fontFamily: 'var(--tng-font-display)',
                          margin: i === 0 ? '0 0 12px' : '20px 0 12px',
                          letterSpacing: '-0.01em',
                        }}>
                          {block.heading}
                        </div>
                      )}
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.body}</ReactMarkdown>
                    </div>
                  ))}
                </div>
              )}

              {hasChecklist && (
                <div className="day-prose-checks">
                  {card.checklist!.map((item, i) => {
                    const key = `card_${cardIndex}_check_${i}`
                    const checked = cardChecks[key] ?? false
                    return (
                      <label
                        key={i}
                        className={`day-check-label${checked ? ' checked' : ''}`}
                        onClick={() => toggleCheck(cardIndex, i)}
                      >
                        <span className="day-check-box" aria-hidden />
                        {item.label}
                      </label>
                    )
                  })}
                </div>
              )}

              {isExternalCta && (
                <div style={{ marginTop: 16 }}>
                  <a href={card.cta!.href} className="btn-action" target="_blank" rel="noopener noreferrer">
                    → {card.cta!.label}
                  </a>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="day-cta-wrap">
        <div className="day-cta-left">
          {lastSession ? (
            <>
              <a
                href={slug ? `/${slug}/days/${dayNumber}/chat?sessionId=${lastSession.id}` : `/chat?day=${dayNumber}&sessionId=${lastSession.id}`}
                className="btn-resume"
              >
                ↩ Retomar sessão
              </a>
              <a href={ctaHref} className="btn-execute">
                + Nova sessão
              </a>
            </>
          ) : (
            <a href={ctaHref} className="btn-execute">
              ✦ Executar com IA
            </a>
          )}
        </div>
        {nextDayHref && (
          <a href={nextDayHref} className="btn-next-day">
            Avançar para Dia {nextDay!.day_number} →
          </a>
        )}
      </div>
    </>
  )
}
