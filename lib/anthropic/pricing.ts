export const ANTHROPIC_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6':         { input: 3.00,  output: 15.00 },
  'claude-haiku-4-5-20251001': { input: 0.80,  output: 4.00  },
  'claude-opus-4-6':           { input: 15.00, output: 75.00 },
}

const FALLBACK_RATE = { input: 3.00, output: 15.00 } // sonnet como default conservador

export function computeCostUsd(
  model: string | null,
  inputTokens: number | null,
  outputTokens: number | null,
  tokensConsumed: number,
): number {
  const rate = ANTHROPIC_PRICING[model ?? ''] ?? FALLBACK_RATE
  if (inputTokens != null && outputTokens != null) {
    return (inputTokens  / 1_000_000) * rate.input
         + (outputTokens / 1_000_000) * rate.output
  }
  // fallback: estimar 30% input / 70% output
  return (tokensConsumed * 0.3 / 1_000_000) * rate.input
       + (tokensConsumed * 0.7 / 1_000_000) * rate.output
}

export function formatUsd(value: number): string {
  if (value < 0.01) return `$${value.toFixed(4)}`
  if (value < 1)    return `$${value.toFixed(3)}`
  return `$${value.toFixed(2)}`
}
