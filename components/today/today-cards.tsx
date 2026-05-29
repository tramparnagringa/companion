'use client'

import Link from 'next/link'
import { useState, useTransition, useCallback, useEffect } from 'react'
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

export function TodayCards({ dayDef, dayNumber, savedState, alreadyCompleted, enrollmentId, nextDay, weekThemes = {}, slug }: TodayCardsProps) {
  const [cardComplete, setCardComplete] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(dayDef.cards.map((card, i) => [i, isCardComplete(card, i, savedState)]))
  )
  const [dayDone, setDayDone] = useState(alreadyCompleted)
  const [, startTransition] = useTransition()

  // Auto-heal: if all cards are already done in savedState but day isn't marked complete, fix it
  useEffect(() => {
    const initialAllDone = dayDef.cards.every((card, i) => isCardComplete(card, i, savedState))
    if (initialAllDone && !alreadyCompleted && enrollmentId) {
      setDayDone(true)
      startTransition(async () => {
        await completeDayActivity(dayNumber, enrollmentId)
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
      })
    }
  }, [allDone]) // eslint-disable-line react-hooks/exhaustive-deps

  const isWeekEnd = nextDay ? nextDay.week_number !== dayDef.week : false
  const currentWeekTheme = weekThemes[dayDef.week]
  const nextWeekTheme = nextDay ? weekThemes[nextDay.week_number] : null

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {dayDef.cards.map((card, i) => (
          <DayCard
            key={i}
            card={card}
            cardIndex={i}
            dayNumber={dayNumber}
            enrollmentId={enrollmentId}
            savedState={savedState}
            defaultOpen={i === 0 && !alreadyCompleted}
            onComplete={handleCardComplete}
            slug={slug}
          />
        ))}
      </div>

      {/* Program completion banner — triggered when no next day exists in the DB */}
      {(allDone || dayDone) && nextDay === null && (
        <div className="program-done-banner">
          <div className="program-done-banner-emoji">🎓</div>
          <div className="program-done-banner-title">Programa concluído!</div>
          <div className="program-done-banner-sub">
            Você completou todos os {dayNumber} dias. Isso é execução real — não todo mundo chega até aqui.
            O Mentor IA está disponível sempre que precisar: revisitar estratégia, preparar entrevistas, tirar dúvidas.
          </div>
          <div className="program-done-banner-actions">
            <Link
              href={`/chat?mode=mentor&prompt=${encodeURIComponent('Completei o programa! Quais são os meus próximos passos?')}`}
              className="program-done-banner-cta"
            >
              ◎ Continuar com o Mentor IA
            </Link>
            <span className="program-done-banner-hint">O mentor já tem todo o seu contexto</span>
          </div>
        </div>
      )}

      {/* Day completion banner */}
      {(allDone || dayDone) && !isWeekEnd && nextDay != null && (
        <div className="day-done-banner">
          <div className="day-done-banner-icon">✓</div>
          <div style={{ flex: 1 }}>
            <div className="day-done-banner-title">Dia {dayNumber} concluído</div>
            <div className="day-done-banner-sub">Continue explorando no chat ou avance para o próximo dia.</div>
          </div>
          <Link href={slug ? `/${slug}/days/${dayNumber + 1}` : `/days/${dayNumber + 1}`} className="day-done-banner-link">
            Dia {dayNumber + 1}
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 12, height: 12 }}>
              <polyline points="6,4 10,8 6,12" />
            </svg>
          </Link>
        </div>
      )}

      {/* Week completion banner */}
      {(allDone || dayDone) && isWeekEnd && nextDay && (
        <div className="week-done-banner">
          <div className="week-done-banner-inner">
            <div className="week-done-banner-icon">★</div>
            <div style={{ flex: 1 }}>
              <div className="week-done-banner-title">
                {currentWeekTheme ?? `Semana ${dayDef.week}`} concluída
              </div>
              <div className="week-done-banner-sub">
                Retro feita. Você completou mais uma semana do bootcamp — isso é execução real.
                {nextWeekTheme && ` Pronto para a ${nextWeekTheme.split('—')[1]?.trim()}?`}
              </div>
              <Link href={slug ? `/${slug}/days/${nextDay.day_number}` : `/days/${nextDay.day_number}`} className="week-done-banner-link">
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
