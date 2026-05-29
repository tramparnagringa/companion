import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { PlanCard } from '@/components/plans/plan-card'
import { getStreak } from '@/lib/days'
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
  program_enrollment_id: string | null
}

export default async function ProgramPlansPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [enrollment, notesRes, activitiesRes] = await Promise.all([
    getEnrollmentBySlug(user.id, slug, supabase),
    (supabase as any)
      .from('action_notes')
      .select('id, title, content, type, day_number, checklist, completed, created_at, program_enrollment_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('day_activities')
      .select('day_number, status, completed_at')
      .eq('user_id', user.id),
  ])

  if (!enrollment) redirect('/today')

  const notes  = (notesRes.data ?? []) as ActionNote[]
  const streak = getStreak(activitiesRes.data ?? [])

  const completedCount = notes.filter(n => {
    if (n.completed) return true
    const cl = n.checklist ?? []
    return cl.length > 0 && cl.every(i => i.done)
  }).length
  const activeCount = notes.length - completedCount

  // Group notes: those belonging to this enrollment, others separate
  const enrollmentNotes: ActionNote[] = []
  const otherNotes: ActionNote[] = []

  // Build a map of all enrollments the user has, to label other groups
  const enrollmentsRes = await supabase
    .from('user_programs')
    .select('id, program:programs(name, slug)')
    .eq('user_id', user.id)
    .eq('status', 'active')
  const enrollmentMap = Object.fromEntries(
    ((enrollmentsRes.data ?? []) as unknown as Array<{ id: string; program: { name: string; slug: string } }>)
      .map(e => [e.id, e.program])
  )

  const byOtherEnrollment: Record<string, ActionNote[]> = {}
  const freeNotes: ActionNote[] = []

  for (const note of notes) {
    if (note.program_enrollment_id === enrollment.id) {
      enrollmentNotes.push(note)
    } else if (note.program_enrollment_id && enrollmentMap[note.program_enrollment_id]) {
      if (!byOtherEnrollment[note.program_enrollment_id]) byOtherEnrollment[note.program_enrollment_id] = []
      byOtherEnrollment[note.program_enrollment_id].push(note)
    } else {
      freeNotes.push(note)
    }
  }

  const breadcrumb = (
    <div className="topbar-crumb">
      <strong>{enrollment.program.name}</strong>
      <span className="sep crumb-detail">/</span>
      <span className="crumb-detail">Planos de Ação</span>
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
              Planos de Ação
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

          {/* Notes from this program enrollment */}
          {enrollmentNotes.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 16, paddingBottom: 10,
                borderBottom: '0.5px solid var(--tng-rule)',
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--tng-purple-700)',
                  background: 'var(--tng-purple-100)', border: '0.5px solid var(--tng-purple-300)',
                  padding: '3px 10px', borderRadius: 999,
                  fontFamily: 'var(--tng-font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>
                  {enrollment.program.name}
                </span>
                <span style={{ fontSize: 11, color: 'var(--tng-ink-3)', fontFamily: 'var(--tng-font-mono)' }}>
                  {enrollmentNotes.length} plano{enrollmentNotes.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {enrollmentNotes.map(note => (
                  <PlanCard key={note.id} id={note.id} title={note.title} content={note.content}
                    type={note.type} dayNumber={note.day_number} checklist={note.checklist ?? []}
                    completed={note.completed} createdAt={note.created_at} />
                ))}
              </div>
            </section>
          )}

          {/* Notes from other program enrollments */}
          {Object.entries(byOtherEnrollment).map(([enrollmentId, enrollNotes]) => {
            const prog = enrollmentMap[enrollmentId]
            return (
              <section key={enrollmentId} style={{ marginBottom: 40 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  marginBottom: 16, paddingBottom: 10,
                  borderBottom: '0.5px solid var(--tng-rule)',
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--tng-ink-3)',
                    background: 'var(--tng-bone)', border: '0.5px solid var(--tng-rule)',
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
                  {enrollNotes.map(note => (
                    <PlanCard key={note.id} id={note.id} title={note.title} content={note.content}
                      type={note.type} dayNumber={note.day_number} checklist={note.checklist ?? []}
                      completed={note.completed} createdAt={note.created_at} />
                  ))}
                </div>
              </section>
            )
          })}

          {/* Free notes (no enrollment) */}
          {freeNotes.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 16, paddingBottom: 10,
                borderBottom: '0.5px solid var(--tng-rule)',
              }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--tng-ink-3)',
                  background: 'var(--tng-bone)', border: '0.5px solid var(--tng-rule)',
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
