export const DEFAULT_TOKEN_COSTS = {
  chat_message:   1_200,
  mentor_message:   800,
  cv_rewrite:       900,
  day_init:         400,
} as const

export type InteractionType = keyof typeof DEFAULT_TOKEN_COSTS

/** Resolve the raw token cost for an interaction.
 *  Uses the program's override if set, otherwise falls back to the default. */
export function resolveTokenCost(
  type: InteractionType,
  programCosts?: Record<string, number> | null
): number {
  return programCosts?.[type] ?? DEFAULT_TOKEN_COSTS[type]
}

/** Display-only helper. Converts raw tokens to the user-facing credit value.
 *  Never use this in consumption or balance-check logic. */
export function tokenToCredits(tokens: number, ratio = 10): number {
  return Math.floor(tokens / ratio)
}
