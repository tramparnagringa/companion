/**
 * Token display convention — 1 crédito = 1.000 raw Anthropic tokens.
 *
 * This ratio is fixed across the platform. The `credit_ratio` field on the
 * `programs` table exists in the schema but is NOT used for display math —
 * all UI components hardcode 1_000 directly.
 *
 * Economics reference (Sonnet 4.6 pricing, 30% input / 70% output mix):
 *   - Typical full-program usage: ~600K–1.2M tokens ($7–$14 USD)
 *   - Recommended token_allocation: 2.000.000 → shows as "2.000 créditos"
 *   - Cost at 2M ceiling: ~$22 USD → comfortable margin at any price point
 */
export const CREDITS_PER_TOKEN = 1_000

/** Display-only helper. Converts raw Anthropic tokens to user-facing créditos. */
export function tokenToCredits(rawTokens: number): number {
  return Math.floor(rawTokens / CREDITS_PER_TOKEN)
}
