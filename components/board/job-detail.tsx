'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { updateJob, archiveJob, type JobStatus, type StatusLogEntry } from '@/app/actions/jobs'

// ─── Types ───────────────────────────────────────────────────────────────────

interface InterviewPrep {
  generated_at: string
  company_info: { about: string; culture: string[]; recent_news: string[] }
  likely_topics: string[]
  likely_questions: string[]
  strengths: string[]
  gaps: string[]
  tips: string[]
}

export interface Job {
  id: string
  company_name: string
  role_title: string
  status: string
  source_url: string | null
  job_description: string | null
  fit_score: number | null
  strong_keywords: string[] | null
  weak_keywords: string[] | null
  apply_recommendation: boolean | null
  analysis_notes: string | null
  applied_at: string | null
  interview_notes: string | null
  cover_note: string | null
  recruiter_name: string | null
  recruiter_linkedin: string | null
  status_log: StatusLogEntry[] | null
  interview_prep: InterviewPrep | null
  archived_at: string | null
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES: { id: JobStatus; label: string; color: string }[] = [
  { id: 'to_analyse',   label: 'Analisar',    color: 'var(--text3)' },
  { id: 'analysing',    label: 'Analisando',  color: 'var(--purple)' },
  { id: 'applied',      label: 'Aplicado',    color: 'var(--accent)' },
  { id: 'interviewing', label: 'Entrevista',  color: '#60a5fa' },
  { id: 'offer',        label: 'Oferta',      color: 'var(--green)' },
  { id: 'discarded',    label: 'Descartado',  color: 'var(--red)' },
]

function fitColor(score: number | null): string {
  if (!score) return 'var(--text4)'
  if (score >= 80) return 'var(--green)'
  if (score >= 60) return 'var(--orange)'
  return 'var(--red)'
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  to_analyse:   { label: 'Analisar',   color: 'var(--text3)' },
  analysing:    { label: 'Analisando', color: 'var(--purple)' },
  applied:      { label: 'Aplicado',   color: 'var(--accent)' },
  interviewing: { label: 'Entrevista', color: '#60a5fa' },
  offer:        { label: 'Oferta',     color: 'var(--green)' },
  discarded:    { label: 'Descartado', color: 'var(--red)' },
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)  return 'agora'
  if (mins < 60) return `${mins}min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h atrás`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d atrás`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusTimeline({ log, createdAt }: { log: StatusLogEntry[] | null; createdAt: string }) {
  // Build full list: creation event + each transition
  type TimelineEvent = { label: string; at: string; color: string; dot: string; note?: string }
  const events: TimelineEvent[] = [
    { label: 'Vaga adicionada', at: createdAt, color: 'var(--text4)', dot: 'var(--bg4)' },
    ...(log ?? []).map(e => ({
      label: `→ ${STATUS_META[e.to]?.label ?? e.to}`,
      at: e.at,
      color: STATUS_META[e.to]?.color ?? 'var(--text3)',
      dot: STATUS_META[e.to]?.color ?? 'var(--border)',
      note: e.note,
    })),
  ]

  return (
    <div style={{ position: 'relative', paddingLeft: 16 }}>
      {/* vertical line */}
      <div style={{
        position: 'absolute', left: 5, top: 6, bottom: 6,
        width: '0.5px', background: 'var(--border)',
      }} />

      {events.map((ev, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < events.length - 1 ? 12 : 0, position: 'relative' }}>
          {/* dot */}
          <div style={{
            position: 'absolute', left: -11, top: 4,
            width: 7, height: 7, borderRadius: '50%',
            background: ev.dot, border: '0.5px solid var(--border)',
            flexShrink: 0,
          }} />
          <div>
            <span style={{ fontSize: 12, color: ev.color, fontWeight: 500 }}>{ev.label}</span>
            {ev.note && (
              <span style={{ fontSize: 11, color: 'var(--text4)', marginLeft: 6 }}>{ev.note}</span>
            )}
            <div style={{ fontSize: 10, color: 'var(--text4)', fontFamily: 'var(--mono)', marginTop: 1 }}>
              {formatRelative(ev.at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Interview Prep Section ───────────────────────────────────────────────────

function InterviewPrepSection({ job, onPrepGenerated }: {
  job: Job
  onPrepGenerated: (prep: InterviewPrep) => void
}) {
  const [loading, setLoading] = useState(false)
  const prep = job.interview_prep

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch('/api/jobs/interview-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      })
      const { prep: generated } = await res.json()
      if (generated) onPrepGenerated(generated)
    } finally {
      setLoading(false)
    }
  }

  const chipStyle = (color: string): React.CSSProperties => ({
    fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 500,
    display: 'inline-block', marginRight: 5, marginBottom: 5,
    background: `${color}18`, color,
  })

  return (
    <div>
      {prep ? (
        <>
          {/* Company info */}
          <div style={{
            background: 'var(--bg3)', borderRadius: 'var(--r)',
            padding: '12px 14px', marginBottom: 12,
            border: '0.5px solid var(--border)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 6 }}>
              Sobre a empresa
            </div>
            <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, margin: '0 0 8px' }}>
              {prep.company_info.about}
            </p>
            {prep.company_info.recent_news.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 14 }}>
                {prep.company_info.recent_news.map((n, i) => (
                  <li key={i} style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>{n}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Culture */}
          {prep.company_info.culture.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Cultura</div>
              <div>{prep.company_info.culture.map((c, i) => (
                <span key={i} style={chipStyle('#60a5fa')}>{c}</span>
              ))}</div>
            </div>
          )}

          {/* Fit */}
          {(prep.strengths.length > 0 || prep.gaps.length > 0) && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Seu fit</div>
              <div>
                {prep.strengths.map((s, i) => <span key={i} style={chipStyle('var(--green)')}>✓ {s}</span>)}
                {prep.gaps.map((g, i) => <span key={i} style={chipStyle('var(--orange)')}>△ {g}</span>)}
              </div>
            </div>
          )}

          {/* Likely questions */}
          {prep.likely_questions.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Perguntas prováveis</div>
              <ul style={{ margin: 0, paddingLeft: 14 }}>
                {prep.likely_questions.map((q, i) => (
                  <li key={i} style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, lineHeight: 1.5 }}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Tips */}
          {prep.tips.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Dicas</div>
              <ul style={{ margin: 0, paddingLeft: 14 }}>
                {prep.tips.map((t, i) => (
                  <li key={i} style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, lineHeight: 1.5 }}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={generate}
            disabled={loading}
            style={{
              padding: '7px 14px', background: 'none',
              border: '0.5px solid var(--border2)', borderRadius: 'var(--rsm)',
              color: 'var(--text4)', fontSize: 11, cursor: 'pointer',
              fontFamily: 'var(--font)',
            }}
          >
            {loading ? 'Atualizando...' : '↺ Atualizar prep'}
          </button>
        </>
      ) : (
        <button
          onClick={generate}
          disabled={loading}
          style={{
            width: '100%', padding: '10px 0',
            background: 'rgba(96,165,250,0.08)', border: '0.5px solid #60a5fa',
            borderRadius: 'var(--rsm)', cursor: loading ? 'not-allowed' : 'pointer',
            color: '#60a5fa', fontSize: 12, fontWeight: 600,
            fontFamily: 'var(--font)',
          }}
        >
          {loading ? '✦ Pesquisando empresa e preparando...' : '✦ Gerar prep de entrevista com IA'}
        </button>
      )}
    </div>
  )
}

function InlineEdit({ value, onChange, style, placeholder, multiline }: {
  value: string
  onChange: (v: string) => void
  style?: React.CSSProperties
  placeholder?: string
  multiline?: boolean
}) {
  const base: React.CSSProperties = {
    background: 'transparent', border: 'none', outline: 'none',
    fontFamily: 'var(--font)', color: 'var(--text1)', width: '100%',
    resize: 'none', padding: 0,
    ...style,
  }
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        style={base}
      />
    )
  }
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={base}
    />
  )
}

function StatusBadge({ status, onChange }: { status: string; onChange: (s: JobStatus) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = STATUSES.find(s => s.id === status) ?? STATUSES[0]

  useEffect(() => {
    if (!open) return
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 20,
          background: 'var(--bg3)', border: '0.5px solid var(--border2)',
          cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 11, fontWeight: 500,
          color: current.color,
        }}
      >
        {current.label}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 4l3 3 3-3" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4,
          background: 'var(--bg3)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--r)', padding: 4, zIndex: 10, minWidth: 130,
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        }}>
          {STATUSES.map(s => (
            <button
              key={s.id}
              onClick={() => { onChange(s.id); setOpen(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '6px 10px', background: s.id === status ? 'var(--bg4)' : 'none',
                border: 'none', borderRadius: 'var(--rsm)', cursor: 'pointer',
                fontFamily: 'var(--font)', fontSize: 11, color: s.color,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 10, fontWeight: 600, color: 'var(--text4)',
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

const fieldStyle: React.CSSProperties = {
  width: '100%', background: 'var(--bg3)', border: '0.5px solid var(--border2)',
  borderRadius: 'var(--rsm)', padding: '8px 10px',
  fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text1)',
  outline: 'none', boxSizing: 'border-box',
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

type Tab = 'vaga' | 'analise' | 'prep' | 'notas' | 'historico'

function TabBar({ tabs, active, onChange }: {
  tabs: { id: Tab; label: string }[]
  active: Tab
  onChange: (t: Tab) => void
}) {
  return (
    <div style={{
      display: 'flex', gap: 2, padding: '0 20px',
      borderBottom: '0.5px solid var(--border)', flexShrink: 0,
      overflowX: 'auto',
    }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: '10px 12px', background: 'none', border: 'none',
            borderBottom: active === t.id ? '1.5px solid var(--accent)' : '1.5px solid transparent',
            color: active === t.id ? 'var(--text1)' : 'var(--text4)',
            fontSize: 12, fontWeight: active === t.id ? 500 : 400,
            cursor: 'pointer', fontFamily: 'var(--font)',
            whiteSpace: 'nowrap', marginBottom: -1,
            transition: 'color 0.12s',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────

export function JobDetail({ job: initialJob, onClose, onUpdate, onArchive }: {
  job: Job
  onClose: () => void
  onUpdate: (job: Job) => void
  onArchive: (jobId: string) => void
}) {
  const [job, setJob] = useState<Job>(initialJob)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [tab, setTab] = useState<Tab>('vaga')
  const drawerRef = useRef<HTMLDivElement>(null)

  // Sync if parent passes a different job
  useEffect(() => { setJob(initialJob); setDirty(false) }, [initialJob.id])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function patch(fields: Partial<Job>) {
    setJob(prev => ({ ...prev, ...fields }))
    setDirty(true)
  }

  // Status changes are persisted immediately so the log is recorded
  async function changeStatus(newStatus: JobStatus) {
    const prev = job
    setJob(j => ({ ...j, status: newStatus }))
    try {
      const saved = await updateJob(job.id, { status: newStatus })
      // Merge saved (has updated status_log) with local state
      setJob(j => ({ ...j, status_log: (saved as unknown as Job).status_log }))
      onUpdate({ ...job, status: newStatus, status_log: (saved as unknown as Job).status_log })
    } catch {
      setJob(prev) // rollback
    }
  }

  async function handleArchive() {
    if (!confirm(`Arquivar "${job.company_name}"? A vaga ficará oculta do board.`)) return
    setArchiving(true)
    try {
      await archiveJob(job.id)
      onArchive(job.id)
      onClose()
    } finally {
      setArchiving(false)
    }
  }

  async function save() {
    if (!dirty) return
    setSaving(true)
    try {
      const saved = await updateJob(job.id, {
        company_name: job.company_name,
        role_title: job.role_title,
        status: job.status as JobStatus,
        source_url: job.source_url ?? undefined,
        job_description: job.job_description ?? undefined,
        applied_at: job.applied_at ?? undefined,
        interview_notes: job.interview_notes ?? undefined,
        cover_note: job.cover_note ?? undefined,
        recruiter_name: job.recruiter_name ?? undefined,
        recruiter_linkedin: job.recruiter_linkedin ?? undefined,
      })
      onUpdate(saved as unknown as Job)
      setDirty(false)
    } finally {
      setSaving(false)
    }
  }

  async function analyze() {
    if (!job.job_description?.trim()) return
    setAnalyzing(true)
    try {
      const res = await fetch('/api/jobs/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          jobDescription: job.job_description,
          companyName: job.company_name,
          roleTitle: job.role_title,
        }),
      })
      const { job: updated } = await res.json()
      if (updated) {
        setJob(updated)
        onUpdate(updated)
        setDirty(false)
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const showAppliedDate = ['applied', 'interviewing', 'offer'].includes(job.status)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 40,
          background: 'rgba(0,0,0,0.4)',
        }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 50,
          width: 460, background: 'var(--bg2)',
          borderLeft: '0.5px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-12px 0 40px rgba(0,0,0,0.35)',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '16px 20px', borderBottom: '0.5px solid var(--border)',
          display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <input
                value={job.company_name}
                onChange={e => patch({ company_name: e.target.value })}
                placeholder="Empresa"
                style={{
                  ...fieldStyle, background: 'transparent', border: 'none',
                  padding: '0 0 2px 0', fontSize: 18, fontWeight: 700,
                  color: 'var(--text1)', marginBottom: 4,
                }}
              />
              <input
                value={job.role_title}
                onChange={e => patch({ role_title: e.target.value })}
                placeholder="Cargo"
                style={{
                  ...fieldStyle, background: 'transparent', border: 'none',
                  padding: 0, fontSize: 13, color: 'var(--text3)',
                }}
              />
            </div>
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: 'var(--rsm)',
                background: 'var(--bg3)', border: '0.5px solid var(--border)',
                cursor: 'pointer', color: 'var(--text3)', fontSize: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge
              status={job.status}
              onChange={changeStatus}
            />
            {job.fit_score !== null && (
              <span style={{
                fontSize: 11, fontWeight: 600, fontFamily: 'var(--mono)',
                color: fitColor(job.fit_score),
                padding: '3px 8px', borderRadius: 20,
                background: 'var(--bg3)',
              }}>
                {job.fit_score}% fit
              </span>
            )}
            {job.apply_recommendation === true && (
              <span style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 20,
                background: 'rgba(74,222,128,0.1)', color: 'var(--green)',
                fontWeight: 500,
              }}>
                ✓ Aplicar
              </span>
            )}
            {job.apply_recommendation === false && (
              <span style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 20,
                background: 'rgba(248,113,113,0.1)', color: 'var(--red)',
                fontWeight: 500,
              }}>
                ✗ Não aplicar
              </span>
            )}
          </div>
        </div>

        {/* ── Tabs ── */}
        {(() => {
          const tabs: { id: Tab; label: string }[] = [
            { id: 'vaga', label: 'Vaga' },
            { id: 'analise', label: job.fit_score !== null ? `Análise · ${job.fit_score}%` : 'Análise' },
            ...(job.status === 'interviewing' ? [{ id: 'prep' as Tab, label: 'Prep' }] : []),
            { id: 'notas', label: 'Notas' },
            { id: 'historico', label: 'Histórico' },
          ]
          const activeTab = tabs.find(t => t.id === tab) ? tab : 'vaga'
          return <TabBar tabs={tabs} active={activeTab} onChange={setTab} />
        })()}

        {/* ── Tab content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* ── VAGA ── */}
          {tab === 'vaga' && (
            <>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <input
                  value={job.source_url ?? ''}
                  onChange={e => patch({ source_url: e.target.value })}
                  placeholder="URL da vaga"
                  style={{ ...fieldStyle, flex: 1 }}
                />
                {job.source_url && (
                  <a
                    href={job.source_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '8px 10px', background: 'var(--bg3)',
                      border: '0.5px solid var(--border2)', borderRadius: 'var(--rsm)',
                      color: 'var(--text3)', fontSize: 11, textDecoration: 'none',
                      display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
                    }}
                  >
                    ↗ Abrir
                  </a>
                )}
              </div>
              <textarea
                value={job.job_description ?? ''}
                onChange={e => patch({ job_description: e.target.value })}
                placeholder="Cole a descrição da vaga aqui..."
                style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.6, minHeight: 320 }}
              />
            </>
          )}

          {/* ── ANÁLISE ── */}
          {tab === 'analise' && (
            <>
              {job.fit_score !== null ? (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <span style={{
                      fontSize: 36, fontWeight: 700, fontFamily: 'var(--mono)',
                      color: fitColor(job.fit_score), lineHeight: 1,
                    }}>
                      {job.fit_score}%
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2 }}>
                        <div style={{
                          height: '100%', borderRadius: 2,
                          width: `${job.fit_score}%`,
                          background: fitColor(job.fit_score),
                          transition: 'width 0.4s ease',
                        }} />
                      </div>
                      {job.apply_recommendation !== null && (
                        <div style={{ marginTop: 6, fontSize: 11, color: job.apply_recommendation ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
                          {job.apply_recommendation ? '✓ Recomendado aplicar' : '✗ Não recomendado'}
                        </div>
                      )}
                    </div>
                  </div>

                  {job.analysis_notes && (
                    <p style={{
                      fontSize: 12, color: 'var(--text2)', lineHeight: 1.7,
                      margin: '0 0 14px', padding: '12px 14px',
                      background: 'var(--bg3)', borderRadius: 'var(--r)',
                      border: '0.5px solid var(--border)',
                    }}>
                      {job.analysis_notes}
                    </p>
                  )}

                  {(job.strong_keywords?.length || job.weak_keywords?.length) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {job.strong_keywords?.map(kw => (
                        <span key={kw} style={{
                          fontSize: 11, padding: '3px 9px', borderRadius: 20,
                          background: 'var(--purple-dim)', color: 'var(--purple)', fontWeight: 500,
                        }}>✓ {kw}</span>
                      ))}
                      {job.weak_keywords?.map(kw => (
                        <span key={kw} style={{
                          fontSize: 11, padding: '3px 9px', borderRadius: 20,
                          background: 'rgba(248,113,113,0.08)', color: 'var(--red)', fontWeight: 500,
                        }}>✗ {kw}</span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  padding: '24px', textAlign: 'center',
                  color: 'var(--text4)', fontSize: 12, marginBottom: 16,
                }}>
                  Sem análise ainda. Cole a descrição na aba Vaga e clique em Analisar.
                </div>
              )}

              <button
                onClick={analyze}
                disabled={analyzing || !job.job_description?.trim()}
                style={{
                  width: '100%', padding: '10px 0',
                  background: analyzing ? 'var(--bg3)' : 'var(--purple-dim)',
                  border: '0.5px solid var(--purple)',
                  borderRadius: 'var(--rsm)',
                  cursor: analyzing || !job.job_description?.trim() ? 'not-allowed' : 'pointer',
                  color: analyzing ? 'var(--text3)' : 'var(--purple)',
                  fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)',
                  opacity: !job.job_description?.trim() ? 0.4 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {analyzing ? 'Analisando...' : job.fit_score !== null ? '↺ Re-analisar com IA' : '✦ Analisar com IA'}
              </button>

              <div style={{ marginTop: 16 }}>
                <a
                  href={`/chat?context=cv&job=${job.id}`}
                  style={{
                    display: 'block', width: '100%', padding: '9px 0', textAlign: 'center',
                    background: 'var(--bg3)', border: '0.5px solid var(--border)',
                    borderRadius: 'var(--rsm)', cursor: 'pointer',
                    color: 'var(--text3)', fontSize: 12, fontWeight: 500,
                    textDecoration: 'none', boxSizing: 'border-box',
                  }}
                >
                  ✦ Customizar CV para esta vaga
                </a>
              </div>
            </>
          )}

          {/* ── PREP ── */}
          {tab === 'prep' && job.status === 'interviewing' && (
            <InterviewPrepSection
              job={job}
              onPrepGenerated={prep => {
                setJob(j => ({ ...j, interview_prep: prep }))
                onUpdate({ ...job, interview_prep: prep })
              }}
            />
          )}

          {/* ── NOTAS ── */}
          {tab === 'notas' && (
            <>
              {/* Recrutador */}
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--text4)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
                }}>
                  Recrutador
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                  <input
                    value={job.recruiter_name ?? ''}
                    onChange={e => patch({ recruiter_name: e.target.value })}
                    placeholder="Nome"
                    style={{ ...fieldStyle, flex: 1 }}
                  />
                  <input
                    value={job.recruiter_linkedin ?? ''}
                    onChange={e => patch({ recruiter_linkedin: e.target.value })}
                    placeholder="LinkedIn URL"
                    style={{ ...fieldStyle, flex: 1.4 }}
                  />
                </div>
                {job.recruiter_linkedin && (
                  <a
                    href={job.recruiter_linkedin.startsWith('http') ? job.recruiter_linkedin : `https://${job.recruiter_linkedin}`}
                    target="_blank" rel="noreferrer"
                    style={{ fontSize: 11, color: '#60a5fa', textDecoration: 'none' }}
                  >
                    ↗ Ver no LinkedIn
                  </a>
                )}
              </div>

              {/* Data de aplicação */}
              {showAppliedDate && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: 'var(--text4)',
                    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
                  }}>
                    Data de aplicação
                  </div>
                  <input
                    type="date"
                    value={job.applied_at ?? ''}
                    onChange={e => patch({ applied_at: e.target.value })}
                    style={fieldStyle}
                  />
                </div>
              )}

              {/* Cover note */}
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--text4)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
                }}>
                  Cover note
                </div>
                <textarea
                  value={job.cover_note ?? ''}
                  onChange={e => patch({ cover_note: e.target.value })}
                  placeholder="Mensagem de candidatura..."
                  rows={4}
                  style={{ ...fieldStyle, resize: 'vertical' }}
                />
              </div>

              {/* Interview notes */}
              <div>
                <div style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--text4)',
                  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
                }}>
                  Notas de entrevista
                </div>
                <textarea
                  value={job.interview_notes ?? ''}
                  onChange={e => patch({ interview_notes: e.target.value })}
                  placeholder="O que aconteceu, próximos passos..."
                  rows={5}
                  style={{ ...fieldStyle, resize: 'vertical' }}
                />
              </div>
            </>
          )}

          {/* ── HISTÓRICO ── */}
          {tab === 'historico' && (
            <StatusTimeline log={job.status_log} createdAt={job.created_at} />
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: '12px 20px', borderTop: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, gap: 8,
        }}>
          <button
            onClick={handleArchive}
            disabled={archiving}
            style={{
              padding: '7px 12px', background: 'none',
              border: '0.5px solid var(--border)', borderRadius: 'var(--rsm)',
              cursor: 'pointer', color: 'var(--text4)', fontSize: 11,
              fontFamily: 'var(--font)',
            }}
          >
            {archiving ? 'Arquivando...' : 'Arquivar'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {dirty && (
              <span style={{ fontSize: 11, color: 'var(--text4)' }}>não salvo</span>
            )}
            <button
              onClick={save}
              disabled={!dirty || saving}
              style={{
                padding: '7px 18px', background: dirty ? 'var(--accent)' : 'var(--bg3)',
                border: 'none', borderRadius: 'var(--rsm)', cursor: dirty ? 'pointer' : 'default',
                color: dirty ? 'var(--accent-text)' : 'var(--text4)',
                fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)',
                transition: 'all 0.15s',
              }}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
