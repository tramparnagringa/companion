import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { ProgramEditor } from '@/components/admin/program-editor'

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const service = createServiceClient()

  const [programRes, daysRes] = await Promise.all([
    service.from('programs').select('*').eq('id', id).single(),
    service.from('program_days').select('*').eq('program_id', id).order('day_number'),
  ])

  if (!programRes.data) notFound()

  const days = (daysRes.data ?? []).map(d => ({
    ...d,
    cards: Array.isArray(d.cards) ? (d.cards as { type: 'learn' | 'ai' | 'action' | 'reflect'; title: string; description: string }[]) : undefined,
  }))

  return (
    <ProgramEditor
      program={{ ...programRes.data, days }}
    />
  )
}
