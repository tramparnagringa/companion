'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

type GrantableRole = 'student' | 'mentor' | 'admin'

export async function approveUser(params: {
  userId: string
  role: GrantableRole
  programId?: string
  manualTokens?: number
  manualValidityDays?: number
}) {
  const { userId, role, programId, manualTokens, manualValidityDays } = params

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: caller } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['mentor', 'admin'].includes(caller?.role ?? '')) {
    throw new Error('Forbidden')
  }

  const service = createServiceClient()

  // 1. Update role
  const { error: roleError } = await service
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (roleError) throw new Error(roleError.message)

  await service.from('mentor_actions').insert({
    mentor_id: user.id,
    target_user_id: userId,
    action: 'role_change',
    metadata: { new_role: role, previous_role: 'pending' },
  })

  // 2. Enroll in program (handles auto-token grant if program has token_allocation)
  if (programId) {
    const { data: program } = await service
      .from('programs')
      .select('id, name, slug, token_allocation, validity_days')
      .eq('id', programId)
      .single()

    if (program) {
      const { data: existing } = await service
        .from('user_programs')
        .select('id, status')
        .eq('user_id', userId)
        .eq('program_id', programId)
        .single()

      let isNewEnrollment = false

      if (existing) {
        if (existing.status !== 'active') {
          await service.from('user_programs')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', existing.id)
        }
      } else {
        await service.from('user_programs').insert({
          user_id: userId,
          program_id: programId,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        isNewEnrollment = true
      }

      // Auto-grant tokens if program has allocation configured
      if (isNewEnrollment && program.token_allocation && program.validity_days) {
        await service.from('token_balance').insert({
          user_id: userId,
          tokens_total: program.token_allocation,
          tokens_used: 0,
          expires_at: new Date(Date.now() + program.validity_days * 86_400_000).toISOString(),
          product_type: program.slug,
          source_payment_id: `enrollment_auto_${userId}_${Date.now()}`,
          is_active: true,
        })
      }

      await service.from('mentor_actions').insert({
        mentor_id: user.id,
        target_user_id: userId,
        action: 'enrollment',
        metadata: { program_id: programId, program_name: program.name },
      })
    }
  }

  // 3. Manual token grant (used when program has no allocation, or on top of it)
  if (manualTokens && manualTokens > 0 && manualValidityDays && manualValidityDays > 0) {
    await service.from('token_balance').insert({
      user_id: userId,
      tokens_total: manualTokens,
      tokens_used: 0,
      expires_at: new Date(Date.now() + manualValidityDays * 86_400_000).toISOString(),
      product_type: 'manual_grant',
      source_payment_id: `manual_${user.id}_${Date.now()}`,
      is_active: true,
    })

    await service.from('mentor_actions').insert({
      mentor_id: user.id,
      target_user_id: userId,
      action: 'token_grant',
      metadata: { tokens: manualTokens, validity_days: manualValidityDays },
    })
  }

  revalidatePath('/admin/students')
}
