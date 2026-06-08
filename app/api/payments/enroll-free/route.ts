import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const { program_id } = await req.json() as { program_id: string }
  if (!program_id) return Response.json({ error: 'missing_program_id' }, { status: 400 })

  const service = createServiceClient()

  const { data: program } = await service
    .from('programs')
    .select('id, slug, price_brl, token_allocation, validity_days, store_visible')
    .eq('id', program_id)
    .eq('store_visible', true)
    .single()

  if (!program) return Response.json({ error: 'program_not_found' }, { status: 404 })

  if (program.price_brl !== 0) {
    return Response.json({ error: 'program_not_free' }, { status: 400 })
  }

  // Idempotency — skip if already enrolled
  const { data: existing } = await service
    .from('user_programs')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('program_id', program.id)
    .maybeSingle()

  if (existing?.status === 'active') {
    return Response.json({ redirect: `/${program.slug}/today` })
  }

  const sourceId = `free_enrollment_${user.id}_${program.id}`

  // Idempotency — skip if token balance already created
  const { data: existingBalance } = await service
    .from('token_balance')
    .select('id')
    .eq('source_payment_id', sourceId)
    .maybeSingle()

  if (!existingBalance) {
    const expiresAt = new Date(Date.now() + (program.validity_days ?? 365) * 86_400_000)

    const { error: tokenErr } = await service.from('token_balance').insert({
      user_id: user.id,
      tokens_total: program.token_allocation ?? 300_000,
      tokens_used: 0,
      expires_at: expiresAt.toISOString(),
      product_type: program.slug,
      source_payment_id: sourceId,
      is_active: true,
    })

    if (tokenErr) {
      console.error('[enroll-free] token_balance insert error:', tokenErr)
      return Response.json({ error: 'token_insert_failed' }, { status: 500 })
    }
  }

  if (!existing) {
    const { error: enrollErr } = await service.from('user_programs').insert({
      user_id: user.id,
      program_id: program.id,
      status: 'active',
      started_at: new Date().toISOString(),
    })
    if (enrollErr) {
      console.error('[enroll-free] user_programs insert error:', enrollErr)
      return Response.json({ error: 'enroll_failed' }, { status: 500 })
    }
  } else {
    await service
      .from('user_programs')
      .update({ status: 'active', started_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', existing.id)
  }

  await service
    .from('profiles')
    .update({ role: 'student' })
    .eq('id', user.id)
    .eq('role', 'pending')

  return Response.json({ redirect: `/${program.slug}/today` })
}
