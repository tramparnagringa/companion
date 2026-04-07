// DEV ONLY — remove before production
import { createServerClient } from '@/lib/supabase/server'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not found', { status: 404 })
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { error } = await supabase.from('token_balance').insert({
    user_id: user.id,
    tokens_total: 10_000_000,
    tokens_used: 0,
    expires_at: new Date(Date.now() + 365 * 86_400_000).toISOString(),
    product_type: 'manual_grant',
    is_active: true,
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true, tokens: 10_000_000 })
}
