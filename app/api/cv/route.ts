import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/cv — returns { versions } ordered by created_at desc
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('cv_versions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ versions: data ?? [] })
}

// POST /api/cv — create a new named version
export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { name, content } = await req.json() as { name: string; content: any }
  if (!name?.trim()) return Response.json({ error: 'Name required' }, { status: 400 })

  const { data, error } = await supabase
    .from('cv_versions')
    .insert({
      user_id:      user.id,
      name:         name.trim(),
      generated_by: 'manual',
      is_active:    false,
      content,
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
