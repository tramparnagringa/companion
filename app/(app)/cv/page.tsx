import { createServerClient } from '@/lib/supabase/server'
import { CvEditor } from '@/components/cv/cv-editor'

export default async function CVPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('cv_versions')
    .select('*')
    .eq('user_id', user!.id)
    .neq('name', '__draft__')
    .order('created_at', { ascending: false })

  const versions = data ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <CvEditor initialVersions={versions as unknown as Parameters<typeof CvEditor>[0]['initialVersions']} />
    </div>
  )
}
