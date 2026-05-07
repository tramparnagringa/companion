/** Display-only helper. Converts raw tokens to the user-facing credit value.
 *  Never use this in consumption or balance-check logic. */
export function tokenToCredits(tokens: number, ratio = 10): number {
  return Math.floor(tokens / ratio)
}
