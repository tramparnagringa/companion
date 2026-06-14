'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { StudentChat } from './student-chat'
import { ICICard, type ICIScores } from '@/components/ici-card'

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
  ici_scores?: ICIScores | null
  conversation_context?: string | null
}

interface ChatSession {
  id: string
  title: string | null
  mode: string | null
  messages: Array<{ role: string; content: string }>
  summary: string | null
  context_snapshot: string | null
  summarized_at: string | null
  created_at: string | null
  updated_at: string | null
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
  is_published?: boolean | null
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
  chatSessions: ChatSession[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
}

function timeAgo(iso: string | null) {
  if (!iso) return 'nunca'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 2) return 'agora'
  if (m < 60) return `${m}min atrás`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
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
      fontSize: 11, fontWeight: 500, padding: '3px 9px',
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
      borderRadius: 'var(--r)', padding: '24px 26px', marginBottom: 16,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)', marginBottom: 20,
        textTransform: 'uppercase', letterSpacing: '.1em' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

// ── ResumoTab (epicenter) ────────────────────────────────────────────────────

function ResumoTab({ data, userId }: { data: StudentData; userId: string }) {
  const { candidate, days, tokenBalances, tokenUsage, enrollments, chatSessions } = data
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)

  async function handleRefreshContext() {
    setRefreshing(true)
    setRefreshError(null)
    try {
      const res = await fetch(`/api/admin/students/${userId}/summarize`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setRefreshError(body.error ?? `Erro ${res.status}`)
        return
      }
      const data = await res.json()
      if (data.sessionsProcessed === 0) {
        setRefreshError('Nenhuma sessão nova para processar.')
        return
      }
      router.refresh()
    } catch {
      setRefreshError('Falha ao conectar. Tente novamente.')
    } finally {
      setRefreshing(false)
    }
  }

  const CREDIT_RATIO = 1000

  const completedDays  = days.filter(d => d.status === 'done').length
  const currentDay     = completedDays + 1
  const activeTokens   = tokenBalances.filter(b => b.is_active && new Date(b.expires_at) > new Date())
  const tokensTotal    = activeTokens.reduce((s, b) => s + b.tokens_total, 0)
  const tokensUsed     = activeTokens.reduce((s, b) => s + b.tokens_used, 0)
  const tokenPct       = tokensTotal > 0 ? Math.min((tokensUsed / tokensTotal) * 100, 100) : 0
  const creditsTotal   = Math.floor(tokensTotal / CREDIT_RATIO)
  const creditsUsed    = Math.floor(tokensUsed / CREDIT_RATIO)
  const creditsLeft    = creditsTotal - creditsUsed

  // Top consumption by interaction type
  const byType: Record<string, number> = {}
  for (const u of tokenUsage) {
    byType[u.interaction_type] = (byType[u.interaction_type] ?? 0) + u.tokens_consumed
  }
  const topTypes = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
  const totalConsumed = Object.values(byType).reduce((s, v) => s + v, 0) || 1

  const mainEnrollment = enrollments.find(e => e.status === 'active') ?? enrollments[0]
  const totalDays      = mainEnrollment?.program.total_days ?? 30
  const programName    = mainEnrollment?.program.name ?? null
  const progressPct    = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

  const lastActivity = [...days]
    .sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))
    [0]?.updated_at ?? null

  const lastSession = chatSessions[0] ?? null
  const lastMsg     = lastSession?.messages?.slice(-1)[0] ?? null

  const TYPE_LABELS: Record<string, string> = {
    chat:         'Chat',
    mentor:       'Mentor',
    cv_rewrite:   'Reescrita CV',
    day_init:     'Início de dia',
    day_activity: 'Atividade',
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

      {/* Row 1: ICI mini + Créditos */}
      {candidate?.ici_scores
        ? <ICICard scores={candidate.ici_scores} mini />
        : <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 'var(--r)', padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text4)' }}>ICI não calculado</span>
          </div>
      }

      {/* Créditos */}
      <div style={{
        background: 'var(--bg2)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--r)', padding: '20px 22px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14 }}>
          Créditos
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', lineHeight: 1, fontFamily: 'var(--mono)' }}>
            {creditsLeft.toLocaleString()}
          </span>
          <span style={{ fontSize: 14, color: 'var(--text4)' }}>restantes</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text4)', marginBottom: 8 }}>
          <span>{creditsUsed.toLocaleString()} usados</span>
          <span>{creditsTotal.toLocaleString()} total</span>
        </div>
        <div style={{ height: 3, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{
            height: '100%', borderRadius: 2, width: `${100 - tokenPct}%`,
            background: tokenPct > 90 ? 'var(--red)' : tokenPct > 70 ? 'var(--orange)' : 'var(--purple)',
          }} />
        </div>

        {/* Consumption by type */}
        {topTypes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {topTypes.map(([type, tokens]) => {
              const pct   = Math.round((tokens / totalConsumed) * 100)
              const label = TYPE_LABELS[type] ?? type
              return (
                <div key={type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                    <span style={{ color: 'var(--text3)' }}>{label}</span>
                    <span style={{ color: 'var(--text4)', fontFamily: 'var(--mono)' }}>
                      {Math.floor(tokens / CREDIT_RATIO).toLocaleString()} cr · {pct}%
                    </span>
                  </div>
                  <div style={{ height: 2, background: 'var(--bg4)', borderRadius: 1, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--purple)', borderRadius: 1 }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Row 2: Contexto IA — full width */}
      <div style={{
        gridColumn: '1 / -1',
        background: 'var(--bg2)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--r)', padding: '20px 22px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.1em', flex: 1 }}>
            Contexto IA
          </div>
          <button
            onClick={handleRefreshContext}
            disabled={refreshing}
            style={{
              padding: '5px 12px', borderRadius: 'var(--rsm)', fontSize: 12,
              background: 'none', border: '0.5px solid var(--border2)',
              color: refreshing ? 'var(--text4)' : 'var(--text3)',
              cursor: refreshing ? 'not-allowed' : 'pointer',
            }}
          >
            {refreshing ? 'Atualizando...' : 'Atualizar contexto'}
          </button>
        </div>
        {refreshError && (
          <p style={{ fontSize: 13, color: 'var(--orange)', margin: '0 0 12px' }}>
            {refreshError}
          </p>
        )}
        {candidate?.conversation_context ? (
          <div className="md-context" style={{ maxHeight: 420, overflowY: 'auto', paddingRight: 6 }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {candidate.conversation_context}
            </ReactMarkdown>
          </div>
        ) : (
          <p style={{ fontSize: 14, color: 'var(--text4)', margin: 0 }}>
            Nenhuma conversa registrada ainda.
          </p>
        )}
      </div>

      {/* Row 3: Entregáveis (VP + Headline) — full width */}
      {(candidate?.value_proposition || candidate?.linkedin_headline) && (
        <div style={{
          gridColumn: '1 / -1',
          background: 'var(--bg2)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--r)', padding: '20px 22px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 16 }}>
            Entregáveis
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {candidate?.value_proposition && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Proposta de valor</div>
                <div style={{ fontSize: 15, color: 'var(--text)', lineHeight: 1.6 }}>{candidate.value_proposition}</div>
              </div>
            )}
            {candidate?.linkedin_headline && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>Headline LinkedIn</div>
                <div style={{ fontSize: 15, color: 'var(--text)', fontStyle: 'italic' }}>{candidate.linkedin_headline}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Row 4: Progresso — full width */}
      <div style={{
        gridColumn: '1 / -1',
        background: 'var(--bg2)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--r)', padding: '20px 22px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>
          Progresso
        </div>
        {programName && (
          <div style={{ fontSize: 13, color: 'var(--purple)', marginBottom: 8, fontWeight: 500 }}>
            {programName}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>Dia {currentDay}</span>
          <span style={{ fontSize: 15, color: 'var(--text4)' }}>de {totalDays}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text4)', marginBottom: 6 }}>
          <span>{completedDays} concluídos</span>
          <span style={{ fontFamily: 'var(--mono)' }}>{progressPct}%</span>
        </div>
        <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2, width: `${progressPct}%`,
            background: progressPct >= 100 ? 'var(--green)' : 'var(--accent)',
          }} />
        </div>
        {lastActivity && (
          <div style={{ fontSize: 13, color: 'var(--text4)', marginTop: 12 }}>
            Última atividade: <span style={{ color: 'var(--text3)' }}>{timeAgo(lastActivity)}</span>
          </div>
        )}
      </div>

      {/* Row 5: Última conversa — full width */}
      <div style={{
        gridColumn: '1 / -1',
        background: 'var(--bg2)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--r)', padding: '20px 22px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14 }}>
          Última conversa
        </div>
        {!lastSession ? (
          <p style={{ fontSize: 14, color: 'var(--text4)', margin: 0 }}>Nenhuma conversa.</p>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {lastSession.title ?? 'Sem título'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text4)', flexShrink: 0 }}>
                {fmt(lastSession.updated_at)} · {lastSession.messages.length} msgs
              </div>
            </div>
            {lastMsg && (
              <div style={{
                fontSize: 14, color: 'var(--text3)', lineHeight: 1.6,
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}>
                {typeof lastMsg.content === 'string' ? lastMsg.content : '…'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── ProgressoTab (absorbs Programas) ────────────────────────────────────────

function ProgressoTab({ data, userId }: { data: StudentData; userId: string }) {
  const { days, enrollments, availablePrograms } = data
  const [openDay, setOpenDay] = useState<number | null>(null)
  const [selectedProgram, setSelectedProgram] = useState('')
  const [enrolling, setEnrolling]             = useState(false)
  const [enrollMessage, setEnrollMessage]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [localEnrollments, setLocalEnrollments] = useState(enrollments)
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'cancel' | 'pause' } | null>(null)
  const [busy, setBusy]                   = useState<Set<string>>(new Set())

  // ── Heatmap ───────────────────────────────────────────────────────────────
  const activityByDate: Record<string, number> = {}
  for (const d of days) {
    if (d.status === 'pending') continue
    const ts = d.completed_at ?? d.updated_at ?? d.created_at
    if (!ts) continue
    const date = ts.slice(0, 10)
    activityByDate[date] = (activityByDate[date] ?? 0) + 1
  }

  const today     = new Date()
  today.setHours(0, 0, 0, 0)
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - today.getDay() - 16 * 7)

  const weeks: Date[][] = []
  const cursor = new Date(startDate)
  while (cursor <= today) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) { week.push(new Date(cursor)); cursor.setDate(cursor.getDate() + 1) }
    weeks.push(week)
  }

  function cellColor(count: number) {
    if (count === 0) return { bg: 'var(--bg3)', border: 'var(--border)' }
    if (count === 1) return { bg: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.3)' }
    return { bg: 'var(--green-dim)', border: 'var(--green)' }
  }

  const enrolledSince = localEnrollments.length > 0
    ? localEnrollments.reduce((min, e) => e.started_at < min ? e.started_at : min, localEnrollments[0].started_at)
    : null

  // ── Outputs renderer ─────────────────────────────────────────────────────
  function renderOutputs(outputs: unknown) {
    if (!outputs) return null
    if (typeof outputs === 'string') {
      return <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{outputs}</p>
    }
    if (typeof outputs !== 'object') return null
    const obj = outputs as Record<string, unknown>
    const entries = Object.entries(obj).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0))
    if (entries.length === 0) return null

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map(([key, value]) => (
          <div key={key}>
            <div style={{ fontSize: 11, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>
              {key.replace(/_/g, ' ')}
            </div>
            {Array.isArray(value) ? (
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {(value as unknown[]).map((item, i) => (
                  <li key={i} style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                    {String(item)}
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0, lineHeight: 1.6 }}>
                {String(value)}
              </p>
            )}
          </div>
        ))}
      </div>
    )
  }

  // ── Enrollment actions ────────────────────────────────────────────────────
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
        setLocalEnrollments(prev => prev.map(e => e.id === enrollmentId ? { ...e, status: newStatus } : e))
      }
    } catch { /* silently fail */ } finally {
      setBusy(prev => { const s = new Set(prev); s.delete(enrollmentId); return s })
    }
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
            id: crypto.randomUUID(), status: 'active',
            started_at: new Date().toISOString(), completed_at: null,
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

  const completedCount = days.filter(d => d.status === 'done').length
  const activeIds      = new Set(localEnrollments.filter(e => e.status === 'active').map(e => e.program.id))
  const unenrolled     = (availablePrograms ?? []).filter(p => !activeIds.has(p.id))

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 11px', borderRadius: 'var(--rsm)',
    background: 'var(--bg3)', border: '0.5px solid var(--border2)',
    color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: 'var(--text3)', marginBottom: 5,
    textTransform: 'uppercase', letterSpacing: '.06em', display: 'block',
  }

  const DAYS_PT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  return (
    <div>
      {/* Heatmap */}
      <Section title="Atividade">
        {enrolledSince && (
          <div style={{ fontSize: 12, color: 'var(--text4)', marginBottom: 12 }}>
            Inscrito desde {fmt(enrolledSince)}
          </div>
        )}
        <div style={{ display: 'flex', gap: 3, marginBottom: 4, paddingLeft: 18 }}>
          {weeks.map((week, wi) => {
            const showMonth = week[0].getDate() <= 7 || wi === 0
            return (
              <div key={wi} style={{ width: 14, fontSize: 9, color: 'var(--text4)', textAlign: 'center', flexShrink: 0 }}>
                {showMonth ? week[0].toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') : ''}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
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
                const dateStr  = day.toISOString().slice(0, 10)
                const count    = activityByDate[dateStr] ?? 0
                const isFuture = day > today
                const { bg, border } = cellColor(count)
                const label = day.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                return (
                  <div key={di}
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

      {/* Day history with expandable outputs */}
      <Section title="Histórico por dia">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {days.filter(d => d.status !== 'pending').length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text4)', margin: 0 }}>Nenhuma atividade registrada.</p>
          )}
          {[...days]
            .filter(d => d.status !== 'pending')
            .sort((a, b) => a.day_number - b.day_number)
            .map(d => {
              const isOpen    = openDay === d.day_number
              const hasOutputs = d.outputs != null && (typeof d.outputs !== 'object' || Object.keys(d.outputs as object).length > 0)
              const rendered  = hasOutputs ? renderOutputs(d.outputs) : null

              return (
                <div key={`day-${d.day_number}`} style={{
                  background: 'var(--bg3)', borderRadius: 'var(--rsm)',
                  border: `0.5px solid ${isOpen ? 'var(--accent)' : 'var(--border)'}`,
                  overflow: 'hidden', transition: 'border-color .12s',
                }}>
                  <button
                    onClick={() => rendered && setOpenDay(isOpen ? null : d.day_number)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                      padding: '10px 12px', background: 'none', border: 'none',
                      cursor: rendered ? 'pointer' : 'default', textAlign: 'left',
                    }}
                  >
                    <div style={{ width: 28, fontSize: 12, fontWeight: 500, color: STATUS_COLORS[d.status ?? 'pending'] ?? 'var(--text4)', flexShrink: 0 }}>
                      D{d.day_number}
                    </div>
                    <Chip
                      label={d.status ?? 'pending'}
                      color={STATUS_COLORS[d.status ?? 'pending'] ?? 'var(--text4)'}
                      bg={d.status === 'done' ? 'var(--green-dim)' : d.status === 'in_progress' ? 'var(--accent-dim)' : 'var(--bg4)'}
                    />
                    {d.completed_at && (
                      <span style={{ fontSize: 11, color: 'var(--text4)' }}>
                        {fmt(d.completed_at)}
                      </span>
                    )}
                    <div style={{ flex: 1 }} />
                    {rendered && (
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                        style={{ width: 11, height: 11, color: 'var(--text4)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .12s', flexShrink: 0 }}>
                        <polyline points="6,4 10,8 6,12" />
                      </svg>
                    )}
                  </button>

                  {isOpen && rendered && (
                    <div style={{
                      padding: '12px 14px', borderTop: '0.5px solid var(--border)',
                      background: 'var(--bg2)',
                    }}>
                      {rendered}
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      </Section>

      {/* Enrollment management */}
      <Section title="Programas inscritos">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {unenrolled.length > 0 && (
            <form onSubmit={handleEnroll} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 4 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Inscrever em programa</label>
                <select required value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)} style={inputStyle}>
                  <option value="">Selecionar...</option>
                  {unenrolled.map(p => (
                    <option key={p.id} value={p.id}>{p.name}{p.is_published === false ? ' (rascunho)' : ''}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit" disabled={enrolling || !selectedProgram}
                style={{
                  padding: '9px 16px', borderRadius: 'var(--rsm)', whiteSpace: 'nowrap',
                  background: enrolling || !selectedProgram ? 'var(--bg4)' : 'var(--accent-dim)',
                  color: enrolling || !selectedProgram ? 'var(--text4)' : 'var(--accent)',
                  border: `0.5px solid ${enrolling || !selectedProgram ? 'var(--border)' : 'var(--accent)'}`,
                  fontSize: 13, fontWeight: 500, cursor: enrolling || !selectedProgram ? 'not-allowed' : 'pointer',
                }}
              >
                {enrolling ? 'Inscrevendo...' : 'Inscrever'}
              </button>
            </form>
          )}
          {enrollMessage && (
            <div style={{
              padding: '8px 12px', borderRadius: 'var(--rsm)', fontSize: 13,
              background: enrollMessage.type === 'ok' ? 'var(--green-dim)' : 'var(--red-dim)',
              color: enrollMessage.type === 'ok' ? 'var(--green)' : 'var(--red)',
              border: `0.5px solid ${enrollMessage.type === 'ok' ? 'var(--green)' : 'var(--red)'}`,
            }}>
              {enrollMessage.text}
            </div>
          )}

          {localEnrollments.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--text4)', margin: 0 }}>Nenhum programa encontrado.</p>
          )}

          {localEnrollments.map(e => {
            const done     = Math.min(completedCount, e.program.total_days)
            const pct      = e.program.total_days > 0 ? Math.round((done / e.program.total_days) * 100) : 0
            const isBusy   = busy.has(e.id)
            const isActive = e.status === 'active'

            return (
              <div key={e.id} style={{
                padding: '14px 16px', background: 'var(--bg3)',
                borderRadius: 'var(--rsm)', border: '0.5px solid var(--border)',
                opacity: e.status === 'cancelled' ? 0.6 : 1,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{e.program.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Chip
                      label={e.status === 'cancelled' ? 'Cancelado' : e.status === 'completed' ? 'Concluído' : e.status === 'paused' ? 'Pausado' : 'Ativo'}
                      color={e.status === 'cancelled' ? 'var(--red)' : e.status === 'completed' ? 'var(--green)' : e.status === 'paused' ? 'var(--orange)' : 'var(--accent)'}
                      bg={e.status === 'cancelled' ? 'var(--red-dim)' : e.status === 'completed' ? 'var(--green-dim)' : e.status === 'paused' ? 'var(--orange-dim)' : 'var(--accent-dim)'}
                    />
                    {isActive && !isBusy && confirmAction?.id !== e.id && (
                      <>
                        <button onClick={() => setConfirmAction({ id: e.id, action: 'pause' })}
                          style={{ padding: '3px 8px', borderRadius: 'var(--rsm)', fontSize: 11, background: 'transparent', color: 'var(--text4)', border: '0.5px solid var(--border2)', cursor: 'pointer' }}>
                          Pausar
                        </button>
                        <button onClick={() => setConfirmAction({ id: e.id, action: 'cancel' })}
                          style={{ padding: '3px 8px', borderRadius: 'var(--rsm)', fontSize: 11, background: 'transparent', color: 'var(--red)', border: '0.5px solid var(--red)', cursor: 'pointer' }}>
                          Cancelar
                        </button>
                      </>
                    )}
                    {isActive && confirmAction?.id === e.id && (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{confirmAction.action === 'pause' ? 'Pausar?' : 'Cancelar?'}</span>
                        <button onClick={() => handleStatusChange(e.id, confirmAction.action)}
                          style={{ padding: '3px 8px', borderRadius: 'var(--rsm)', fontSize: 11, background: confirmAction.action === 'pause' ? 'var(--orange-dim)' : 'var(--red-dim)', color: confirmAction.action === 'pause' ? 'var(--orange)' : 'var(--red)', border: `0.5px solid ${confirmAction.action === 'pause' ? 'var(--orange)' : 'var(--red)'}`, cursor: 'pointer' }}>
                          Sim
                        </button>
                        <button onClick={() => setConfirmAction(null)}
                          style={{ padding: '3px 8px', borderRadius: 'var(--rsm)', fontSize: 11, background: 'transparent', color: 'var(--text4)', border: '0.5px solid var(--border2)', cursor: 'pointer' }}>
                          Não
                        </button>
                      </div>
                    )}
                    {isBusy && <span style={{ fontSize: 11, color: 'var(--text4)' }}>Salvando...</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text4)', marginBottom: 5 }}>
                  <span>{done} de {e.program.total_days} dias</span>
                  <span style={{ fontFamily: 'var(--mono)' }}>{pct}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: e.status === 'completed' ? 'var(--green)' : 'var(--accent)', transition: 'width .4s' }} />
                </div>
              </div>
            )
          })}
        </div>
      </Section>
    </div>
  )
}

// ── PerfilTab ────────────────────────────────────────────────────────────────

function PerfilTab({ data }: { data: StudentData }) {
  const { candidate, interviewPrep, cvVersions } = data

  return (
    <div>
      {candidate?.ici_scores && (
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
          <ICICard scores={candidate.ici_scores} compact={false} showShare={true} />
        </div>
      )}

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
                    background: 'var(--bg3)', border: '0.5px solid var(--border)', color: 'var(--text2)',
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

// ── BoardTab ─────────────────────────────────────────────────────────────────

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
                fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 10,
                background: s.bg, color: s.color,
                textTransform: 'uppercase', letterSpacing: '.06em',
              }}>
                {s.label}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text4)' }}>{colJobs.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {colJobs.map(j => (
                <div key={j.id} style={{
                  padding: '9px 11px', background: 'var(--bg3)',
                  borderRadius: 'var(--rsm)', border: '0.5px solid var(--border)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{j.role_title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{j.company_name}</div>
                  {j.fit_score !== null && (
                    <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4 }}>Fit: {j.fit_score}%</div>
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

// ── ConversasTab ─────────────────────────────────────────────────────────────

function ConversasTab({ data }: { data: StudentData }) {
  const { chatSessions } = data
  const [openSession, setOpenSession]   = useState<string | null>(null)
  const [openSnapshot, setOpenSnapshot] = useState<string | null>(null)

  if (chatSessions.length === 0) {
    return (
      <Section title="Conversas">
        <p style={{ fontSize: 13, color: 'var(--text4)', margin: 0 }}>Nenhuma conversa registrada.</p>
      </Section>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {chatSessions.map(session => {
        const isOpen     = openSession === session.id
        const msgCount   = session.messages?.length ?? 0
        const modeColor  = session.mode === 'mentor' ? 'var(--purple)' : 'var(--blue)'
        const modeBg     = session.mode === 'mentor' ? 'var(--purple-dim)' : 'var(--blue-dim)'

        return (
          <div key={session.id} style={{
            background: 'var(--bg2)', border: `0.5px solid ${isOpen ? 'var(--purple)' : 'var(--border)'}`,
            borderRadius: 'var(--r)', overflow: 'hidden', transition: 'border-color .12s',
          }}>
            <button
              onClick={() => setOpenSession(isOpen ? null : session.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                width: '100%', padding: '16px 18px', background: 'none',
                border: 'none', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {session.title ?? 'Sem título'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text4)' }}>
                  {fmt(session.updated_at)} · {msgCount} {msgCount === 1 ? 'mensagem' : 'mensagens'}
                </div>
                {session.summary && (
                  <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6, lineHeight: 1.55 }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{session.summary}</ReactMarkdown>
                  </div>
                )}
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 10,
                background: modeBg, color: modeColor,
                textTransform: 'uppercase', letterSpacing: '.06em', flexShrink: 0,
              }}>
                {session.mode ?? 'task'}
              </span>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                style={{ width: 12, height: 12, color: 'var(--text4)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }}>
                <polyline points="6,4 10,8 6,12" />
              </svg>
            </button>

            {isOpen && (
              <div style={{ borderTop: '0.5px solid var(--border)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 520, overflowY: 'auto' }}>
                {session.context_snapshot && (
                  <div>
                    <button
                      onClick={() => setOpenSnapshot(openSnapshot === session.id ? null : session.id)}
                      style={{ fontSize: 11, color: 'var(--purple)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: openSnapshot === session.id ? 8 : 0 }}
                    >
                      {openSnapshot === session.id ? '▲ ocultar contexto' : '▼ ver contexto após esta sessão'}
                    </button>
                    {openSnapshot === session.id && (
                      <div style={{
                        padding: '10px 12px', background: 'var(--purple-dim)',
                        borderRadius: 'var(--rsm)', border: '0.5px solid rgba(167,139,250,.2)',
                        fontSize: 12, color: 'var(--text2)', lineHeight: 1.6,
                      }}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{session.context_snapshot}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
                {session.messages.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--text4)', margin: 0 }}>Sem mensagens.</p>
                )}
                {session.messages.map((msg, i) => {
                  const isUser = msg.role === 'user'
                  const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
                  return (
                    <div key={i} className={isUser ? 'chat-msg-user' : 'chat-msg-ai'}>
                      {isUser ? (
                        <div className="chat-bubble-user">{content}</div>
                      ) : (
                        <div className="chat-bubble-ai">
                          <div className="chat-ai-body">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── AcoesDrawer ──────────────────────────────────────────────────────────────

function AcoesDrawer({ data, userId, onClose }: { data: StudentData; userId: string; onClose: () => void }) {
  const { tokenBalances, tokenUsage, mentorActions, enrollments, availablePrograms } = data
  const active = tokenBalances.filter(b => b.is_active && new Date(b.expires_at) > new Date())

  const [localEnrollments, setLocalEnrollments] = useState(enrollments)
  const [selectedProgram, setSelectedProgram]   = useState('')
  const [enrolling, setEnrolling]               = useState(false)
  const [enrollMsg, setEnrollMsg]               = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [confirmAction, setConfirmAction]       = useState<{ id: string; action: 'cancel' | 'pause' } | null>(null)
  const [busy, setBusy]                         = useState<Set<string>>(new Set())

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProgram) return
    setEnrolling(true); setEnrollMsg(null)
    try {
      const res = await fetch('/api/mentor/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: userId, program_id: selectedProgram }),
      })
      if (res.ok) {
        const body = await res.json()
        setEnrollMsg({ type: 'ok', text: `Inscrito em "${body.program_name}".` })
        const prog = availablePrograms.find(p => p.id === selectedProgram)
        if (prog) setLocalEnrollments(prev => [...prev, {
          id: crypto.randomUUID(), status: 'active',
          started_at: new Date().toISOString(), completed_at: null,
          program: { id: prog.id, name: prog.name, slug: prog.slug, total_days: 30, description: null },
        }])
        setSelectedProgram('')
      } else {
        const body = await res.json()
        setEnrollMsg({ type: 'err', text: body.error ?? 'Erro ao inscrever.' })
      }
    } catch { setEnrollMsg({ type: 'err', text: 'Erro de rede.' }) }
    finally { setEnrolling(false) }
  }

  async function handleEnrollAction(enrollmentId: string, action: 'cancel' | 'pause') {
    setBusy(prev => new Set(prev).add(enrollmentId)); setConfirmAction(null)
    try {
      const res = await fetch('/api/mentor/enroll', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_id: enrollmentId, user_id: userId, action }),
      })
      if (res.ok) setLocalEnrollments(prev => prev.map(e => e.id === enrollmentId ? { ...e, status: action === 'pause' ? 'paused' : 'cancelled' } : e))
    } catch { /* silent */ }
    finally { setBusy(prev => { const s = new Set(prev); s.delete(enrollmentId); return s }) }
  }

  const activeEnrollIds = new Set(localEnrollments.filter(e => e.status === 'active').map(e => e.program.id))
  const unenrolled = (availablePrograms ?? []).filter(p => !activeEnrollIds.has(p.id))

  const [tokens, setTokens]           = useState('')
  const [days, setDays]               = useState('365')
  const [reason, setReason]           = useState('')
  const [productType, setProductType] = useState('manual_grant')
  const [submitting, setSubmitting]   = useState(false)
  const [message, setMessage]         = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

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
        setMessage({ type: 'ok', text: `${parseInt(tokens).toLocaleString()} tokens concedidos.` })
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
    width: '100%', padding: '9px 11px', borderRadius: 'var(--rsm)',
    background: 'var(--bg3)', border: '0.5px solid var(--border2)',
    color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 12, color: 'var(--text3)', marginBottom: 5,
    textTransform: 'uppercase', letterSpacing: '.06em', display: 'block',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
      <div style={{
        position: 'relative', zIndex: 1, width: 'min(420px, 100vw)', height: '100%',
        background: 'var(--bg)', borderLeft: '0.5px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        <div style={{
          padding: '14px 18px', borderBottom: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, position: 'sticky', top: 0,
          background: 'var(--bg)', zIndex: 1,
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', flex: 1 }}>⚡ Ações</span>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 'var(--rsm)', background: 'none', border: 'none',
            cursor: 'pointer', color: 'var(--text4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="2" y1="2" x2="12" y2="12" /><line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </button>
        </div>

        <div style={{ padding: '18px' }}>

          {/* Enrollment management */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Programas</div>

            {/* Enroll form */}
            {unenrolled.length > 0 && (
              <form onSubmit={handleEnroll} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 10 }}>
                <select required value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 'var(--rsm)', background: 'var(--bg3)', border: '0.5px solid var(--border2)', color: 'var(--text)', fontSize: 13, outline: 'none' }}>
                  <option value="">Inscrever em...</option>
                  {unenrolled.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button type="submit" disabled={enrolling || !selectedProgram}
                  style={{ padding: '8px 14px', borderRadius: 'var(--rsm)', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', background: enrolling || !selectedProgram ? 'var(--bg4)' : 'var(--accent-dim)', color: enrolling || !selectedProgram ? 'var(--text4)' : 'var(--accent)', border: `0.5px solid ${enrolling || !selectedProgram ? 'var(--border)' : 'var(--accent)'}`, cursor: enrolling || !selectedProgram ? 'not-allowed' : 'pointer' }}>
                  {enrolling ? '...' : 'Inscrever'}
                </button>
              </form>
            )}
            {enrollMsg && (
              <div style={{ marginBottom: 10, padding: '7px 10px', borderRadius: 'var(--rsm)', fontSize: 12, background: enrollMsg.type === 'ok' ? 'var(--green-dim)' : 'var(--red-dim)', color: enrollMsg.type === 'ok' ? 'var(--green)' : 'var(--red)', border: `0.5px solid ${enrollMsg.type === 'ok' ? 'var(--green)' : 'var(--red)'}` }}>
                {enrollMsg.text}
              </div>
            )}

            {localEnrollments.length === 0
              ? <p style={{ fontSize: 13, color: 'var(--text4)', margin: 0 }}>Nenhum programa.</p>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {localEnrollments.map(e => {
                    const isBusy = busy.has(e.id)
                    const isActive = e.status === 'active'
                    return (
                      <div key={e.id} style={{ padding: '10px 12px', background: 'var(--bg2)', borderRadius: 'var(--rsm)', border: '0.5px solid var(--border)', opacity: e.status === 'cancelled' ? 0.6 : 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.program.name}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 8, textTransform: 'uppercase', letterSpacing: '.06em', background: e.status === 'active' ? 'var(--accent-dim)' : 'var(--bg4)', color: e.status === 'active' ? 'var(--accent)' : 'var(--text4)', flexShrink: 0 }}>
                            {e.status}
                          </span>
                          {isActive && !isBusy && confirmAction?.id !== e.id && (
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                              <button onClick={() => setConfirmAction({ id: e.id, action: 'pause' })} style={{ padding: '2px 7px', borderRadius: 'var(--rsm)', fontSize: 10, background: 'transparent', color: 'var(--text4)', border: '0.5px solid var(--border2)', cursor: 'pointer' }}>Pausar</button>
                              <button onClick={() => setConfirmAction({ id: e.id, action: 'cancel' })} style={{ padding: '2px 7px', borderRadius: 'var(--rsm)', fontSize: 10, background: 'transparent', color: 'var(--red)', border: '0.5px solid var(--red)', cursor: 'pointer' }}>Cancelar</button>
                            </div>
                          )}
                          {isActive && confirmAction?.id === e.id && (
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: 10, color: 'var(--text3)' }}>{confirmAction.action === 'pause' ? 'Pausar?' : 'Cancelar?'}</span>
                              <button onClick={() => handleEnrollAction(e.id, confirmAction.action)} style={{ padding: '2px 7px', borderRadius: 'var(--rsm)', fontSize: 10, background: 'var(--red-dim)', color: 'var(--red)', border: '0.5px solid var(--red)', cursor: 'pointer' }}>Sim</button>
                              <button onClick={() => setConfirmAction(null)} style={{ padding: '2px 7px', borderRadius: 'var(--rsm)', fontSize: 10, background: 'transparent', color: 'var(--text4)', border: '0.5px solid var(--border2)', cursor: 'pointer' }}>Não</button>
                            </div>
                          )}
                          {isBusy && <span style={{ fontSize: 10, color: 'var(--text4)', flexShrink: 0 }}>...</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
            }
          </div>

          {/* Token balances */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Saldos ativos</div>
            {active.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text4)', margin: 0 }}>Sem saldo ativo.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {active.map(b => {
                  const pct = b.tokens_total > 0 ? Math.min((b.tokens_used / b.tokens_total) * 100, 100) : 0
                  return (
                    <div key={b.id} style={{
                      padding: '12px 14px', background: 'var(--bg2)',
                      borderRadius: 'var(--rsm)', border: '0.5px solid var(--border)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{b.product_type}</span>
                        <span style={{ fontSize: 11, color: 'var(--text4)' }}>exp. {fmt(b.expires_at)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text3)', marginBottom: 6, fontFamily: 'var(--mono)' }}>
                        <span>{(b.tokens_total - b.tokens_used).toLocaleString()} rest.</span>
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
          </div>

          {/* Grant form */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 12 }}>Conceder tokens</div>
            <form onSubmit={handleGrantTokens} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Quantidade</label>
                  <input type="number" min="1" required value={tokens} onChange={e => setTokens(e.target.value)} placeholder="ex: 500000" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Validade (dias)</label>
                  <input type="number" min="1" required value={days} onChange={e => setDays(e.target.value)} style={inputStyle} />
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
                <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="ex: reposição por bug" style={inputStyle} />
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
              <button type="submit" disabled={submitting || !tokens}
                style={{
                  padding: '9px 18px', borderRadius: 'var(--rsm)',
                  background: submitting || !tokens ? 'var(--bg4)' : 'var(--purple-dim)',
                  color: submitting || !tokens ? 'var(--text4)' : 'var(--purple)',
                  border: `0.5px solid ${submitting || !tokens ? 'var(--border)' : 'var(--purple)'}`,
                  fontSize: 13, fontWeight: 500, cursor: submitting || !tokens ? 'not-allowed' : 'pointer',
                  alignSelf: 'flex-start',
                }}>
                {submitting ? 'Concedendo...' : 'Conceder'}
              </button>
            </form>
          </div>

          {/* Mentor action log */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Histórico de ações</div>
            {mentorActions.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text4)', margin: 0 }}>Nenhuma ação registrada.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {mentorActions.map(a => (
                  <div key={a.id} style={{
                    padding: '9px 12px', background: 'var(--bg2)',
                    borderRadius: 'var(--rsm)', border: '0.5px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{a.action}</span>
                      {a.metadata != null && (
                        <span style={{ fontSize: 11, color: 'var(--text4)', marginLeft: 8 }}>
                          {JSON.stringify(a.metadata)}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text4)', flexShrink: 0, marginLeft: 8 }}>
                      {fmt(a.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Token usage history */}
          {tokenUsage.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 10 }}>Uso recente</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {tokenUsage.slice(0, 20).map(u => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 10px', background: 'var(--bg2)',
                    borderRadius: 'var(--rsm)', fontSize: 12,
                  }}>
                    <span style={{ color: 'var(--text3)' }}>{u.interaction_type}</span>
                    <span style={{ color: 'var(--purple)', fontFamily: 'var(--mono)' }}>-{u.tokens_consumed.toLocaleString()}</span>
                    <span style={{ color: 'var(--text4)' }}>{fmt(u.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main tabs component ──────────────────────────────────────────────────────

const TABS = [
  { id: 'resumo',    label: 'Resumo'    },
  { id: 'perfil',    label: 'Perfil'    },
  { id: 'conversas', label: 'Conversas' },
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
  const [tab, setTab] = useState<TabId>('resumo')
  const [chatOpen, setChatOpen]   = useState(false)
  const [acoesOpen, setAcoesOpen] = useState(false)
  const { profile } = data

  // Fire background summarization when admin opens the profile
  useEffect(() => {
    fetch(`/api/admin/students/${userId}/summarize`, { method: 'POST' }).catch(() => {})
  }, [userId])

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: 'var(--bg)' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, color: 'var(--text4)', marginBottom: 6 }}>
            <a href={backHref} style={{ color: 'var(--text4)', textDecoration: 'none' }}>Alunos</a>
            {' / '}
            <span style={{ color: 'var(--text3)' }}>{profile.full_name ?? userId.slice(0, 8)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              {profile.full_name ?? 'Sem nome'}
            </h1>
            <span style={{
              fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 10,
              background: 'var(--accent-dim)', color: 'var(--accent)',
              textTransform: 'uppercase', letterSpacing: '.06em',
            }}>
              {profile.role}
            </span>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2, marginBottom: 24,
          borderBottom: '0.5px solid var(--border)',
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '9px 16px', fontSize: 14, border: 'none', cursor: 'pointer',
              background: 'none', borderRadius: 'var(--rsm) var(--rsm) 0 0',
              color: tab === t.id ? 'var(--text)' : 'var(--text3)',
              fontWeight: tab === t.id ? 500 : 400,
              borderBottom: tab === t.id ? '2px solid var(--purple)' : '2px solid transparent',
              transition: 'all .12s', marginBottom: -1,
            }}>
              {t.label}
            </button>
          ))}

          <div style={{ flex: 1 }} />

          {/* Actions button */}
          <button onClick={() => setAcoesOpen(true)} style={{
            marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 'var(--rsm)',
            background: acoesOpen ? 'var(--orange-dim)' : 'none',
            border: `0.5px solid ${acoesOpen ? 'rgba(251,146,60,.3)' : 'var(--border2)'}`,
            color: acoesOpen ? 'var(--orange)' : 'var(--text3)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all .12s',
          }}>
            ⚡ Ações
          </button>

          {/* IA button */}
          <button onClick={() => setChatOpen(true)} style={{
            marginLeft: 6, marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 'var(--rsm)',
            background: chatOpen ? 'var(--purple-dim)' : 'none',
            border: `0.5px solid ${chatOpen ? 'rgba(167,139,250,.3)' : 'var(--border2)'}`,
            color: chatOpen ? 'var(--purple)' : 'var(--text3)',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all .12s',
          }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13 }}>
              <path d="M2 3h12v8H9l-3 3V11H2z" />
            </svg>
            Perguntar à IA
          </button>
        </div>

        {/* Tab content */}
        {tab === 'resumo'    && <ResumoTab    data={data} userId={userId} />}
        {tab === 'perfil'    && <PerfilTab    data={data} />}
        {tab === 'conversas' && <ConversasTab data={data} />}
      </div>

      {/* Ações drawer */}
      {acoesOpen && <AcoesDrawer data={data} userId={userId} onClose={() => setAcoesOpen(false)} />}

      {/* IA side panel */}
      {chatOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
          <div onClick={() => setChatOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
          <div style={{
            position: 'relative', zIndex: 1, width: 'min(480px, 100vw)', height: '100%',
            background: 'var(--bg)', borderLeft: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              padding: '14px 18px', borderBottom: '0.5px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
            }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                style={{ width: 14, height: 14, color: 'var(--purple)' }}>
                <path d="M2 3h12v8H9l-3 3V11H2z" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1 }}>
                Perguntar sobre {profile.full_name ?? 'este aluno'}
              </span>
              <button onClick={() => setChatOpen(false)} style={{
                width: 28, height: 28, borderRadius: 'var(--rsm)', background: 'none', border: 'none',
                cursor: 'pointer', color: 'var(--text4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <line x1="2" y1="2" x2="12" y2="12" /><line x1="12" y1="2" x2="2" y2="12" />
                </svg>
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', padding: '16px 18px', display: 'flex', flexDirection: 'column' }}>
              <StudentChat userId={userId} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
