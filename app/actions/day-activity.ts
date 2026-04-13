'use server'

import { createServerClient } from '@/lib/supabase/server'

/**
 * Persists a single card state key for a day.
 * key format: "card_{cardIndex}_read" | "card_{cardIndex}_check_{itemIndex}"
 */
export async function saveCardState(
  dayNumber: number,
  key: string,
  value: boolean,
  enrollmentId?: string,
): Promise<void> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  if (!enrollmentId) return  // enrollmentId is always required; skip silently if missing

  // Fetch or create the day_activity row
  let existing: { id: string; checklist: unknown; status: string | null } | null = null

  {
    const { data } = await supabase
      .from('day_activities')
      .select('id, checklist, status')
      .eq('program_enrollment_id', enrollmentId)
      .eq('day_number', dayNumber)
      .maybeSingle()
    existing = data
  }

  const currentChecklist: Record<string, boolean> =
    (existing?.checklist as Record<string, boolean>) ?? {}

  const updatedChecklist = { ...currentChecklist, [key]: value }

  if (existing) {
    await supabase
      .from('day_activities')
      .update({
        checklist: updatedChecklist,
        status: (existing.status === 'pending' ? 'in_progress' : existing.status) as 'pending' | 'in_progress' | 'done' | 'skipped',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('day_activities')
      .insert({
        user_id: user.id,
        day_number: dayNumber,
        program_enrollment_id: enrollmentId,
        checklist: updatedChecklist,
        status: 'in_progress',
      })
  }
}

/**
 * Marks a day as fully completed.
 */
export async function completeDayActivity(
  dayNumber: number,
  enrollmentId?: string,
): Promise<void> {
  if (!enrollmentId) return  // enrollmentId is always required

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Fetch existing row (partial unique index can't be used in upsert onConflict)
  const { data: existing } = await supabase
    .from('day_activities')
    .select('id')
    .eq('program_enrollment_id', enrollmentId)
    .eq('day_number', dayNumber)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('day_activities')
      .update({
        status: 'done',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('day_activities')
      .insert({
        user_id: user.id,
        day_number: dayNumber,
        program_enrollment_id: enrollmentId,
        status: 'done',
        completed_at: new Date().toISOString(),
      })
  }
}
