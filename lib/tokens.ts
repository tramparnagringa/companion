export const PRODUCTS = {
  bootcamp:             { tokens: 2_000_000, validity_days: 365 },
  mentoria:             { tokens: 2_000_000, validity_days: 365 },
  pack_starter:         { tokens: 100_000,   validity_days: 180 },
  pack_pro:             { tokens: 400_000,   validity_days: 180 },
  subscription_monthly: { tokens: 200_000,   validity_days: 30  },
} as const

export type ProductType = keyof typeof PRODUCTS

export const TOKEN_COSTS = {
  chat_message:   1_200,
  mentor_message:   800,
  cv_rewrite:       900,
  day_init:         400,
} as const

export type InteractionType = keyof typeof TOKEN_COSTS
