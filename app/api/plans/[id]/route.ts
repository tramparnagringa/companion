import { createServerClient } from '@/lib/supabase/server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { id } = await params
  const body = await req.json()
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if ('checklist'  in body) patch.checklist  = body.checklist
  if ('completed'  in body) patch.completed  = body.completed

  const { error } = await (supabase as any)
    .from('action_notes')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[PATCH /api/plans/[id]]', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
