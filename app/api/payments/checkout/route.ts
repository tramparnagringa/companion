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

  const checkoutResult = await abacatepay.checkouts.create({
    methods: ['PIX'] as any,
    items: [{ id: program.abacatepay_product_id, quantity: 1 }],
    ...(customerId ? { customerId } : {}),
    externalId: `${user.id}|${program.id}|${Date.now()}`,
    completionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${program.slug}/today`,
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/programs`,
  }) as any

  if (!checkoutResult.url) {
    console.error('[checkout] AbacatePay result:', JSON.stringify(checkoutResult))
    return Response.json({ error: 'checkout_creation_failed' }, { status: 500 })
  }

  return Response.json({ url: checkoutResult.url })
}
