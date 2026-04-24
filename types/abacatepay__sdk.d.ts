declare module '@abacatepay/sdk' {
  interface AbacatePayClient {
    customers: {
      create(params: { email: string; name?: string }): Promise<{ id?: string; [key: string]: unknown }>
    }
    checkouts: {
      create(params: {
        methods: string[]
        items: Array<{ id: string; quantity: number }>
        customerId?: string
        externalId?: string
        completionUrl?: string
        returnUrl?: string
        [key: string]: unknown
      }): Promise<{ url?: string; [key: string]: unknown }>
    }
  }

  export function AbacatePay(config: { secret: string }): AbacatePayClient
}
