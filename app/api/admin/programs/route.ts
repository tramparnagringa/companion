import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

async function assertAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (p?.role !== 'admin') return null
  return user
}

export async function GET() {
  const user = await assertAdmin()
  if (!user) return new Response('Forbidden', { status: 403 })

  const service = createServiceClient()
  const { data: programs } = await service
    .from('programs')
    .select('id, slug, name, description, total_days, is_published, created_at')
    .order('created_at', { ascending: false })

  // Enrollment counts
  const { data: enrollments } = await service
    .from('user_programs')
    .select('program_id')
    .eq('status', 'active')

  const countByProgram: Record<string, number> = {}
  for (const e of enrollments ?? []) {
    countByProgram[e.program_id] = (countByProgram[e.program_id] ?? 0) + 1
  }

  return Response.json((programs ?? []).map(p => ({
    ...p,
    enrolled_count: countByProgram[p.id] ?? 0,
  })))
}

export async function POST(req: Request) {
  const user = await assertAdmin()
  if (!user) return new Response('Forbidden', { status: 403 })

  const { name, description, total_days } = await req.json() as {
    name: string
    description?: string
    total_days: number
  }

  if (!name || !total_days) {
    return Response.json({ error: 'missing_fields' }, { status: 400 })
  }

  const service = createServiceClient()
  const slug = name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const { data, error } = await service.from('programs').insert({
    slug,
    name,
    description: description ?? null,
    total_days,
    week_themes: {},
    is_published: false,
    created_by: user.id,
  }).select('id').single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Pre-create day stubs
  const days = Array.from({ length: total_days }, (_, i) => ({
    program_id:   data.id,
    day_number:   i + 1,
    week_number:  Math.ceil((i + 1) / 7),
    name:         `Dia ${i + 1}`,
    description:  null,
    cards:        [],
    ai_instructions: null,
    ai_model:     'claude-sonnet-4-6',
    ai_max_tokens: 1024,
  }))

  await service.from('program_days').insert(days)

  return Response.json({ id: data.id })
}
