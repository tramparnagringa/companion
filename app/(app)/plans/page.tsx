import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { PlanCard } from '@/components/plans/plan-card'
import { getStreak } from '@/lib/days'

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

  const [notesRes, enrollmentsRes, activitiesRes] = await Promise.all([
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
    supabase
      .from('day_activities')
      .select('day_number, status, completed_at')
      .eq('user_id', user.id),
  ])

  const notes       = (notesRes.data ?? []) as ActionNote[]
  const enrollments = (enrollmentsRes.data ?? []) as unknown as Enrollment[]
  const streak      = getStreak(activitiesRes.data ?? [])

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(' ')[0]
    ?? (user?.email?.split('@')[0] ?? 'você')

  const completedCount = notes.filter(n => {
    if (n.completed) return true
    const cl = n.checklist ?? []
    return cl.length > 0 && cl.every(i => i.done)
  }).length
  const activeCount = notes.length - completedCount

  const enrollmentMap = Object.fromEntries(enrollments.map(e => [e.id, e.program]))

  // Group by program enrollment, free notes separate
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

  const breadcrumb = (
    <div className="topbar-crumb">
      <strong>Planos de Ação</strong>
      {notes.length > 0 && (
        <>
          <span className="sep crumb-detail">/</span>
          <strong className="crumb-detail">
            {notes.length} plano{notes.length !== 1 ? 's' : ''}
          </strong>
        </>
      )}
    </div>
  )

  return (
    <div className="page-col">
      <Topbar title={breadcrumb} streak={streak} />

      <div className="page-scroll">
        <div className="page-content">

          {/* ── Plans Hero ── */}
          <div className="today-greeting">
            <div className="today-greeting-hi">
              Oi, <strong>{firstName}</strong> — seus planos de ação 📋
            </div>
            {notes.length > 0 && (
              <div className="today-mini-stats">
                <span><strong>{notes.length}</strong> plano{notes.length !== 1 ? 's' : ''} no total</span>
                {activeCount > 0 && (
                  <>
                    <span className="today-mini-sep">·</span>
                    <span><strong>{activeCount}</strong> em andamento</span>
                  </>
                )}
                {completedCount > 0 && (
                  <>
                    <span className="today-mini-sep">·</span>
                    <span><strong>{completedCount}</strong> concluído{completedCount !== 1 ? 's' : ''}</span>
                  </>
                )}
                {streak > 1 && (
                  <>
                    <span className="today-mini-sep">·</span>
                    <span>🔥 <strong>{streak}</strong> dias seguidos</span>
                  </>
                )}
              </div>
            )}
          </div>

          {notes.length === 0 && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: 300, gap: 10,
            }}>
              <div style={{ fontSize: 32 }}>◈</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--tng-ink-2)' }}>
                Nenhum plano ainda
              </div>
              <div style={{ fontSize: 13, color: 'var(--tng-ink-3)', textAlign: 'center', maxWidth: 300, lineHeight: 1.6 }}>
                Quando a IA gerar um plano de ação durante o bootcamp, ele aparecerá aqui com checkboxes para acompanhar o progresso.
              </div>
            </div>
          )}

          {Object.entries(byEnrollment).map(([enrollmentId, enrollNotes]) => {
            const prog   = enrollmentMap[enrollmentId]
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
              <section key={enrollmentId} style={{ marginBottom: 40 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 16, paddingBottom: 10,
                  borderBottom: '1px solid var(--tng-rule)',
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--tng-purple-700)',
                    background: 'var(--tng-purple-100)', border: '1px solid var(--tng-purple-300)',
                    padding: '3px 10px', borderRadius: 999,
                    fontFamily: 'var(--tng-font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>
                    {prog.name}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--tng-ink-3)', fontFamily: 'var(--tng-font-mono)' }}>
                    {enrollNotes.length} plano{enrollNotes.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            <section style={{ marginBottom: 40 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 16, paddingBottom: 10,
                borderBottom: '1px solid var(--tng-rule)',
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--tng-ink-3)',
                  background: 'var(--tng-bone)', border: '1px solid var(--tng-rule)',
                  padding: '3px 10px', borderRadius: 999,
                  fontFamily: 'var(--tng-font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  Geral
                </span>
                <span style={{ fontSize: 11, color: 'var(--tng-ink-3)', fontFamily: 'var(--tng-font-mono)' }}>
                  {freeNotes.length} plano{freeNotes.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
