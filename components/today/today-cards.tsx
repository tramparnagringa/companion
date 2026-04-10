'use client'

import Link from 'next/link'
import { useState, useTransition, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DayCard } from './day-card'
import { completeDayActivity } from '@/app/actions/day-activity'
import { isCardComplete } from '@/lib/days'
import type { DayDefinition } from '@/lib/days'

interface TodayCardsProps {
  dayDef: DayDefinition
  dayNumber: number
  savedState: Record<string, boolean>
  alreadyCompleted: boolean
  totalDays?: number
  enrollmentId?: string
  nextDay?: { day_number: number; week_number: number } | null
  weekThemes?: Record<string, string>
  slug?: string
}

export function TodayCards({ dayDef, dayNumber, savedState, alreadyCompleted, totalDays = 30, enrollmentId, nextDay, weekThemes = {}, slug }: TodayCardsProps) {
  const [cardComplete, setCardComplete] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(dayDef.cards.map((card, i) => [i, isCardComplete(card, i, savedState)]))
  )
  const [dayDone, setDayDone] = useState(alreadyCompleted)
  const [, startTransition] = useTransition()
  const router = useRouter()

  // Auto-heal: if all cards are already done in savedState but day isn't marked complete, fix it
  useEffect(() => {
    const initialAllDone = dayDef.cards.every((card, i) => isCardComplete(card, i, savedState))
    if (initialAllDone && !alreadyCompleted && enrollmentId) {
      setDayDone(true)
      startTransition(async () => {
        await completeDayActivity(dayNumber, enrollmentId)
        router.refresh()
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCardComplete = useCallback((cardIndex: number, complete: boolean) => {
    setCardComplete(prev => ({ ...prev, [cardIndex]: complete }))
  }, [])

  const allDone = dayDef.cards.every((_, i) => cardComplete[i])

  // Mark day complete when all cards are done
  useEffect(() => {
    if (allDone && !dayDone && enrollmentId) {
      setDayDone(true)
      startTransition(async () => {
        await completeDayActivity(dayNumber, enrollmentId)
        router.refresh()
      })
    }
  }, [allDone]) // eslint-disable-line react-hooks/exhaustive-deps

  const isWeekEnd = nextDay ? nextDay.week_number !== dayDef.week : false
  const currentWeekTheme = weekThemes[dayDef.week]
  const nextWeekTheme = nextDay ? weekThemes[nextDay.week_number] : null

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 640 }}>
        {dayDef.cards.map((card, i) => (
          <DayCard
            key={i}
            card={card}
            cardIndex={i}
            dayNumber={dayNumber}
            savedState={savedState}
            defaultOpen={i === 0 && !alreadyCompleted}
            onComplete={handleCardComplete}
            enrollmentId={enrollmentId}
            slug={slug}
          />
        ))}
      </div>

      {/* Day completion banner */}
      {(allDone || dayDone) && !isWeekEnd && (
        <div style={{
          marginTop: 20, maxWidth: 640,
          background: 'var(--green-dim)',
          border: '0.5px solid rgba(74,222,128,.25)',
          borderRadius: 'var(--r)',
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(74,222,128,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, flexShrink: 0,
          }}>
            ✓
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--green)', marginBottom: 2 }}>
              Dia {dayNumber} concluído
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
              Continue explorando no chat ou avance para o próximo dia.
            </div>
          </div>
          {dayNumber < totalDays && (
            <Link href={slug ? `/${slug}/days/${dayNumber + 1}` : `/days/${dayNumber + 1}`} style={{
              fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
              padding: '7px 13px', borderRadius: 'var(--rsm)',
              background: 'var(--green-dim)', color: 'var(--green)',
              border: '0.5px solid rgba(74,222,128,.25)',
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5,
              flexShrink: 0,
            }}>
              Dia {dayNumber + 1}
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 12, height: 12 }}>
                <polyline points="6,4 10,8 6,12" />
              </svg>
            </Link>
          )}
        </div>
      )}

      {/* Week completion banner */}
      {(allDone || dayDone) && isWeekEnd && nextDay && (
        <div style={{
          marginTop: 20, maxWidth: 640,
          background: 'var(--accent-dim)',
          border: '0.5px solid rgba(228,253,139,.25)',
          borderRadius: 'var(--r)',
          padding: '18px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'rgba(228,253,139,.12)',
              border: '0.5px solid rgba(228,253,139,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, flexShrink: 0,
            }}>
              ★
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>
                {currentWeekTheme ?? `Semana ${dayDef.week}`} concluída
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 14 }}>
                Retro feita. Você completou mais uma semana do bootcamp — isso é execução real.
                {nextWeekTheme && ` Pronto para a ${nextWeekTheme.split('—')[1]?.trim()}?`}
              </div>
              <Link href={slug ? `/${slug}/days/${nextDay.day_number}` : `/days/${nextDay.day_number}`} style={{
                fontSize: 13, fontWeight: 500,
                padding: '8px 16px', borderRadius: 'var(--rsm)',
                background: 'var(--accent)', color: 'var(--accent-text)',
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                {nextWeekTheme ? `Começar ${nextWeekTheme.split('—')[1]?.trim()}` : `Começar Semana ${nextDay.week_number}`}
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13 }}>
                  <polyline points="6,4 10,8 6,12" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
