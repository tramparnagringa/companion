import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['mentor', 'admin'].includes(caller?.role ?? '')) {
    return new Response('Forbidden', { status: 403 })
  }

  const { target_user_id, note } = await req.json() as { target_user_id: string; note: string }
  if (!target_user_id || !note?.trim()) {
    return Response.json({ error: 'missing_fields' }, { status: 400 })
  }

  const service = createServiceClient()
  await service.from('mentor_actions').insert({
    mentor_id: user.id,
    target_user_id,
    action: 'note_added',
    metadata: { note: note.trim() },
  })

  return Response.json({ success: true })
}
