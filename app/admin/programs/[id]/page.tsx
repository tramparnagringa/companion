import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { ProgramEditor } from '@/components/admin/program-editor'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const service = createServiceClient()
  const { data } = await service.from('programs').select('name').eq('id', id).single()
  return { title: data?.name ?? 'Programa' }
}

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

  const program = {
    ...programRes.data,
    days,
    week_themes: (programRes.data.week_themes ?? null) as Record<string, string> | null,
  }

  return (
    <ProgramEditor program={program} />
  )
}
