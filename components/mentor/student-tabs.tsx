'use client'

import { useState } from 'react'
import { StudentChat } from './student-chat'

// ── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: string
  full_name: string | null
  role: string | null
  created_at: string | null
}

interface CandidateProfile {
  target_role: string | null
  seniority: string | null
  years_experience: number | null
  tech_stack: string[] | null
  work_preference: string | null
  target_regions: string[] | null
  value_proposition: string | null
  linkedin_headline: string | null
  linkedin_about: string | null
  ai_fluency_statements: string[] | null
}

interface DayActivity {
  day_number: number
  status: string | null
  outputs: unknown
  completed_at: string | null
  updated_at: string | null
  created_at: string | null
}

interface Job {
  id: string
  company_name: string
  role_title: string
  status: string | null
  fit_score: number | null
  apply_recommendation: boolean | null
  created_at: string | null
}

interface CvVersion {
  id: string
  name: string
  generated_by: string | null
  is_active: boolean | null
  created_at: string | null
}

interface TokenBalance {
  id: string
  tokens_total: number
  tokens_used: number
  product_type: string
  expires_at: string
  is_active: boolean | null
  created_at: string | null
}

interface TokenUsage {
  id: string
  tokens_consumed: number
  interaction_type: string
  created_at: string | null
}

interface StarStory {
  title: string
  situation: string
  task: string
  action: string
  result: string
  questions_covered?: string[]
}

interface InterviewPrep {
  star_stories: StarStory[] | null
  technical_gaps: string[] | null
  performance_map: unknown
}

interface MentorAction {
  id: string
  action: string
  metadata: unknown
  created_at: string | null
}

export interface Enrollment {
  id: string
  status: string
  started_at: string
  completed_at: string | null
  program: {
    id: string
    name: string
    slug: string
    total_days: number
    description: string | null
  }
}

export interface AvailableProgram {
  id: string
  name: string
  slug: string
  is_published?: boolean
}

export interface StudentData {
  profile: Profile
  candidate: CandidateProfile | null
  days: DayActivity[]
  jobs: Job[]
  cvVersions: CvVersion[]
  tokenBalances: TokenBalance[]
  tokenUsage: TokenUsage[]
  interviewPrep: InterviewPrep | null
  mentorActions: MentorAction[]
  enrollments: Enrollment[]
  availablePrograms: AvailableProgram[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
}

const STATUS_COLORS: Record<string, string> = {
  done:        'var(--green)',
  in_progress: 'var(--accent)',
  pending:     'var(--text4)',
  skipped:     'var(--text4)',
}

const JOB_STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  to_analyse:   { label: 'Analisar',     color: 'var(--text3)',  bg: 'var(--bg4)' },
  analysing:    { label: 'Analisando',   color: 'var(--accent)', bg: 'var(--accent-dim)' },
  applied:      { label: 'Candidatado',  color: 'var(--blue)',   bg: 'var(--blue-dim)' },
  interviewing: { label: 'Entrevista',   color: 'var(--purple)', bg: 'var(--purple-dim)' },
  offer:        { label: 'Oferta',       color: 'var(--green)',  bg: 'var(--green-dim)' },
  discarded:    { label: 'Descartado',   color: 'var(--text4)',  bg: 'var(--bg3)' },
}

function Chip({ label, color, bg }: { label: string | null; color: string; bg: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 500, padding: '2px 8px',
      borderRadius: 10, background: bg, color,
      textTransform: 'uppercase', letterSpacing: '.06em',
    }}>
      {label}
    </span>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '0.5px solid var(--border)',
      borderRadius: 'var(--r)', padding: '18px 20px', marginBottom: 16,
    }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text3)', marginBottom: 14,
        textTransform: 'uppercase', letterSpacing: '.08em' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

// ── Tab content components ───────────────────────────────────────────────────

function DashboardTab({ data }: { data: StudentData }) {
  const { profile, candidate, jobs, tokenBalances, enrollments } = data

  const applied      = jobs.filter(j => ['applied', 'interviewing', 'offer'].includes(j.status ?? '')).length
  const interviews   = jobs.filter(j => ['interviewing', 'offer'].includes(j.status ?? '')).length
  const responseRate = applied > 0 ? Math.round((interviews / applied) * 100) : 0
  const tokensTotal  = tokenBalances.filter(b => b.is_active).reduce((s, b) => s + b.tokens_total, 0)
  const tokensUsed   = tokenBalances.filter(b => b.is_active).reduce((s, b) => s + b.tokens_used,  0)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <Section title="Conta">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Acesso desde', value: fmt(profile.created_at) },
            { label: 'Tipo de acesso', value: profile.role },
            { label: 'Programas ativos', value: enrollments.filter(e => e.status === 'active').length },
            { label: 'Programas concluídos', value: enrollments.filter(e => e.status === 'completed').length },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--bg3)', borderRadius: 'var(--rsm)', padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: 'var(--text4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{value}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Candidaturas">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Total analisadas', value: jobs.length },
            { label: 'Candidaturas', value: applied },
            { label: 'Entrevistas', value: interviews },
            { label: 'Taxa de resposta', value: `${responseRate}%` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--bg3)', borderRadius: 'var(--rsm)', padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: 'var(--text4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{value}</div>
            </div>
          ))}
        </div>
      </Section>

      {candidate && (
        <Section title="Perfil candidato">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Cargo alvo', value: candidate.target_role },
              { label: 'Senioridade', value: candidate.seniority },
              { label: 'Anos de exp.', value: candidate.years_experience },
              { label: 'Preferência', value: candidate.work_preference },
              { label: 'Regiões alvo', value: candidate.target_regions?.join(', ') },
            ].filter(r => r.value).map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text3)' }}>{label}</span>
                <span style={{ color: 'var(--text)', maxWidth: '60%', textAlign: 'right' }}>{String(value)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Tokens">
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: 'var(--text3)' }}>Restantes</span>
            <span style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>
              {(tokensTotal - tokensUsed).toLocaleString()} / {tokensTotal.toLocaleString()}
            </span>
          </div>
          <div style={{ height: 5, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3,
              width: tokensTotal > 0 ? `${100 - Math.min((tokensUsed / tokensTotal) * 100, 100)}%` : '0%',
              background: 'var(--purple)',
            }} />
          </div>
        </div>
      </Section>
    </div>
  )
}

function ProgramasTab({ data, userId }: { data: StudentData; userId: string }) {
  const { enrollments, days, availablePrograms } = data

  const completedCount = days.filter(d => d.status === 'done').length

  const [selectedProgram, setSelectedProgram] = useState('')
  const [enrolling, setEnrolling]             = useState(false)
  const [enrollMessage, setEnrollMessage]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [localEnrollments, setLocalEnrollments] = useState(enrollments)
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'cancel' | 'pause' } | null>(null)
  const [busy, setBusy]                   = useState<Set<string>>(new Set())

  async function handleStatusChange(enrollmentId: string, action: 'cancel' | 'pause') {
    setBusy(prev => new Set(prev).add(enrollmentId))
    setConfirmAction(null)
    try {
      const res = await fetch('/api/mentor/enroll', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_id: enrollmentId, user_id: userId, action }),
      })
      if (res.ok) {
        const newStatus = action === 'pause' ? 'paused' : 'cancelled'
        setLocalEnrollments(prev =>
          prev.map(e => e.id === enrollmentId ? { ...e, status: newStatus } : e)
        )
      }
    } catch {
      // silently fail — user can reload
    } finally {
      setBusy(prev => { const s = new Set(prev); s.delete(enrollmentId); return s })
    }
  }

  const activeIds = new Set(localEnrollments.filter(e => e.status === 'active').map(e => e.program.id))
  const unenrolled = (availablePrograms ?? []).filter(p => !activeIds.has(p.id))

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 'var(--rsm)',
    background: 'var(--bg3)', border: '0.5px solid var(--border2)',
    color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: 'var(--text3)', marginBottom: 4,
    textTransform: 'uppercase', letterSpacing: '.06em', display: 'block',
  }

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProgram) return
    setEnrolling(true)
    setEnrollMessage(null)
    try {
      const res = await fetch('/api/mentor/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: userId, program_id: selectedProgram }),
      })
      if (res.ok) {
        const body = await res.json()
        setEnrollMessage({ type: 'ok', text: `Inscrito em "${body.program_name}" com sucesso.` })
        const prog = availablePrograms.find(p => p.id === selectedProgram)
        if (prog) {
          setLocalEnrollments(prev => [...prev, {
            id: crypto.randomUUID(),
            status: 'active',
            started_at: new Date().toISOString(),
            completed_at: null,
            program: { id: prog.id, name: prog.name, slug: prog.slug, total_days: 30, description: null },
          }])
        }
        setSelectedProgram('')
      } else {
        const body = await res.json()
        const msgs: Record<string, string> = {
          already_enrolled: 'Aluno já está inscrito neste programa.',
          program_not_found: 'Programa não encontrado.',
          program_not_found_or_unpublished: 'Programa não encontrado.',
        }
        setEnrollMessage({ type: 'err', text: msgs[body.error] ?? body.error ?? 'Erro ao inscrever.' })
      }
    } catch {
      setEnrollMessage({ type: 'err', text: 'Erro de rede.' })
    } finally {
      setEnrolling(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Enroll form */}
      {unenrolled.length > 0 && (
        <div style={{
          background: 'var(--bg2)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--r)', padding: '16px 20px',
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
            Inscrever em programa
          </div>
          <form onSubmit={handleEnroll} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Programa</label>
              <select
                required
                value={selectedProgram}
                onChange={e => setSelectedProgram(e.target.value)}
                style={inputStyle}
              >
                <option value="">Selecionar...</option>
                {unenrolled.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.is_published === false ? ' (rascunho)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit" disabled={enrolling || !selectedProgram}
              style={{
                padding: '8px 16px', borderRadius: 'var(--rsm)', whiteSpace: 'nowrap',
                background: enrolling || !selectedProgram ? 'var(--bg4)' : 'var(--accent-dim)',
                color: enrolling || !selectedProgram ? 'var(--text4)' : 'var(--accent)',
                border: `0.5px solid ${enrolling || !selectedProgram ? 'var(--border)' : 'var(--accent)'}`,
                fontSize: 13, fontWeight: 500, cursor: enrolling || !selectedProgram ? 'not-allowed' : 'pointer',
              }}
            >
              {enrolling ? 'Inscrevendo...' : 'Inscrever'}
            </button>
          </form>
          {enrollMessage && (
            <div style={{
              marginTop: 10, padding: '8px 12px', borderRadius: 'var(--rsm)', fontSize: 13,
              background: enrollMessage.type === 'ok' ? 'var(--green-dim)' : 'var(--red-dim)',
              color: enrollMessage.type === 'ok' ? 'var(--green)' : 'var(--red)',
              border: `0.5px solid ${enrollMessage.type === 'ok' ? 'var(--green)' : 'var(--red)'}`,
            }}>
              {enrollMessage.text}
            </div>
          )}
        </div>
      )}

      {localEnrollments.length === 0 && (
        <div style={{
          background: 'var(--bg2)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--r)', padding: '18px 20px',
        }}>
          <p style={{ fontSize: 13, color: 'var(--text4)', margin: 0 }}>Nenhum programa encontrado.</p>
        </div>
      )}

      {localEnrollments.map(e => {
        const totalDays   = e.program.total_days
        // day_activities are not yet tied per-program — use global count as approximation
        const done        = Math.min(completedCount, totalDays)
        const pct         = totalDays > 0 ? Math.round((done / totalDays) * 100) : 0
        const isCompleted = e.status === 'completed'
        const isCancelled = e.status === 'cancelled'
        const isPaused    = e.status === 'paused'
        const isActive    = e.status === 'active'
        const isBusy      = busy.has(e.id)

        return (
          <div key={e.id} style={{
            background: 'var(--bg2)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--r)', padding: '18px 20px',
            opacity: isCancelled ? 0.6 : 1,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                  {e.program.name}
                </div>
                {e.program.description && (
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{e.program.description}</div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Chip
                  label={isCancelled ? 'Cancelado' : isCompleted ? 'Concluído' : isPaused ? 'Pausado' : 'Ativo'}
                  color={isCancelled ? 'var(--red)' : isCompleted ? 'var(--green)' : isPaused ? 'var(--orange)' : 'var(--accent)'}
                  bg={isCancelled ? 'var(--red-dim)' : isCompleted ? 'var(--green-dim)' : isPaused ? 'var(--orange-dim)' : 'var(--accent-dim)'}
                />
                {isActive && !isBusy && confirmAction?.id !== e.id && (
                  <>
                    <button
                      onClick={() => setConfirmAction({ id: e.id, action: 'pause' })}
                      style={{
                        padding: '3px 8px', borderRadius: 'var(--rsm)', fontSize: 11,
                        background: 'transparent', color: 'var(--text4)',
                        border: '0.5px solid var(--border2)', cursor: 'pointer',
                      }}
                    >
                      Pausar
                    </button>
                    <button
                      onClick={() => setConfirmAction({ id: e.id, action: 'cancel' })}
                      style={{
                        padding: '3px 8px', borderRadius: 'var(--rsm)', fontSize: 11,
                        background: 'transparent', color: 'var(--red)',
                        border: '0.5px solid var(--red)', cursor: 'pointer',
                      }}
                    >
                      Cancelar
                    </button>
                  </>
                )}
                {isActive && confirmAction?.id === e.id && (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {confirmAction.action === 'pause' ? 'Pausar programa?' : 'Cancelar acesso?'}
                    </span>
                    <button
                      onClick={() => handleStatusChange(e.id, confirmAction.action)}
                      style={{
                        padding: '3px 8px', borderRadius: 'var(--rsm)', fontSize: 11,
                        background: confirmAction.action === 'pause' ? 'var(--orange-dim)' : 'var(--red-dim)',
                        color: confirmAction.action === 'pause' ? 'var(--orange)' : 'var(--red)',
                        border: `0.5px solid ${confirmAction.action === 'pause' ? 'var(--orange)' : 'var(--red)'}`,
                        cursor: 'pointer',
                      }}
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setConfirmAction(null)}
                      style={{
                        padding: '3px 8px', borderRadius: 'var(--rsm)', fontSize: 11,
                        background: 'transparent', color: 'var(--text4)',
                        border: '0.5px solid var(--border2)', cursor: 'pointer',
                      }}
                    >
                      Não
                    </button>
                  </div>
                )}
                {isBusy && (
                  <span style={{ fontSize: 11, color: 'var(--text4)' }}>Salvando...</span>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 14, fontSize: 12 }}>
              <div>
                <span style={{ color: 'var(--text4)' }}>Início: </span>
                <span style={{ color: 'var(--text2)' }}>{fmt(e.started_at)}</span>
              </div>
              {e.completed_at && (
                <div>
                  <span style={{ color: 'var(--text4)' }}>Conclusão: </span>
                  <span style={{ color: 'var(--text2)' }}>{fmt(e.completed_at)}</span>
                </div>
              )}
              <div>
                <span style={{ color: 'var(--text4)' }}>Duração: </span>
                <span style={{ color: 'var(--text2)' }}>{totalDays} dias</span>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>
                <span>{done} de {totalDays} dias concluídos</span>
                <span style={{ fontFamily: 'var(--mono)' }}>{pct}%</span>
              </div>
              <div style={{ height: 5, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${pct}%`,
                  background: isCompleted ? 'var(--green)' : 'var(--accent)',
                  transition: 'width .4s',
                }} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ProgressoTab({ data }: { data: StudentData }) {
  const { days, enrollments } = data

  // ── Build date → activity count map ──────────────────────────────────────
  const activityByDate: Record<string, number> = {}
  for (const d of days) {
    if (d.status === 'pending') continue
    // Use completed_at if available, otherwise updated_at, otherwise created_at
    const ts = d.completed_at ?? d.updated_at ?? d.created_at
    if (!ts) continue
    const date = ts.slice(0, 10) // YYYY-MM-DD
    activityByDate[date] = (activityByDate[date] ?? 0) + 1
  }

  // ── Build 16-week calendar grid ───────────────────────────────────────────
  const today     = new Date()
  today.setHours(0, 0, 0, 0)
  // Start on Sunday 16 weeks ago
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - today.getDay() - 16 * 7)

  const weeks: Date[][] = []
  const cursor = new Date(startDate)
  while (cursor <= today) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }

  const DAYS_PT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  function cellColor(count: number) {
    if (count === 0) return { bg: 'var(--bg3)', border: 'var(--border)' }
    if (count === 1) return { bg: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.3)' }
    return { bg: 'var(--green-dim)', border: 'var(--green)' }
  }

  // ── Earliest enrollment date for reference ────────────────────────────────
  const enrolledSince = enrollments.length > 0
    ? enrollments.reduce((min, e) => e.started_at < min ? e.started_at : min, enrollments[0].started_at)
    : null

  return (
    <div>
      <Section title="Atividade">
        {enrolledSince && (
          <div style={{ fontSize: 12, color: 'var(--text4)', marginBottom: 12 }}>
            Inscrito desde {fmt(enrolledSince)}
          </div>
        )}

        {/* Month labels */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 4, paddingLeft: 18 }}>
          {weeks.map((week, wi) => {
            const firstDay = week[0]
            const showMonth = firstDay.getDate() <= 7 || wi === 0
            return (
              <div key={wi} style={{ width: 14, fontSize: 9, color: 'var(--text4)', textAlign: 'center', flexShrink: 0 }}>
                {showMonth ? firstDay.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') : ''}
              </div>
            )
          })}
        </div>

        {/* Grid: rows = day of week, cols = weeks */}
        <div style={{ display: 'flex', gap: 3 }}>
          {/* Day labels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginRight: 2 }}>
            {DAYS_PT.map((label, i) => (
              <div key={i} style={{ width: 12, height: 14, fontSize: 9, color: 'var(--text4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {i % 2 === 1 ? label : ''}
              </div>
            ))}
          </div>

          {weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {week.map((day, di) => {
                const dateStr = day.toISOString().slice(0, 10)
                const count   = activityByDate[dateStr] ?? 0
                const isFuture = day > today
                const { bg, border } = cellColor(count)
                const label = day.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                return (
                  <div
                    key={di}
                    title={isFuture ? '' : `${label}${count > 0 ? ` — ${count} atividade${count > 1 ? 's' : ''}` : ''}`}
                    style={{
                      width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                      background: isFuture ? 'transparent' : bg,
                      border: isFuture ? 'none' : `0.5px solid ${border}`,
                    }}
                  />
                )
              })}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
          <span style={{ fontSize: 10, color: 'var(--text4)' }}>Menos</span>
          {[0, 1, 2].map(level => {
            const { bg, border } = cellColor(level)
            return <div key={level} style={{ width: 14, height: 14, borderRadius: 3, background: bg, border: `0.5px solid ${border}` }} />
          })}
          <span style={{ fontSize: 10, color: 'var(--text4)' }}>Mais</span>
        </div>
      </Section>

      <Section title="Histórico por dia">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {days.filter(d => d.status !== 'pending').length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text4)', margin: 0 }}>Nenhuma atividade registrada.</p>
          )}
          {[...days]
            .filter(d => d.status !== 'pending')
            .sort((a, b) => a.day_number - b.day_number)
            .map(d => (
              <div key={`day-${d.day_number}`} style={{
                padding: '10px 12px', background: 'var(--bg3)',
                borderRadius: 'var(--rsm)', border: '0.5px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ width: 28, fontSize: 12, fontWeight: 500, color: STATUS_COLORS[d.status ?? 'pending'] ?? 'var(--text4)' }}>
                  D{d.day_number}
                </div>
                <Chip
                  label={d.status ?? 'pending'}
                  color={STATUS_COLORS[d.status ?? 'pending'] ?? 'var(--text4)'}
                  bg={d.status === 'done' ? 'var(--green-dim)' : d.status === 'in_progress' ? 'var(--accent-dim)' : 'var(--bg4)'}
                />
                {d.completed_at && (
                  <span style={{ fontSize: 11, color: 'var(--text4)' }}>
                    Concluído em {fmt(d.completed_at)}
                  </span>
                )}
              </div>
            ))}
        </div>
      </Section>
    </div>
  )
}

function PerfilTab({ data }: { data: StudentData }) {
  const { candidate, interviewPrep, cvVersions } = data

  return (
    <div>
      {!candidate ? (
        <Section title="Perfil">
          <p style={{ fontSize: 13, color: 'var(--text4)', margin: 0 }}>Dossier ainda não criado.</p>
        </Section>
      ) : (
        <>
          {candidate.value_proposition && (
            <Section title="Proposta de valor">
              <p style={{ fontSize: 14, color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>
                {candidate.value_proposition}
              </p>
            </Section>
          )}

          {candidate.tech_stack && candidate.tech_stack.length > 0 && (
            <Section title="Stack técnica">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {candidate.tech_stack.map(t => (
                  <span key={t} style={{
                    fontSize: 12, padding: '3px 10px', borderRadius: 10,
                    background: 'var(--bg3)', border: '0.5px solid var(--border)',
                    color: 'var(--text2)',
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {(candidate.linkedin_headline || candidate.linkedin_about) && (
            <Section title="LinkedIn">
              {candidate.linkedin_headline && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Headline</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', fontStyle: 'italic' }}>{candidate.linkedin_headline}</div>
                </div>
              )}
              {candidate.linkedin_about && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text4)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>About</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{candidate.linkedin_about}</div>
                </div>
              )}
            </Section>
          )}
        </>
      )}

      {interviewPrep?.star_stories && interviewPrep.star_stories.length > 0 && (
        <Section title="STAR Stories">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {interviewPrep.star_stories.map((story, i) => (
              <div key={story.title || `story-${i}`} style={{
                padding: '12px 14px', background: 'var(--bg3)',
                borderRadius: 'var(--rsm)', border: '0.5px solid var(--border)',
              }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>{story.title}</div>
                {(['situation', 'task', 'action', 'result'] as const).map(k => (
                  <div key={k} style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '.06em', marginRight: 6 }}>{k}</span>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>{story[k]}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title={`CV — ${cvVersions.length} versão(ões)`}>
        {cvVersions.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text4)', margin: 0 }}>Nenhum CV salvo.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {cvVersions.map(v => (
              <div key={v.id} style={{
                padding: '12px 14px', background: 'var(--bg3)',
                borderRadius: 'var(--rsm)', border: '0.5px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{v.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 2 }}>
                    {fmt(v.created_at)} · {v.generated_by === 'ai' ? 'Gerado por IA' : 'Manual'}
                  </div>
                </div>
                {v.is_active && <Chip label="Ativo" color="var(--green)" bg="var(--green-dim)" />}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

function BoardTab({ data }: { data: StudentData }) {
  const { jobs } = data
  const columns = ['to_analyse', 'analysing', 'applied', 'interviewing', 'offer', 'discarded'] as const

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
      {columns.map(col => {
        const colJobs = jobs.filter(j => j.status === col)
        const s = JOB_STATUS_LABELS[col]
        return (
          <div key={col} style={{
            background: 'var(--bg2)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--r)', padding: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                background: s.bg, color: s.color,
                textTransform: 'uppercase', letterSpacing: '.06em',
              }}>
                {s.label}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text4)' }}>{colJobs.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {colJobs.map(j => (
                <div key={j.id} style={{
                  padding: '9px 11px', background: 'var(--bg3)',
                  borderRadius: 'var(--rsm)', border: '0.5px solid var(--border)',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{j.role_title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{j.company_name}</div>
                  {j.fit_score !== null && (
                    <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 4 }}>Fit: {j.fit_score}%</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TokensTab({ data }: { data: StudentData }) {
  const { tokenBalances, tokenUsage } = data
  const active = tokenBalances.filter(b => b.is_active && new Date(b.expires_at) > new Date())

  return (
    <div>
      <Section title="Saldos ativos">
        {active.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text4)', margin: 0 }}>Sem saldo ativo.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {active.map(b => {
              const pct = b.tokens_total > 0 ? Math.min((b.tokens_used / b.tokens_total) * 100, 100) : 0
              return (
                <div key={b.id} style={{
                  padding: '12px 14px', background: 'var(--bg3)',
                  borderRadius: 'var(--rsm)', border: '0.5px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{b.product_type}</span>
                    <span style={{ fontSize: 11, color: 'var(--text4)' }}>expira {fmt(b.expires_at)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', marginBottom: 6, fontFamily: 'var(--mono)' }}>
                    <span>{(b.tokens_total - b.tokens_used).toLocaleString()} restantes</span>
                    <span>{b.tokens_total.toLocaleString()} total</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2, width: `${100 - pct}%`,
                      background: pct > 90 ? 'var(--red)' : pct > 70 ? 'var(--orange)' : 'var(--purple)',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      <Section title="Histórico de uso (últimas 50 interações)">
        {tokenUsage.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text4)', margin: 0 }}>Sem histórico.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {tokenUsage.map(u => (
              <div key={u.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '7px 10px', background: 'var(--bg3)',
                borderRadius: 'var(--rsm)', fontSize: 12,
              }}>
                <span style={{ color: 'var(--text3)' }}>{u.interaction_type}</span>
                <span style={{ color: 'var(--purple)', fontFamily: 'var(--mono)' }}>
                  -{u.tokens_consumed.toLocaleString()}
                </span>
                <span style={{ color: 'var(--text4)' }}>{fmt(u.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

function AcoesTab({ data, userId }: { data: StudentData; userId: string }) {
  const { mentorActions } = data
  const [tokens, setTokens]         = useState('')
  const [days, setDays]             = useState('365')
  const [reason, setReason]         = useState('')
  const [productType, setProductType] = useState('manual_grant')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage]       = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function handleGrantTokens(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      const res = await fetch('/api/mentor/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_user_id: userId,
          tokens: parseInt(tokens),
          validity_days: parseInt(days),
          reason,
          product_type: productType,
        }),
      })
      if (res.ok) {
        setMessage({ type: 'ok', text: `${parseInt(tokens).toLocaleString()} tokens concedidos com sucesso.` })
        setTokens('')
        setReason('')
      } else {
        const body = await res.json()
        setMessage({ type: 'err', text: body.error ?? 'Erro ao conceder tokens.' })
      }
    } catch {
      setMessage({ type: 'err', text: 'Erro de rede.' })
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 'var(--rsm)',
    background: 'var(--bg3)', border: '0.5px solid var(--border2)',
    color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: 'var(--text3)', marginBottom: 4,
    textTransform: 'uppercase', letterSpacing: '.06em', display: 'block',
  }

  return (
    <div>
      <Section title="Conceder tokens">
        <form onSubmit={handleGrantTokens} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Quantidade de tokens</label>
              <input
                type="number" min="1" required
                value={tokens} onChange={e => setTokens(e.target.value)}
                placeholder="ex: 500000"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Validade (dias)</label>
              <input
                type="number" min="1" required
                value={days} onChange={e => setDays(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Tipo de produto</label>
            <select value={productType} onChange={e => setProductType(e.target.value)} style={inputStyle}>
              <option value="manual_grant">Manual grant</option>
              <option value="bootcamp">Bootcamp</option>
              <option value="mentoria">Mentoria</option>
              <option value="pack_starter">Pack starter</option>
              <option value="pack_pro">Pack pro</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Motivo (opcional)</label>
            <input
              type="text"
              value={reason} onChange={e => setReason(e.target.value)}
              placeholder="ex: reposição por bug"
              style={inputStyle}
            />
          </div>

          {message && (
            <div style={{
              padding: '9px 12px', borderRadius: 'var(--rsm)', fontSize: 13,
              background: message.type === 'ok' ? 'var(--green-dim)' : 'var(--red-dim)',
              color: message.type === 'ok' ? 'var(--green)' : 'var(--red)',
              border: `0.5px solid ${message.type === 'ok' ? 'var(--green)' : 'var(--red)'}`,
            }}>
              {message.text}
            </div>
          )}

          <button
            type="submit" disabled={submitting || !tokens}
            style={{
              padding: '9px 18px', borderRadius: 'var(--rsm)',
              background: submitting || !tokens ? 'var(--bg4)' : 'var(--purple-dim)',
              color: submitting || !tokens ? 'var(--text4)' : 'var(--purple)',
              border: `0.5px solid ${submitting || !tokens ? 'var(--border)' : 'var(--purple)'}`,
              fontSize: 13, fontWeight: 500, cursor: submitting || !tokens ? 'not-allowed' : 'pointer',
              alignSelf: 'flex-start',
            }}
          >
            {submitting ? 'Concedendo...' : 'Conceder tokens'}
          </button>
        </form>
      </Section>

      <Section title="Histórico de ações">
        {mentorActions.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text4)', margin: 0 }}>Nenhuma ação registrada.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {mentorActions.map(a => (
              <div key={a.id} style={{
                padding: '9px 12px', background: 'var(--bg3)',
                borderRadius: 'var(--rsm)', border: '0.5px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{a.action}</span>
                  {a.metadata != null && (
                    <span style={{ fontSize: 11, color: 'var(--text4)', marginLeft: 8 }}>
                      {JSON.stringify(a.metadata)}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 11, color: 'var(--text4)' }}>
                  {fmt(a.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

// ── Main tabs component ──────────────────────────────────────────────────────

const TABS = [
  { id: 'dashboard',  label: 'Dashboard' },
  { id: 'programas',  label: 'Programas' },
  { id: 'progresso',  label: 'Progresso' },
  { id: 'perfil',     label: 'Perfil' },
  { id: 'board',      label: 'Board' },
  { id: 'tokens',     label: 'Tokens' },
  { id: 'acoes',      label: 'Ações' },
] as const

type TabId = typeof TABS[number]['id']

export function StudentTabs({
  data,
  userId,
  backHref = '/mentor/students',
}: {
  data: StudentData
  userId: string
  backHref?: string
}) {
  const [tab, setTab]         = useState<TabId>('dashboard')
  const [chatOpen, setChatOpen] = useState(false)
  const { profile } = data

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: 'var(--bg)' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: 'var(--text4)', marginBottom: 4 }}>
            <a href={backHref} style={{ color: 'var(--text4)', textDecoration: 'none' }}>Alunos</a>
            {' / '}
            <span style={{ color: 'var(--text3)' }}>{profile.full_name ?? userId.slice(0, 8)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              {profile.full_name ?? 'Sem nome'}
            </h1>
            <span style={{
              fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 10,
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
              textTransform: 'uppercase', letterSpacing: '.06em',
            }}>
              {profile.role}
            </span>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2, marginBottom: 20,
          borderBottom: '0.5px solid var(--border)',
        }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '8px 14px', fontSize: 13, border: 'none', cursor: 'pointer',
                background: 'none', borderRadius: 'var(--rsm) var(--rsm) 0 0',
                color: tab === t.id ? 'var(--text)' : 'var(--text3)',
                fontWeight: tab === t.id ? 500 : 400,
                borderBottom: tab === t.id ? '2px solid var(--purple)' : '2px solid transparent',
                transition: 'all .12s',
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}

          {/* IA button — separate from tabs */}
          <button
            onClick={() => setChatOpen(true)}
            style={{
              marginLeft: 'auto', marginBottom: -1,
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 'var(--rsm)',
              background: chatOpen ? 'var(--purple-dim)' : 'none',
              border: `0.5px solid ${chatOpen ? 'rgba(167,139,250,.3)' : 'var(--border2)'}`,
              color: chatOpen ? 'var(--purple)' : 'var(--text3)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              transition: 'all .12s',
            }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13 }}>
              <path d="M2 3h12v8H9l-3 3V11H2z" />
            </svg>
            Perguntar à IA
          </button>
        </div>

        {/* Tab content */}
        {tab === 'dashboard' && <DashboardTab data={data} />}
        {tab === 'programas' && <ProgramasTab data={data} userId={userId} />}
        {tab === 'progresso' && <ProgressoTab data={data} />}
        {tab === 'perfil'    && <PerfilTab    data={data} />}
        {tab === 'board'     && <BoardTab     data={data} />}
        {tab === 'tokens'    && <TokensTab    data={data} />}
        {tab === 'acoes'     && <AcoesTab     data={data} userId={userId} />}
      </div>

      {/* IA side panel */}
      {chatOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', justifyContent: 'flex-end',
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setChatOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }}
          />

          {/* Panel */}
          <div style={{
            position: 'relative', zIndex: 1,
            width: 'min(480px, 100vw)',
            height: '100%',
            background: 'var(--bg)',
            borderLeft: '0.5px solid var(--border)',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Panel header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '0.5px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
            }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                style={{ width: 14, height: 14, color: 'var(--purple)' }}>
                <path d="M2 3h12v8H9l-3 3V11H2z" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1 }}>
                Perguntar sobre {profile.full_name ?? 'este aluno'}
              </span>
              <button
                onClick={() => setChatOpen(false)}
                style={{
                  width: 28, height: 28, borderRadius: 'var(--rsm)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="2" y1="2" x2="12" y2="12" /><line x1="12" y1="2" x2="2" y2="12" />
                </svg>
              </button>
            </div>

            {/* Chat */}
            <div style={{ flex: 1, overflow: 'hidden', padding: '16px 18px', display: 'flex', flexDirection: 'column' }}>
              <StudentChat userId={userId} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
