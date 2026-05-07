import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { abacatepay } from '@/lib/abacatepay/client'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 })

  const { program_id } = await req.json() as { program_id: string }
  if (!program_id) return Response.json({ error: 'missing_program_id' }, { status: 400 })

  const service = createServiceClient()

  const { data: program } = await service
    .from('programs')
    .select('id, name, slug, abacatepay_product_id, store_visible')
    .eq('id', program_id)
    .eq('store_visible', true)
    .single()

  if (!program) return Response.json({ error: 'program_not_found' }, { status: 404 })

  if (!program.abacatepay_product_id) {
    return Response.json({ error: 'program_not_configured_for_purchase' }, { status: 500 })
  }

  const { data: profile } = await service
    .from('profiles')
    .select('full_name, abacatepay_customer_id')
    .eq('id', user.id)
    .single()

  let customerId = profile?.abacatepay_customer_id ?? null

  if (!customerId) {
    const customerResult = await abacatepay.customers.create({
      email: user.email!,
      name: profile?.full_name ?? undefined,
    }) as any

    if (customerResult.id) {
      customerId = customerResult.id
      await service
        .from('profiles')
        .update({ abacatepay_customer_id: customerId })
        .eq('id', user.id)
    }
  }

  const programId = program.id
  const programSlug = program.slug
  const productId = program.abacatepay_product_id!
  const userId = user.id

  async function createCheckout(cId: string | null) {
    return abacatepay.checkouts.create({
      methods: ['PIX', 'CARD'] as any,
      items: [{ id: productId, quantity: 1 }],
      ...(cId ? { customerId: cId } : {}),
      externalId: `${userId}|${programId}|${Date.now()}`,
      completionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${programSlug}/today`,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/programs`,
    }) as any
  }

  let checkoutResult = await createCheckout(customerId).catch(async (err) => {
    if (typeof err?.message === 'string' && err.message.includes('Customer not found')) {
      // stale customer ID — create a fresh one and retry
      await service.from('profiles').update({ abacatepay_customer_id: null }).eq('id', userId)
      const fresh = await abacatepay.customers.create({
        email: user.email!,
        name: profile?.full_name ?? undefined,
      }) as any
      const freshId = fresh.id ?? null
      if (freshId) {
        await service.from('profiles').update({ abacatepay_customer_id: freshId }).eq('id', userId)
      }
      return createCheckout(freshId)
    }
    throw err
  })

  if (!checkoutResult.url) {
    console.error('[checkout] AbacatePay result:', JSON.stringify(checkoutResult))
    return Response.json({ error: 'checkout_creation_failed' }, { status: 500 })
  }

  return Response.json({ url: checkoutResult.url })
}
