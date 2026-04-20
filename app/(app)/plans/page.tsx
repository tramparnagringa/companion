import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { PlanCard } from '@/components/plans/plan-card'

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
  program_enrollment_id: string | null
}

interface Enrollment {
  id: string
  program: { name: string; slug: string }
}

export default async function PlansPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [notesRes, enrollmentsRes] = await Promise.all([
    (supabase as any)
      .from('action_notes')
      .select('id, title, content, type, day_number, checklist, completed, created_at, program_enrollment_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('user_programs')
      .select('id, program:programs(name, slug)')
      .eq('user_id', user.id)
      .eq('status', 'active'),
  ])

  const notes       = (notesRes.data ?? []) as ActionNote[]
  const enrollments = (enrollmentsRes.data ?? []) as unknown as Enrollment[]

  const enrollmentMap = Object.fromEntries(
    enrollments.map(e => [e.id, e.program])
  )

  const byEnrollment: Record<string, ActionNote[]> = {}
  const freeNotes: ActionNote[] = []

  for (const note of notes) {
    if (note.program_enrollment_id && enrollmentMap[note.program_enrollment_id]) {
      if (!byEnrollment[note.program_enrollment_id]) byEnrollment[note.program_enrollment_id] = []
      byEnrollment[note.program_enrollment_id].push(note)
    } else {
      freeNotes.push(note)
    }
  }

  const hasAny = notes.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title="Planos de Ação" subtitle="Todos os programas" />

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 24 }}>

          {!hasAny && (
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

          {Object.entries(byEnrollment).map(([enrollmentId, enrollNotes]) => {
            const prog = enrollmentMap[enrollmentId]
            const active = enrollNotes.filter(n => {
              if (n.completed) return false
              const cl = n.checklist ?? []
              return cl.length === 0 || cl.some(i => !i.done)
            })
            const done = enrollNotes.filter(n => {
              if (n.completed) return true
              const cl = n.checklist ?? []
              return cl.length > 0 && cl.every(i => i.done)
            })

            return (
              <section key={enrollmentId}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
                  paddingBottom: 8, borderBottom: '0.5px solid var(--border)',
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: 'var(--accent)',
                    background: 'var(--accent-dim)', border: '0.5px solid rgba(228,253,139,.25)',
                    padding: '2px 8px', borderRadius: 8,
                  }}>
                    {prog.name}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text4)' }}>{enrollNotes.length} planos</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {active.map(note => (
                    <PlanCard key={note.id} id={note.id} title={note.title} content={note.content}
                      type={note.type} dayNumber={note.day_number} checklist={note.checklist ?? []}
                      completed={note.completed} createdAt={note.created_at} />
                  ))}
                  {done.map(note => (
                    <PlanCard key={note.id} id={note.id} title={note.title} content={note.content}
                      type={note.type} dayNumber={note.day_number} checklist={note.checklist ?? []}
                      completed={note.completed} createdAt={note.created_at} />
                  ))}
                </div>
              </section>
            )
          })}

          {freeNotes.length > 0 && (
            <section>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
                paddingBottom: 8, borderBottom: '0.5px solid var(--border)',
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--text3)',
                  background: 'var(--bg3)', border: '0.5px solid var(--border2)',
                  padding: '2px 8px', borderRadius: 8,
                }}>
                  Geral
                </span>
                <span style={{ fontSize: 11, color: 'var(--text4)' }}>{freeNotes.length} planos</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {freeNotes.map(note => (
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
