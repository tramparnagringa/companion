import { AbacatePay } from '@abacatepay/sdk'

export const abacatepay = AbacatePay({ secret: process.env.ABACATEPAY_API_KEY! })
