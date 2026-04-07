import { createServerClient } from '@/lib/supabase/server'

// GET /api/chat/sessions/:id — get full session (messages + notes)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { id } = await params

  const [sessionRes, notesRes] = await Promise.all([
    (supabase as any)
      .from('chat_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    (supabase as any)
      .from('action_notes')
      .select('*')
      .eq('session_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),
  ])

  if (sessionRes.error) return Response.json({ error: sessionRes.error.message }, { status: 404 })

  return Response.json({
    session: sessionRes.data,
    notes:   notesRes.data ?? [],
  })
}
