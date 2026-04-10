import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { PlanCard } from '@/components/plans/plan-card'
import { getEnrollmentBySlug } from '@/lib/programs'

interface ChecklistItem {
  id: string
  label: string
  done: boolean
}

interface ActionNote {
  id: string
  title: string
  content: string
  type: string
  day_number: number | null
  checklist: ChecklistItem[]
  completed: boolean
  created_at: string
}

export default async function ProgramPlansPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase  = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const enrollment = await getEnrollmentBySlug(user!.id, slug, supabase)
  if (!enrollment) notFound()

  const { data: notes } = await (supabase as any)
    .from('action_notes')
    .select('id, title, content, type, day_number, checklist, completed, created_at')
    .eq('user_id', user!.id)
    .eq('program_enrollment_id', enrollment.id)
    .order('created_at', { ascending: false }) as { data: ActionNote[] | null }

  const plans       = notes?.filter(n => n.type === 'plan' || n.type === 'action_items') ?? []
  const others      = notes?.filter(n => n.type !== 'plan' && n.type !== 'action_items') ?? []
  const activePlans = plans.filter(p => {
    if (p.completed) return false
    const cl = p.checklist ?? []
    return cl.length === 0 || cl.some(i => !i.done)
  })
  const donePlans = plans.filter(p => {
    if (p.completed) return true
    const cl = p.checklist ?? []
    return cl.length > 0 && cl.every(i => i.done)
  })

  const totalItems = plans.reduce((s, p) => s + (p.checklist?.length ?? 0), 0)
  const doneItems  = plans.reduce((s, p) => s + (p.checklist?.filter(i => i.done).length ?? 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title="Planos de Ação" subtitle={enrollment.program.name} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {notes?.length === 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: 300, gap: 10, color: 'var(--text3)',
            }}>
              <div style={{ fontSize: 32 }}>◈</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Nenhum plano ainda</div>
              <div style={{ fontSize: 12, color: 'var(--text4)', textAlign: 'center', maxWidth: 280 }}>
                Quando a IA gerar um plano de ação, ele aparecerá aqui com checkboxes para você acompanhar o progresso.
              </div>
            </div>
          )}

          {totalItems > 0 && (
            <div style={{
              background: 'var(--bg2)', border: '0.5px solid var(--border)',
              borderRadius: 'var(--r)', padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
                  {doneItems}<span style={{ fontSize: 13, color: 'var(--text4)', fontWeight: 400 }}>/{totalItems}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>ações concluídas</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 5, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${Math.round((doneItems / totalItems) * 100)}%`,
                    background: 'var(--accent)', transition: 'width .4s',
                  }} />
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                {Math.round((doneItems / totalItems) * 100)}%
              </div>
            </div>
          )}

          {activePlans.length > 0 && (
            <section>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text4)', marginBottom: 10 }}>
                Em andamento — {activePlans.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activePlans.map(note => (
                  <PlanCard key={note.id} id={note.id} title={note.title} content={note.content}
                    type={note.type} dayNumber={note.day_number} checklist={note.checklist ?? []}
                    completed={note.completed} createdAt={note.created_at} />
                ))}
              </div>
            </section>
          )}

          {donePlans.length > 0 && (
            <section>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text4)', marginBottom: 10 }}>
                Concluídos — {donePlans.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {donePlans.map(note => (
                  <PlanCard key={note.id} id={note.id} title={note.title} content={note.content}
                    type={note.type} dayNumber={note.day_number} checklist={note.checklist ?? []}
                    completed={note.completed} createdAt={note.created_at} />
                ))}
              </div>
            </section>
          )}

          {others.length > 0 && (
            <section>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--text4)', marginBottom: 10 }}>
                Notas e resumos — {others.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {others.map(note => (
                  <PlanCard key={note.id} id={note.id} title={note.title} content={note.content}
                    type={note.type} dayNumber={note.day_number} checklist={note.checklist ?? []}
                    completed={note.completed} createdAt={note.created_at} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
