import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { StudentTabs } from '@/components/mentor/student-tabs'
import type { StudentData } from '@/components/mentor/student-tabs'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

async function getStudentData(userId: string): Promise<StudentData | null> {
  const supabase = createServiceClient()

  const [
    profileRes, candidateRes, daysRes, jobsRes,
    cvRes, balancesRes, usageRes, interviewRes, actionsRes, enrollmentsRes, programsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name, role, created_at').eq('id', userId).single(),
    supabase.from('candidate_profiles').select('*').eq('user_id', userId).single(),
    supabase.from('day_activities').select('day_number, status, outputs, completed_at, updated_at, created_at').eq('user_id', userId).order('day_number'),
    supabase.from('jobs').select('id, company_name, role_title, status, fit_score, apply_recommendation, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('cv_versions').select('id, name, generated_by, is_active, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('token_balance').select('id, tokens_total, tokens_used, product_type, expires_at, is_active, created_at').eq('user_id', userId).order('expires_at'),
    supabase.from('token_usage').select('id, tokens_consumed, interaction_type, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
    supabase.from('interview_prep').select('star_stories, technical_gaps, performance_map').eq('user_id', userId).single(),
    supabase.from('mentor_actions').select('id, action, metadata, created_at').eq('target_user_id', userId).order('created_at', { ascending: false }),
    supabase.from('user_programs').select('id, status, started_at, completed_at, program:programs(id, name, slug, total_days, description)').eq('user_id', userId).order('started_at'),
    supabase.from('programs').select('id, name, slug, is_published').order('name'),
  ])

  if (!profileRes.data) return null

  const raw = interviewRes.data as AnyRecord | null

  return {
    profile:       profileRes.data,
    candidate:     candidateRes.data ?? null,
    days:          daysRes.data ?? [],
    jobs:          jobsRes.data ?? [],
    cvVersions:    cvRes.data ?? [],
    tokenBalances: balancesRes.data ?? [],
    tokenUsage:    usageRes.data ?? [],
    interviewPrep: raw ? {
      star_stories:    raw.star_stories ?? null,
      technical_gaps:  raw.technical_gaps ?? null,
      performance_map: raw.performance_map ?? null,
    } : null,
    mentorActions: actionsRes.data ?? [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    enrollments: (enrollmentsRes.data ?? []) as any[],
    availablePrograms: programsRes.data ?? [],
  }
}

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const data = await getStudentData(userId)

  if (!data) notFound()

  return <StudentTabs data={data} userId={userId} backHref="/admin/students" />
}
