import { createServerClient } from '@/lib/supabase/server'
import { BoardShell } from '@/components/board/board-shell'
import type { Job } from '@/components/board/job-detail'

export default async function BoardPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [jobsResult, { data: candidate }] = await Promise.all([
    supabase.from('jobs').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }),
    supabase.from('candidate_profiles').select('target_role').eq('user_id', user!.id).single(),
  ])

  const jobs = (jobsResult.data ?? []) as unknown as Job[]

  return (
    <BoardShell
      initialJobs={jobs}
      defaultRole={candidate?.target_role ?? ''}
    />
  )
}
