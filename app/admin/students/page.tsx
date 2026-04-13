import { createServiceClient } from '@/lib/supabase/service'
import { StudentsTable } from '@/components/mentor/students-table'

async function getStudents() {
  const supabase = createServiceClient()

  const [profilesRes, activitiesRes, balancesRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, role, created_at')
      .in('role', ['bootcamp', 'mentoria', 'mentor', 'admin'])
      .order('created_at', { ascending: false }),
    supabase.from('day_activities').select('user_id, day_number, status, updated_at'),
    supabase.from('token_balance').select('user_id, tokens_total, tokens_used, is_active, expires_at'),
  ])

  const profiles   = profilesRes.data ?? []
  const activities = activitiesRes.data ?? []
  const balances   = balancesRes.data ?? []

  return profiles.map(p => {
    const userActs      = activities.filter(a => a.user_id === p.id)
    const completed     = userActs.filter(a => a.status === 'done')
    const completedNums = completed.map(a => a.day_number)
    const allDays       = userActs.map(a => a.day_number).sort((a, b) => a - b)
    const currentDay    = allDays.find(d => !completedNums.includes(d)) ?? (completedNums.length + 1)
    const lastAct       = [...userActs].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )[0]

    const userBals    = balances.filter(
      b => b.user_id === p.id && b.is_active && new Date(b.expires_at) > new Date()
    )
    const tokensTotal = userBals.reduce((s, b) => s + b.tokens_total, 0)
    const tokensUsed  = userBals.reduce((s, b) => s + b.tokens_used, 0)

    return {
      id: p.id,
      full_name: p.full_name,
      role: p.role,
      currentDay,
      completedCount: completed.length,
      lastActivity: lastAct?.updated_at ?? null,
      tokensTotal,
      tokensUsed,
    }
  })
}

export default async function AdminStudentsPage() {
  const students = await getStudents()

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: 'var(--bg)' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Alunos</h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', margin: '4px 0 0' }}>
          {students.length} aluno{students.length !== 1 ? 's' : ''} cadastrado{students.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div style={{
        background: 'var(--bg2)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--r)', overflow: 'hidden',
      }}>
        <div className="students-table-desktop" style={{
          display: 'grid',
          gridTemplateColumns: '2fr 100px 140px 100px',
          padding: '10px 16px',
          borderBottom: '0.5px solid var(--border)',
          fontSize: 11, color: 'var(--text4)',
          textTransform: 'uppercase', letterSpacing: '.08em',
        }}>
          <span>Aluno</span>
          <span>Plano</span>
          <span>Tokens</span>
          <span>Última atividade</span>
        </div>

        <StudentsTable students={students} basePath="/admin/students" />
      </div>
    </div>
  )
}
