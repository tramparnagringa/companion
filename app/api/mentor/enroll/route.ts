import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['mentor', 'admin'].includes(caller?.role ?? '')) {
    return new Response('Forbidden', { status: 403 })
  }

  const { target_user_id, program_id } = await req.json() as {
    target_user_id: string
    program_id: string
  }

  if (!target_user_id || !program_id) {
    return Response.json({ error: 'missing_fields' }, { status: 400 })
  }

  const service = createServiceClient()

  // Check program exists (admin can enroll in any program, published or not)
  const { data: program } = await service
    .from('programs')
    .select('id, name, slug')
    .eq('id', program_id)
    .single()

  if (!program) {
    return Response.json({ error: 'program_not_found' }, { status: 404 })
  }

  // Check if already enrolled
  const { data: existing } = await service
    .from('user_programs')
    .select('id, status')
    .eq('user_id', target_user_id)
    .eq('program_id', program_id)
    .single()

  let isNewEnrollment = false

  if (existing) {
    if (existing.status === 'active') {
      return Response.json({ error: 'already_enrolled' }, { status: 409 })
    }
    // Re-activate if paused/cancelled
    await service.from('user_programs')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    await service.from('user_programs').insert({
      user_id: target_user_id,
      program_id,
      enrolled_by: user.id,
      status: 'active',
      started_at: new Date().toISOString(),
    })
    isNewEnrollment = true
  }

  // Auto-grant tokens on new enrollment if program has token_allocation configured
  if (isNewEnrollment) {
    const { data: tokenConfig } = await service
      .from('programs')
      .select('token_allocation, validity_days')
      .eq('id', program_id)
      .single()

    if (tokenConfig?.token_allocation && tokenConfig?.validity_days) {
      const expiresAt = new Date(Date.now() + tokenConfig.validity_days * 86_400_000)
      await service.from('token_balance').insert({
        user_id: target_user_id,
        tokens_total: tokenConfig.token_allocation,
        tokens_used: 0,
        expires_at: expiresAt.toISOString(),
        product_type: program.slug,
        source_payment_id: `enrollment_auto_${target_user_id}_${Date.now()}`,
        is_active: true,
      })
    }
  }

  // Log mentor action
  await service.from('mentor_actions').insert({
    mentor_id: user.id,
    target_user_id,
    action: 'enrollment',
    metadata: { program_id, program_name: program.name },
  })

  return Response.json({ success: true, program_name: program.name })
}

export async function PATCH(req: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { data: caller } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['mentor', 'admin'].includes(caller?.role ?? '')) {
    return new Response('Forbidden', { status: 403 })
  }

  const { enrollment_id, user_id } = await req.json() as {
    enrollment_id: string
    user_id: string
  }

  if (!enrollment_id || !user_id) {
    return Response.json({ error: 'missing_fields' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: enrollment } = await service
    .from('user_programs')
    .select('id, status, program:programs(name)')
    .eq('id', enrollment_id)
    .eq('user_id', user_id)
    .single()

  if (!enrollment) {
    return Response.json({ error: 'enrollment_not_found' }, { status: 404 })
  }

  await service
    .from('user_programs')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', enrollment_id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const programName = (enrollment.program as any)?.name ?? ''

  await service.from('mentor_actions').insert({
    mentor_id: user.id,
    target_user_id: user_id,
    action: 'unenrollment',
    metadata: { enrollment_id, program_name: programName },
  })

  return Response.json({ success: true, program_name: programName })
}
