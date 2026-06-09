import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { AI_MODELS, MAX_TOKENS } from '@/lib/anthropic/models'

async function assertAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return p?.role === 'admin' ? user : null
}

// PUT /api/admin/programs/[id]/days — upsert a single day
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await assertAdmin()
  if (!user) return new Response('Forbidden', { status: 403 })

  const { id } = await params
  const body = await req.json() as {
    day_number: number
    name?: string
    description?: string
    ai_instructions?: string
    ai_model?: string
    ai_max_tokens?: number
    cards?: import('@/types/database').Json
  }

  if (!body.day_number) {
    return Response.json({ error: 'day_number required' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service.from('program_days')
    .update({
      name:            body.name,
      description:     body.description ?? null,
      ai_instructions: body.ai_instructions ?? null,
      ai_model:        body.ai_model ?? AI_MODELS.DEFAULT,
      ai_max_tokens:   body.ai_max_tokens ?? MAX_TOKENS.PROGRAM_DAY,
      cards:           body.cards ?? [],
      updated_at:      new Date().toISOString(),
    })
    .eq('program_id', id)
    .eq('day_number', body.day_number)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
