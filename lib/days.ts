export type CardType = 'learn' | 'ai' | 'action' | 'reflect'

export interface CheckItem {
  label: string
}

export interface DayCard {
  type: CardType
  title: string
  preview: string
  timeEst?: string
  tokenCost?: number
  content: { heading?: string; body: string }[]
  checklist?: CheckItem[]
  cta?: { label: string; href: string }
}

export interface DayDefinition {
  number: number
  week: number
  name: string
  description: string
  cards: DayCard[]
}

export function isCardComplete(
  card: DayCard,
  cardIndex: number,
  savedState: Record<string, boolean>,
): boolean {
  if (card.type === 'ai' || card.type === 'action') return savedState[`card_${cardIndex}_executed`] === true
  if (card.type === 'learn' || card.type === 'reflect') return savedState[`card_${cardIndex}_read`] === true
  return false
}

export function getCurrentDay(completedDays: number[], maxDay = 30): number {
  if (completedDays.length === 0) return 1
  const maxDone = Math.max(...completedDays)
  return Math.min(maxDone + 1, maxDay)
}

export function getStreak(activities: { day_number: number; status: string | null; completed_at: string | null }[]): number {
  const doneDays = activities
    .filter(a => a.status === 'done' && a.completed_at)
    .map(a => a.day_number)
    .sort((a, b) => b - a)

  if (doneDays.length === 0) return 0

  let streak = 1
  for (let i = 0; i < doneDays.length - 1; i++) {
    if (doneDays[i] - doneDays[i + 1] === 1) streak++
    else break
  }
  return streak
}

export function getDayWeek(dayNumber: number): number {
  if (dayNumber <= 7) return 1
  if (dayNumber <= 14) return 2
  if (dayNumber <= 21) return 3
  return 4
}
