import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  // Check caller is mentor or admin
  const { data: caller } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['mentor', 'admin'].includes(caller?.role ?? '')) {
    return new Response('Forbidden', { status: 403 })
  }

  const { target_user_id, tokens, validity_days, reason, product_type } =
    await req.json() as {
      target_user_id: string
      tokens: number
      validity_days: number
      reason?: string
      product_type?: string
    }

  if (!target_user_id || !tokens || !validity_days) {
    return Response.json({ error: 'missing_fields' }, { status: 400 })
  }
  if (tokens <= 0 || validity_days <= 0) {
    return Response.json({ error: 'invalid_values' }, { status: 400 })
  }

  const service = createServiceClient()

  const { error: balanceError } = await service.from('token_balance').insert({
    user_id: target_user_id,
    tokens_total: tokens,
    tokens_used: 0,
    expires_at: new Date(Date.now() + validity_days * 86_400_000).toISOString(),
    product_type: product_type ?? 'manual_grant',
    source_payment_id: `manual_${user.id}_${Date.now()}`,
    is_active: true,
  })

  if (balanceError) {
    console.error('token_balance insert error:', balanceError)
    return Response.json({ error: 'db_error' }, { status: 500 })
  }

  await service.from('mentor_actions').insert({
    mentor_id: user.id,
    target_user_id,
    action: 'token_grant',
    metadata: { tokens, validity_days, reason: reason ?? null, product_type: product_type ?? 'manual_grant' },
  })

  return Response.json({ success: true })
}
