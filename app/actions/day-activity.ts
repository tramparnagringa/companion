'use server'

import { createServerClient } from '@/lib/supabase/server'
import { ensureEnrollment } from '@/lib/programs'

async function resolveEnrollmentId(
  userId: string,
  enrollmentId: string | undefined,
  supabase: Awaited<ReturnType<typeof createServerClient>>
): Promise<string | null> {
  if (enrollmentId) return enrollmentId
  return (await ensureEnrollment(userId, supabase))?.id ?? null
}

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

  // Resolve enrollmentId if not provided
  const resolvedEnrollmentId = await resolveEnrollmentId(user.id, enrollmentId, supabase)

  // Fetch or create the day_activity row
  let existing: { id: string; checklist: unknown; status: string } | null = null

  // Always look up by user_id + day_number to avoid duplicate rows
  const { data } = await supabase
    .from('day_activities')
    .select('id, checklist, status')
    .eq('user_id', user.id)
    .eq('day_number', dayNumber)
    .maybeSingle()
  existing = data

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
        program_enrollment_id: resolvedEnrollmentId,
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
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const resolvedEnrollmentId = await resolveEnrollmentId(user.id, enrollmentId, supabase)

  const { data: existing } = await supabase
    .from('day_activities')
    .select('id')
    .eq('user_id', user.id)
    .eq('day_number', dayNumber)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('day_activities')
      .update({
        status: 'done',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...(resolvedEnrollmentId ? { program_enrollment_id: resolvedEnrollmentId } : {}),
      })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('day_activities')
      .insert({
        user_id: user.id,
        day_number: dayNumber,
        program_enrollment_id: resolvedEnrollmentId,
        status: 'done',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
  }
}
