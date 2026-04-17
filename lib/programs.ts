/**
 * Data access layer for programs, program_days, and user_programs.
 * This is the runtime replacement for the hardcoded DAYS array and
 * DAY_INSTRUCTIONS map. All program content comes from the DB.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { DayCard } from '@/lib/days'

export interface ProgramDay {
  id: string
  program_id: string
  day_number: number
  week_number: number
  name: string
  description: string | null
  cards: DayCard[]
  ai_instructions: string | null
  ai_model: string
  ai_max_tokens: number
}

export interface Program {
  id: string
  slug: string
  name: string
  description: string | null
  total_days: number
  week_themes: Record<string, string>
  is_published: boolean
}

export interface UserEnrollment {
  id: string
  user_id: string
  program_id: string
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  started_at: string
  completed_at: string | null
  program: Program
}

type Supabase = SupabaseClient<Database>

const DEFAULT_PROGRAM_SLUG = 'tng-bootcamp'

/**
 * Returns the active enrollment matching a program slug, or null.
 */
export async function getEnrollmentBySlug(
  userId: string,
  slug: string,
  supabase: Supabase
): Promise<UserEnrollment | null> {
  // Resolve program id first, then look up the enrollment
  const { data: program } = await supabase
    .from('programs')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (!program) return null

  const { data, error } = await supabase
    .from('user_programs')
    .select('*, program:programs(*)')
    .eq('user_id', userId)
    .eq('program_id', program.id)
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    console.error('[programs] getEnrollmentBySlug error:', error)
    return null
  }

  return data as UserEnrollment | null
}

/**
 * Returns all active enrollments for a user, ordered by started_at.
 */
export async function getAllEnrollments(
  userId: string,
  supabase: Supabase
): Promise<UserEnrollment[]> {
  const { data, error } = await supabase
    .from('user_programs')
    .select('*, program:programs(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('started_at', { ascending: true })

  if (error) {
    console.error('[programs] getAllEnrollments error:', error)
    return []
  }

  return (data ?? []) as unknown as UserEnrollment[]
}

/**
 * Returns the active enrollment for a user, or null if none exists.
 */
export async function getActiveEnrollment(
  userId: string,
  supabase: Supabase
): Promise<UserEnrollment | null> {
  const { data, error } = await supabase
    .from('user_programs')
    .select('*, program:programs(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('started_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[programs] getActiveEnrollment error:', error)
    return null
  }

  return data as UserEnrollment | null
}

/**
 * Returns the active enrollment for the user, or null if none exists.
 * Enrollment must be granted manually by a mentor or admin.
 */
export async function ensureEnrollment(
  userId: string,
  supabase: Supabase
): Promise<UserEnrollment | null> {
  return getActiveEnrollment(userId, supabase)
}

/**
 * Returns all program_days for a given program, ordered by day_number.
 */
export async function getProgramDays(
  programId: string,
  supabase: Supabase
): Promise<ProgramDay[]> {
  const { data, error } = await supabase
    .from('program_days')
    .select('*')
    .eq('program_id', programId)
    .order('day_number', { ascending: true })

  if (error) {
    console.error('[programs] getProgramDays error:', error)
    return []
  }

  return (data ?? []).map(row => ({
    ...row,
    cards: (row.cards ?? []) as unknown as DayCard[],
  })) as ProgramDay[]
}

/**
 * Returns a single program_day by program_id + day_number.
 */
export async function getProgramDay(
  programId: string,
  dayNumber: number,
  supabase: Supabase
): Promise<ProgramDay | null> {
  const { data, error } = await supabase
    .from('program_days')
    .select('*')
    .eq('program_id', programId)
    .eq('day_number', dayNumber)
    .single()

  if (error || !data) return null

  return {
    ...data,
    cards: (data.cards ?? []) as unknown as DayCard[],
  } as ProgramDay
}

/**
 * Convenience: gets the program_day for the user's active enrollment.
 * Returns null if no enrollment or day not found.
 */
export async function getDayForUser(
  userId: string,
  dayNumber: number,
  supabase: Supabase
): Promise<ProgramDay | null> {
  const enrollment = await getActiveEnrollment(userId, supabase)
  if (!enrollment) return null
  return getProgramDay(enrollment.program_id, dayNumber, supabase)
}
