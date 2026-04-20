'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

type GrantableRole = 'student' | 'mentor' | 'admin'

export async function approveUser(userId: string, role: GrantableRole) {
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

  const { error } = await service
    .from('profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  await service.from('mentor_actions').insert({
    mentor_id: user.id,
    target_user_id: userId,
    action: 'role_change',
    metadata: { new_role: role, previous_role: 'pending' },
  })

  revalidatePath('/admin/students')
}
