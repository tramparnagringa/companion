'use server'

import { createServerClient } from '@/lib/supabase/server'

export type JobStatus =
  | 'to_analyse'
  | 'analysing'
  | 'applied'
  | 'interviewing'
  | 'offer'
  | 'discarded'

export interface StatusLogEntry {
  from: JobStatus
  to: JobStatus
  at: string   // ISO8601
  note?: string
}

// ── Drag-and-drop column move ─────────────────────────────────────────────────
// Also appends to status_log.
export async function updateJobStatus(jobId: string, toStatus: JobStatus) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Read current status + log to build entry
  const { data: current } = await supabase
    .from('jobs')
    .select('status, status_log')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single() as unknown as { data: { status: string; status_log: StatusLogEntry[] } | null }

  if (!current) throw new Error('Job not found')

  const entry: StatusLogEntry = {
    from: current.status as JobStatus,
    to: toStatus,
    at: new Date().toISOString(),
  }

  const log: StatusLogEntry[] = [...(current.status_log ?? []), entry]

  const { error } = await supabase
    .from('jobs')
    .update({ status: toStatus, status_log: log, updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .eq('user_id', user.id)

  if (error) throw error
}

// ── Create ────────────────────────────────────────────────────────────────────
export async function createJob(company_name: string, role_title: string, status: JobStatus) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('jobs')
    .insert({ user_id: user.id, company_name, role_title, status, status_log: [] })
    .select()
    .single()

  if (error) throw error
  return data
}

// ── Archive (soft delete) ─────────────────────────────────────────────────────
export async function archiveJob(jobId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('jobs')
    .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .eq('user_id', user.id)

  if (error) throw error
}

// ── Full update (from detail drawer) ─────────────────────────────────────────
// If status changes, appends a log entry automatically.
export async function updateJob(jobId: string, fields: {
  company_name?: string
  role_title?: string
  status?: JobStatus
  source_url?: string
  job_description?: string
  fit_score?: number | null
  strong_keywords?: string[]
  weak_keywords?: string[]
  apply_recommendation?: boolean | null
  analysis_notes?: string
  applied_at?: string | null
  interview_notes?: string
  cover_note?: string
  recruiter_name?: string
  recruiter_linkedin?: string
}, note?: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  let logUpdate: { status_log: StatusLogEntry[] } | undefined

  if (fields.status) {
    const { data: current } = await supabase
      .from('jobs')
      .select('status, status_log')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single() as unknown as { data: { status: string; status_log: StatusLogEntry[] } | null }

    if (current && current.status !== fields.status) {
      const entry: StatusLogEntry = {
        from: current.status as JobStatus,
        to: fields.status,
        at: new Date().toISOString(),
        ...(note ? { note } : {}),
      }
      logUpdate = { status_log: [...(current.status_log ?? []), entry] }
    }
  }

  const { data, error } = await supabase
    .from('jobs')
    .update({ ...fields, ...logUpdate, updated_at: new Date().toISOString() })
    .eq('id', jobId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data
}
