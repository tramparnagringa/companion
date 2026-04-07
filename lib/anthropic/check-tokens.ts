import { createServiceClient } from '@/lib/supabase/service'

export async function checkTokenBalance(
  userId: string,
  required: number
): Promise<{ allowed: boolean; available: number }> {
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('token_balance')
    .select('tokens_total, tokens_used')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())

  if (!data || data.length === 0) return { allowed: false, available: 0 }

  const available = data.reduce(
    (sum, b) => sum + (b.tokens_total - b.tokens_used),
    0
  )

  return { allowed: available >= required, available }
}

export async function recordTokenUsage(
  userId: string,
  tokensConsumed: number,
  interactionType: string,
  metadata: Record<string, unknown> = {}
) {
  const supabase = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.rpc as any)('consume_tokens', {
    p_user_id: userId,
    p_tokens: tokensConsumed,
    p_interaction_type: interactionType,
    p_metadata: metadata,
  })
}
