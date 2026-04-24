import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: Request) {
  const secret = process.env.ABACATEPAY_WEBHOOK_SECRET
  const auth = req.headers.get('Authorization')

  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const event = await req.json() as { event: string; data: any }

  if (event.event !== 'checkout.completed') {
    return Response.json({ ok: true })
  }

  const checkout = event.data?.checkout
  if (!checkout || checkout.status !== 'PAID' || !checkout.externalId) {
    return Response.json({ ok: true })
  }

  const [userId, programId] = checkout.externalId.split('|')
  if (!userId || !programId) {
    return Response.json({ error: 'invalid_external_id' }, { status: 400 })
  }

  const service = createServiceClient()

  // Idempotency — skip if this checkout was already processed
  const { data: existing } = await service
    .from('token_balance')
    .select('id')
    .eq('source_payment_id', checkout.id)
    .maybeSingle()

  if (existing) {
    console.log('[webhook] already processed, skipping:', checkout.id)
    return Response.json({ ok: true })
  }

  const { data: program, error: programErr } = await service
    .from('programs')
    .select('id, slug, token_allocation, validity_days')
    .eq('id', programId)
    .single()

  if (programErr || !program) {
    console.error('[webhook] program not found:', programId, programErr)
    return Response.json({ error: 'program_not_found' }, { status: 400 })
  }

  const expiresAt = new Date(Date.now() + (program.validity_days ?? 365) * 86_400_000)

  const { error: tokenErr } = await service.from('token_balance').insert({
    user_id: userId,
    tokens_total: program.token_allocation ?? 2_000_000,
    tokens_used: 0,
    expires_at: expiresAt.toISOString(),
    product_type: program.slug,
    source_payment_id: checkout.id,
    is_active: true,
  })
  if (tokenErr) {
    console.error('[webhook] token_balance insert error:', tokenErr)
    return Response.json({ error: 'token_insert_failed', detail: tokenErr.message }, { status: 500 })
  }

  const { data: enrollment } = await service
    .from('user_programs')
    .select('id, status')
    .eq('user_id', userId)
    .eq('program_id', program.id)
    .maybeSingle()

  if (!enrollment) {
    const { error: enrollErr } = await service.from('user_programs').insert({
      user_id: userId,
      program_id: program.id,
      status: 'active',
      started_at: new Date().toISOString(),
    })
    if (enrollErr) {
      console.error('[webhook] user_programs insert error:', enrollErr)
      return Response.json({ error: 'enroll_failed', detail: enrollErr.message }, { status: 500 })
    }
  } else if (enrollment.status !== 'active') {
    const { error: reactivateErr } = await service
      .from('user_programs')
      .update({ status: 'active', started_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', enrollment.id)
    if (reactivateErr) {
      console.error('[webhook] user_programs reactivate error:', reactivateErr)
      return Response.json({ error: 'reactivate_failed', detail: reactivateErr.message }, { status: 500 })
    }
  }

  const { error: roleErr } = await service
    .from('profiles')
    .update({ role: 'student' })
    .eq('id', userId)
    .eq('role', 'pending')
  if (roleErr) console.error('[webhook] role update error:', roleErr)

  console.log('[webhook] checkout processed:', checkout.id, { userId, programId })
  return Response.json({ ok: true })
}
