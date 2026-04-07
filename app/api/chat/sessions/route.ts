import { createServerClient } from '@/lib/supabase/server'

// GET /api/chat/sessions — list user's sessions (most recent first)
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data, error } = await (supabase as any)
    .from('chat_sessions')
    .select('id, title, mode, day_number, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? [])
}

// POST /api/chat/sessions — create a new session
export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { title, mode, day_number } = await req.json()

  const { data, error } = await (supabase as any)
    .from('chat_sessions')
    .insert({
      user_id:    user.id,
      title:      title ?? 'Nova conversa',
      mode:       mode ?? 'task',
      day_number: day_number ?? null,
      messages:   [],
    })
    .select('id, title, mode, day_number, created_at, updated_at')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

// PATCH /api/chat/sessions — update messages for an existing session
export async function PATCH(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { id, messages } = await req.json()
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  const { error } = await (supabase as any)
    .from('chat_sessions')
    .update({ messages, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
