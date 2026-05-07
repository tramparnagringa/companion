import { createServiceClient } from '@/lib/supabase/service'

export async function checkTokenBalance(
  userId: string
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

  return { allowed: available > 0, available }
}

export async function recordTokenUsage(
  userId: string,
  tokensConsumed: number,
  interactionType: string,
  metadata: Record<string, unknown> = {},
  model?: string,
  inputTokens?: number,
  outputTokens?: number
) {
  const supabase = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.rpc as any)('consume_tokens', {
    p_user_id: userId,
    p_tokens: tokensConsumed,
    p_interaction_type: interactionType,
    p_metadata: metadata,
    p_model: model ?? null,
    p_input_tokens: inputTokens ?? null,
    p_output_tokens: outputTokens ?? null,
  })
}
