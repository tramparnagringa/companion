import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

async function assertAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return p?.role === 'admin' ? user : null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await assertAdmin()
  if (!user) return new Response('Forbidden', { status: 403 })

  const { id } = await params
  const service = createServiceClient()

  const [programRes, daysRes] = await Promise.all([
    service.from('programs').select('*').eq('id', id).single(),
    service.from('program_days').select('*').eq('program_id', id).order('day_number'),
  ])

  if (!programRes.data) return new Response('Not found', { status: 404 })

  return Response.json({ ...programRes.data, days: daysRes.data ?? [] })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await assertAdmin()
  if (!user) return new Response('Forbidden', { status: 403 })

  const { id } = await params
  const body = await req.json() as {
    name?: string
    slug?: string
    description?: string
    is_published?: boolean
  }

  if (body.slug !== undefined) {
    const clean = body.slug
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    if (!clean) return Response.json({ error: 'invalid_slug' }, { status: 400 })
    body.slug = clean
  }

  const service = createServiceClient()
  const { error } = await service.from('programs')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
