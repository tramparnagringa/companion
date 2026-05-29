'use client'

import { useState, useEffect, useRef } from 'react'
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
  { id: 'to_analyse',   label: 'Analisar',    color: 'var(--tng-ink-3)' },
  { id: 'analysing',    label: 'Analisando',  color: 'var(--tng-purple-700)' },
  { id: 'applied',      label: 'Aplicado',    color: 'var(--tng-info)' },
  { id: 'interviewing', label: 'Entrevista',  color: 'var(--tng-warn)' },
  { id: 'offer',        label: 'Oferta',      color: 'var(--tng-success)' },
  { id: 'discarded',    label: 'Descartado',  color: 'var(--tng-danger)' },
]

const STATUS_META: Record<string, { label: string; color: string }> = Object.fromEntries(
  STATUSES.map(s => [s.id, { label: s.label, color: s.color }])
)

function fitColor(score: number | null): string {
  if (!score) return 'var(--tng-mute)'
  if (score >= 80) return 'var(--tng-success)'
  if (score >= 60) return 'var(--tng-warn)'
  return 'var(--tng-danger)'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
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
  return formatDate(iso)
}

// ─── Section label ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: 'var(--tng-ink-3)',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      fontFamily: 'var(--tng-font-mono)',
      marginBottom: 10,
    }}>
      {children}
    </div>
  )
}

// ─── Field styles ─────────────────────────────────────────────────────────────

const fieldStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--tng-cream)',
  border: '0.5px solid var(--tng-rule)',
  borderRadius: 'var(--tng-radius-xs)',
  padding: '10px 14px',
  fontFamily: 'var(--tng-font-body)',
  fontSize: 15,
  color: 'var(--tng-ink)',
  outline: 'none',
  boxSizing: 'border-box',
}

// ─── Status dropdown badge ─────────────────────────────────────────────────────

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
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 'var(--tng-radius-pill)',
          background: 'var(--tng-paper)',
          border: `1px solid ${current.color}`,
          cursor: 'pointer', fontFamily: 'var(--tng-font-body)',
          fontSize: 12, fontWeight: 600, color: current.color,
        }}
      >
        {current.label}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 4l3 3 3-3" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          background: 'var(--tng-paper)',
          border: '0.5px solid var(--tng-rule)',
          borderRadius: 'var(--tng-radius-sm)', padding: 4, zIndex: 10,
          minWidth: 150,
          boxShadow: '0 4px 20px rgba(20,15,8,0.12)',
        }}>
          {STATUSES.map(s => (
            <button
              key={s.id}
              onClick={() => { onChange(s.id); setOpen(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '7px 12px',
                background: s.id === status ? 'var(--tng-bone)' : 'none',
                border: 'none', borderRadius: 'var(--tng-radius-xs)',
                cursor: 'pointer',
                fontFamily: 'var(--tng-font-body)', fontSize: 12,
                fontWeight: s.id === status ? 600 : 400,
                color: s.color,
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

// ─── Status timeline ──────────────────────────────────────────────────────────

function StatusTimeline({ log, createdAt }: { log: StatusLogEntry[] | null; createdAt: string }) {
  type Ev = { label: string; at: string; color: string; note?: string }
  const events: Ev[] = [
    { label: 'Vaga adicionada', at: createdAt, color: 'var(--tng-mute)' },
    ...(log ?? []).map(e => ({
      label: `→ ${STATUS_META[e.to]?.label ?? e.to}`,
      at: e.at,
      color: STATUS_META[e.to]?.color ?? 'var(--tng-ink-3)',
      note: e.note,
    })),
  ]

  return (
    <div style={{ position: 'relative', paddingLeft: 18 }}>
      <div style={{
        position: 'absolute', left: 6, top: 8, bottom: 8,
        width: '0.5px', background: 'var(--tng-rule)',
      }} />
      {events.map((ev, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          marginBottom: i < events.length - 1 ? 16 : 0,
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', left: -12, top: 5,
            width: 8, height: 8, borderRadius: '50%',
            background: ev.color,
            flexShrink: 0,
          }} />
          <div>
            <span style={{ fontSize: 13, color: ev.color, fontWeight: 600 }}>{ev.label}</span>
            {ev.note && (
              <span style={{ fontSize: 12, color: 'var(--tng-mute)', marginLeft: 8 }}>{ev.note}</span>
            )}
            <div style={{
              fontSize: 11, color: 'var(--tng-mute)',
              fontFamily: 'var(--tng-font-mono)', marginTop: 2,
            }}>
              {formatRelative(ev.at)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Interview prep ───────────────────────────────────────────────────────────

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

  if (!prep) {
    return (
      <button
        onClick={generate}
        disabled={loading}
        style={{
          width: '100%', padding: '12px 0',
          background: 'var(--tng-purple-100)',
          border: '0.5px solid var(--tng-purple-300)',
          borderRadius: 'var(--tng-radius-sm)',
          cursor: loading ? 'not-allowed' : 'pointer',
          color: 'var(--tng-purple-700)', fontSize: 13, fontWeight: 600,
          fontFamily: 'var(--tng-font-body)',
        }}
      >
        {loading ? '✦ Pesquisando empresa e preparando...' : '✦ Gerar prep de entrevista com IA'}
      </button>
    )
  }

  const chipColor = (color: string): React.CSSProperties => ({
    fontSize: 11, padding: '3px 10px', borderRadius: 'var(--tng-radius-pill)',
    fontWeight: 600, display: 'inline-block', marginRight: 5, marginBottom: 5,
    fontFamily: 'var(--tng-font-mono)',
    background: `color-mix(in srgb, ${color} 12%, transparent)`,
    color,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Company info */}
      <div style={{
        background: 'var(--tng-cream)', borderRadius: 'var(--tng-radius-sm)',
        padding: '14px 16px', border: '0.5px solid var(--tng-rule)',
      }}>
        <Label>Sobre a empresa</Label>
        <p style={{ fontSize: 13, color: 'var(--tng-ink-2)', lineHeight: 1.6, margin: '0 0 10px' }}>
          {prep.company_info.about}
        </p>
        {prep.company_info.recent_news.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {prep.company_info.recent_news.map((n, i) => (
              <li key={i} style={{ fontSize: 12, color: 'var(--tng-ink-3)', marginBottom: 4, lineHeight: 1.5 }}>{n}</li>
            ))}
          </ul>
        )}
      </div>

      {prep.company_info.culture.length > 0 && (
        <div>
          <Label>Cultura</Label>
          <div>{prep.company_info.culture.map((c, i) => (
            <span key={i} style={chipColor('var(--tng-info)')}>{c}</span>
          ))}</div>
        </div>
      )}

      {(prep.strengths.length > 0 || prep.gaps.length > 0) && (
        <div>
          <Label>Seu fit</Label>
          <div>
            {prep.strengths.map((s, i) => <span key={i} style={chipColor('var(--tng-success)')}>✓ {s}</span>)}
            {prep.gaps.map((g, i) => <span key={i} style={chipColor('var(--tng-warn)')}>△ {g}</span>)}
          </div>
        </div>
      )}

      {prep.likely_questions.length > 0 && (
        <div>
          <Label>Perguntas prováveis</Label>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {prep.likely_questions.map((q, i) => (
              <li key={i} style={{ fontSize: 13, color: 'var(--tng-ink-2)', marginBottom: 6, lineHeight: 1.5 }}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {prep.tips.length > 0 && (
        <div>
          <Label>Dicas</Label>
          <ul style={{ margin: 0, paddingLeft: 16 }}>
            {prep.tips.map((t, i) => (
              <li key={i} style={{ fontSize: 13, color: 'var(--tng-ink-2)', marginBottom: 6, lineHeight: 1.5 }}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={generate}
        disabled={loading}
        style={{
          alignSelf: 'flex-start', padding: '7px 14px',
          background: 'none', border: '0.5px solid var(--tng-rule)',
          borderRadius: 'var(--tng-radius-xs)',
          color: 'var(--tng-ink-3)', fontSize: 12, cursor: 'pointer',
          fontFamily: 'var(--tng-font-body)',
        }}
      >
        {loading ? 'Atualizando...' : '↺ Atualizar prep'}
      </button>
    </div>
  )
}

// ─── Analysis skeleton ───────────────────────────────────────────────────────

const PULSE_STYLE = `
  @keyframes tng-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.35; }
  }
  .tng-skel {
    background: var(--tng-bone);
    border-radius: 6px;
    animation: tng-pulse 1.6s ease-in-out infinite;
  }
`

function AnalysisSkeleton() {
  return (
    <>
      <style>{PULSE_STYLE}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Prose lines */}
        {[96, 88, 92, 78, 60].map((w, i) => (
          <div key={i} className="tng-skel" style={{
            height: 18, width: `${w}%`,
            animationDelay: `${i * 0.08}s`,
          }} />
        ))}
        {/* Keywords section */}
        <div style={{ marginTop: 24 }}>
          <div className="tng-skel" style={{ height: 11, width: 80, marginBottom: 14, animationDelay: '0.44s' }} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[90, 118, 72, 130, 85, 100, 68].map((w, i) => (
              <div key={i} className="tng-skel" style={{
                height: 28, width: w, borderRadius: 14,
                animationDelay: `${0.5 + i * 0.06}s`,
              }} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

type Tab = 'vaga' | 'analise' | 'prep' | 'notas' | 'historico'

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  vaga: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="1" width="10" height="13" rx="1.5"/>
      <line x1="5" y1="4.5" x2="10" y2="4.5"/><line x1="5" y1="7.5" x2="10" y2="7.5"/><line x1="5" y1="10.5" x2="8" y2="10.5"/>
    </svg>
  ),
  analise: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.5 1.5 L9.2 5.8 L13.5 7.5 L9.2 9.2 L7.5 13.5 L5.8 9.2 L1.5 7.5 L5.8 5.8 Z"/>
    </svg>
  ),
  prep: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7.5" cy="7.5" r="5.5"/>
      <circle cx="7.5" cy="7.5" r="2.5"/>
      <circle cx="7.5" cy="7.5" r="0.8" fill="currentColor" stroke="none"/>
    </svg>
  ),
  notas: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 1.5 L13.5 4.5 L5 13 L2 13 L2 10 Z"/>
      <line x1="8.5" y1="3.5" x2="11.5" y2="6.5"/>
    </svg>
  ),
  historico: (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7.5" cy="7.5" r="5.5"/>
      <polyline points="7.5,4.5 7.5,7.5 9.5,9.5" strokeLinejoin="round"/>
    </svg>
  ),
}

function TabBar({ tabs, active, onChange }: {
  tabs: { id: Tab; label: string }[]
  active: Tab
  onChange: (t: Tab) => void
}) {
  return (
    <div style={{
      display: 'flex', gap: 0,
      borderBottom: '0.5px solid var(--tng-rule)',
      flexShrink: 0, overflowX: 'auto',
      padding: '0 24px',
    }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: '12px 14px', background: 'none', border: 'none',
            borderBottom: active === t.id
              ? '2px solid var(--tng-purple-700)'
              : '2px solid transparent',
            color: active === t.id ? 'var(--tng-ink)' : 'var(--tng-ink-3)',
            fontSize: 12, fontWeight: active === t.id ? 600 : 400,
            cursor: 'pointer', fontFamily: 'var(--tng-font-body)',
            whiteSpace: 'nowrap', marginBottom: -1,
            transition: 'color 120ms, border-color 120ms',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function JobDetail({ job: initialJob, onClose, onUpdate, onArchive }: {
  job: Job
  onClose: () => void
  onUpdate: (job: Job) => void
  onArchive: (jobId: string) => void
}) {
  const [job, setJob]         = useState<Job>(initialJob)
  const [dirty, setDirty]     = useState(false)
  const [saving, setSaving]   = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [tab, setTab]         = useState<Tab>('vaga')
  const [visible, setVisible] = useState(false)

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  useEffect(() => { setJob(initialJob); setDirty(false) }, [initialJob.id])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function patch(fields: Partial<Job>) {
    setJob(prev => ({ ...prev, ...fields }))
    setDirty(true)
  }

  async function changeStatus(newStatus: JobStatus) {
    const prev = job
    setJob(j => ({ ...j, status: newStatus }))
    try {
      const saved = await updateJob(job.id, { status: newStatus })
      setJob(j => ({ ...j, status_log: (saved as unknown as Job).status_log }))
      onUpdate({ ...job, status: newStatus, status_log: (saved as unknown as Job).status_log })
    } catch {
      setJob(prev)
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
        company_name:       job.company_name,
        role_title:         job.role_title,
        status:             job.status as JobStatus,
        source_url:         job.source_url ?? undefined,
        job_description:    job.job_description ?? undefined,
        applied_at:         job.applied_at ?? undefined,
        interview_notes:    job.interview_notes ?? undefined,
        cover_note:         job.cover_note ?? undefined,
        recruiter_name:     job.recruiter_name ?? undefined,
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
      if (updated) { setJob(updated); onUpdate(updated); setDirty(false) }
    } finally {
      setAnalyzing(false)
    }
  }

  const accentColor = STATUS_META[job.status]?.color ?? 'var(--tng-ink-3)'
  const showAppliedDate = ['applied', 'interviewing', 'offer'].includes(job.status)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'vaga',      label: 'Vaga' },
    { id: 'analise',   label: job.fit_score !== null ? `Análise · ${job.fit_score}%` : 'Análise' },
    ...(job.status === 'interviewing' ? [{ id: 'prep' as Tab, label: 'Prep entrevista' }] : []),
    { id: 'notas',     label: 'Notas' },
    { id: 'historico', label: 'Histórico' },
  ]
  const activeTab = tabs.find(t => t.id === tab) ? tab : 'vaga'

  return (
    <>
      {/* Backdrop — z:60 covers sidebar (z:49 desktop, z:51 mobile) */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(20, 15, 8, 0.45)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity var(--tng-dur-base) ease',
        }}
      />

      {/* Drawer — slides in from the right */}
      <div style={{
        position: 'fixed', zIndex: 61,
        right: 0, top: 0,
        width: 'min(1060px, 96vw)',
        height: '100dvh',
        background: 'var(--tng-paper)',
        borderLeft: '0.5px solid var(--tng-rule)',
        borderRadius: 'var(--tng-radius-lg) 0 0 var(--tng-radius-lg)',
        boxShadow: '-8px 0 40px rgba(20,15,8,0.18)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform var(--tng-dur-slow) var(--tng-ease-out)',
      }}>

        {/* ── Topbar interno ─────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '0 20px', height: 60, flexShrink: 0,
          background: 'var(--tng-cream)',
          borderBottom: '0.5px solid var(--tng-rule)',
        }}>
          {/* Status dot */}
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: accentColor, flexShrink: 0,
          }} />

          {/* Company · Role */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: 6, overflow: 'hidden' }}>
            <span style={{
              fontSize: 18, fontWeight: 700, color: 'var(--tng-ink)',
              fontFamily: 'var(--tng-font-display)', letterSpacing: '-0.02em',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {job.company_name || 'Empresa'}
            </span>
            <span style={{ color: 'var(--tng-ink-3)', fontSize: 15, flexShrink: 0 }}>·</span>
            <span style={{
              fontSize: 15, color: 'var(--tng-ink-2)',
              fontFamily: 'var(--tng-font-body)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {job.role_title || 'Cargo'}
            </span>
          </div>

          {/* Status badge */}
          <StatusBadge status={job.status} onChange={changeStatus} />

          {/* Save indicator */}
          {dirty && (
            <span style={{
              fontSize: 10, color: 'var(--tng-warn)',
              fontFamily: 'var(--tng-font-mono)', flexShrink: 0,
            }}>
              ● não salvo
            </span>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 'var(--tng-radius-xs)',
              background: 'var(--tng-bone)', border: '0.5px solid var(--tng-rule)',
              cursor: 'pointer', color: 'var(--tng-ink-3)', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Body: meta panel + content ─────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ── Left: meta panel ─────────────────────────────────────────── */}
          <div style={{
            width: 300, flexShrink: 0,
            background: 'var(--tng-cream)',
            borderRight: '0.5px solid var(--tng-rule)',
            display: 'flex', flexDirection: 'column',
            padding: '28px 24px',
            overflowY: 'auto',
          }}>
            {/* Company name (editable) */}
            <input
              value={job.company_name}
              onChange={e => patch({ company_name: e.target.value })}
              placeholder="Empresa"
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: 28, fontWeight: 700, color: 'var(--tng-ink)',
                fontFamily: 'var(--tng-font-display)', letterSpacing: '-0.03em',
                lineHeight: 1.1, width: '100%', padding: 0, marginBottom: 6,
              }}
            />

            {/* Role title (editable) */}
            <input
              value={job.role_title}
              onChange={e => patch({ role_title: e.target.value })}
              placeholder="Cargo"
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                fontSize: 15, color: 'var(--tng-ink-2)',
                fontFamily: 'var(--tng-font-body)',
                width: '100%', padding: 0, marginBottom: 22,
              }}
            />

          {/* Fit score */}
          {job.fit_score !== null && (
            <div style={{
              marginBottom: 20, padding: '14px 16px',
              background: 'var(--tng-paper)', borderRadius: 'var(--tng-radius-sm)',
              border: '0.5px solid var(--tng-rule)',
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                <span style={{
                  fontSize: 48, fontWeight: 700, fontFamily: 'var(--tng-font-mono)',
                  color: fitColor(job.fit_score), lineHeight: 1,
                }}>
                  {job.fit_score}%
                </span>
                <span style={{ fontSize: 11, color: 'var(--tng-mute)', fontFamily: 'var(--tng-font-mono)', marginTop: 4 }}>fit score</span>
              </div>
              <div style={{ height: 4, background: 'var(--tng-rule)', borderRadius: 2 }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: `${job.fit_score}%`,
                  background: fitColor(job.fit_score),
                  transition: 'width 400ms var(--tng-ease-out)',
                }} />
              </div>
              {job.apply_recommendation !== null && (
                <div style={{
                  marginTop: 8, fontSize: 11, fontWeight: 600,
                  color: job.apply_recommendation ? 'var(--tng-success)' : 'var(--tng-danger)',
                }}>
                  {job.apply_recommendation ? '✓ Recomendado aplicar' : '✗ Não recomendado'}
                </div>
              )}
            </div>
          )}

          {/* Keywords preview */}
          {(job.strong_keywords?.length || job.weak_keywords?.length) && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {job.strong_keywords?.slice(0, 4).map(kw => (
                  <span key={kw} style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 'var(--tng-radius-pill)',
                    background: 'var(--tng-purple-100)', color: 'var(--tng-purple-700)',
                    fontWeight: 600, fontFamily: 'var(--tng-font-mono)',
                    border: '0.5px solid var(--tng-purple-300)',
                  }}>{kw}</span>
                ))}
                {job.weak_keywords?.slice(0, 2).map(kw => (
                  <span key={kw} style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 'var(--tng-radius-pill)',
                    background: 'rgba(255,107,53,0.08)', color: 'var(--tng-coral-text)',
                    fontWeight: 600, fontFamily: 'var(--tng-font-mono)',
                    border: '0.5px solid rgba(255,107,53,0.2)',
                  }}>{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* Preparar para entrevista — sempre visível */}
          <a
            href={`/chat?mode=mentor&jobId=${job.id}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '11px 0',
              background: 'var(--tng-purple-100)', border: '0.5px solid var(--tng-purple-300)',
              borderRadius: 'var(--tng-radius-sm)',
              color: 'var(--tng-purple-700)', fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
              fontFamily: 'var(--tng-font-body)',
              marginBottom: 20,
              transition: 'background 150ms, border-color 150ms',
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLElement).style.background = 'color-mix(in srgb, var(--tng-purple-300) 25%, transparent)'
              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--tng-purple-700)'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLElement).style.background = 'var(--tng-purple-100)'
              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--tng-purple-300)'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="7.5" cy="7.5" r="5.5"/>
              <circle cx="7.5" cy="7.5" r="2.5"/>
              <circle cx="7.5" cy="7.5" r="0.8" fill="currentColor" stroke="none"/>
            </svg>
            Preparar para entrevista
          </a>

          {/* Meta info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 'auto' }}>
            {job.source_url && (
              <a
                href={job.source_url}
                target="_blank" rel="noreferrer"
                style={{
                  fontSize: 12, color: 'var(--tng-purple-700)',
                  textDecoration: 'none', fontFamily: 'var(--tng-font-body)',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                ↗ Ver vaga original
              </a>
            )}
            {showAppliedDate && job.applied_at && (
              <div style={{ fontSize: 11, color: 'var(--tng-ink-3)', fontFamily: 'var(--tng-font-mono)' }}>
                aplicado em {formatDate(job.applied_at)}
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--tng-mute)', fontFamily: 'var(--tng-font-mono)' }}>
              adicionada {formatRelative(job.created_at)}
            </div>
          </div>

          {/* Archive */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '0.5px solid var(--tng-rule)' }}>
            <button
              onClick={handleArchive}
              disabled={archiving}
              style={{
                width: '100%', padding: '8px 0',
                background: 'none', border: '0.5px solid var(--tng-rule)',
                borderRadius: 'var(--tng-radius-xs)',
                cursor: 'pointer', color: 'var(--tng-ink-3)', fontSize: 12,
                fontFamily: 'var(--tng-font-body)',
                transition: 'border-color 120ms, color 120ms',
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--tng-danger)'
                ;(e.currentTarget as HTMLElement).style.color = 'var(--tng-danger)'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--tng-rule)'
                ;(e.currentTarget as HTMLElement).style.color = 'var(--tng-ink-3)'
              }}
            >
              {archiving ? 'Arquivando...' : 'Arquivar vaga'}
            </button>
          </div>
        </div>

        {/* ── Right: tabs + content ─────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Tab bar — pill style */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '0 24px', height: 68, flexShrink: 0,
            borderBottom: '0.5px solid var(--tng-rule)',
            overflowX: 'auto',
          }}>
            {tabs.map(t => {
              const isActive = activeTab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as Tab)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 18px',
                    background: isActive ? 'var(--tng-bone)' : 'transparent',
                    border: `0.5px solid ${isActive ? 'var(--tng-rule)' : 'transparent'}`,
                    borderRadius: 'var(--tng-radius-pill)',
                    cursor: 'pointer',
                    color: isActive ? 'var(--tng-ink)' : 'var(--tng-ink-3)',
                    fontSize: 15, fontWeight: isActive ? 600 : 400,
                    fontFamily: 'var(--tng-font-body)',
                    whiteSpace: 'nowrap',
                    transition: 'all 150ms ease',
                    flexShrink: 0,
                    opacity: isActive ? 1 : 0.7,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    {TAB_ICONS[t.id as Tab]}
                  </span>
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>

            {/* ── VAGA ── */}
            {activeTab === 'vaga' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={job.source_url ?? ''}
                    onChange={e => patch({ source_url: e.target.value })}
                    placeholder="URL da vaga"
                    style={{ ...fieldStyle, flex: 1 }}
                  />
                  {job.source_url && (
                    <a
                      href={job.source_url}
                      target="_blank" rel="noreferrer"
                      style={{
                        padding: '8px 12px', background: 'var(--tng-cream)',
                        border: '0.5px solid var(--tng-rule)',
                        borderRadius: 'var(--tng-radius-xs)',
                        color: 'var(--tng-ink-2)', fontSize: 12,
                        textDecoration: 'none',
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
                  style={{
                    ...fieldStyle, resize: 'vertical',
                    lineHeight: 1.7, minHeight: 360,
                    fontSize: 13,
                  }}
                />
              </div>
            )}

            {/* ── ANÁLISE ── */}
            {activeTab === 'analise' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Loading skeleton */}
                {analyzing && <AnalysisSkeleton />}

                {/* Empty state */}
                {!analyzing && job.fit_score === null && (
                  <div style={{
                    padding: '48px 32px', textAlign: 'center',
                    background: 'var(--tng-cream)', borderRadius: 'var(--tng-radius-md)',
                    border: '0.5px dashed var(--tng-rule)',
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 14, opacity: 0.4 }}>✦</div>
                    <div style={{ fontSize: 15, color: 'var(--tng-ink-2)', fontWeight: 600 }}>
                      Nenhuma análise ainda
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--tng-mute)', marginTop: 6, lineHeight: 1.5 }}>
                      Cole a descrição na aba <strong>Vaga</strong> e clique em Analisar com IA
                    </div>
                  </div>
                )}

                {/* Analysis prose */}
                {!analyzing && job.analysis_notes && (
                  <div style={{
                    fontSize: 15, color: 'var(--tng-ink-2)', lineHeight: 1.8,
                  }}>
                    {job.analysis_notes}
                  </div>
                )}

                {/* Keywords */}
                {!analyzing && (job.strong_keywords?.length || job.weak_keywords?.length) && (
                  <div>
                    <Label>Keywords</Label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {job.strong_keywords?.map(kw => (
                        <span key={kw} style={{
                          fontSize: 12, padding: '5px 12px', borderRadius: 'var(--tng-radius-pill)',
                          background: 'var(--tng-purple-100)', color: 'var(--tng-purple-700)',
                          fontWeight: 600, fontFamily: 'var(--tng-font-mono)',
                          border: '0.5px solid var(--tng-purple-300)',
                        }}>✓ {kw}</span>
                      ))}
                      {job.weak_keywords?.map(kw => (
                        <span key={kw} style={{
                          fontSize: 12, padding: '5px 12px', borderRadius: 'var(--tng-radius-pill)',
                          background: 'rgba(200,68,43,0.08)', color: 'var(--tng-danger)',
                          fontWeight: 600, fontFamily: 'var(--tng-font-mono)',
                          border: '0.5px solid rgba(200,68,43,0.2)',
                        }}>✗ {kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {!analyzing && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button
                      onClick={analyze}
                      disabled={!job.job_description?.trim()}
                      style={{
                        padding: '13px 0',
                        background: 'var(--tng-purple-100)',
                        border: '0.5px solid var(--tng-purple-300)',
                        borderRadius: 'var(--tng-radius-sm)',
                        cursor: !job.job_description?.trim() ? 'not-allowed' : 'pointer',
                        color: 'var(--tng-purple-700)',
                        fontSize: 14, fontWeight: 600, fontFamily: 'var(--tng-font-body)',
                        opacity: !job.job_description?.trim() ? 0.4 : 1,
                        transition: 'opacity 150ms',
                      }}
                    >
                      {job.fit_score !== null ? '↺ Re-analisar com IA' : '✦ Analisar com IA'}
                    </button>

                    <a
                      href={`/chat?context=cv&job=${job.id}`}
                      style={{
                        display: 'block', padding: '12px 0', textAlign: 'center',
                        background: 'var(--tng-cream)', border: '0.5px solid var(--tng-rule)',
                        borderRadius: 'var(--tng-radius-sm)',
                        color: 'var(--tng-ink-2)', fontSize: 14, fontWeight: 500,
                        textDecoration: 'none',
                      }}
                    >
                      ✦ Customizar CV para esta vaga
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* ── PREP ── */}
            {activeTab === 'prep' && job.status === 'interviewing' && (
              <InterviewPrepSection
                job={job}
                onPrepGenerated={prep => {
                  setJob(j => ({ ...j, interview_prep: prep }))
                  onUpdate({ ...job, interview_prep: prep })
                }}
              />
            )}

            {/* ── NOTAS ── */}
            {activeTab === 'notas' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                <div>
                  <Label>Recrutador</Label>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
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
                      style={{ ...fieldStyle, flex: 1.5 }}
                    />
                  </div>
                  {job.recruiter_linkedin && (
                    <a
                      href={job.recruiter_linkedin.startsWith('http') ? job.recruiter_linkedin : `https://${job.recruiter_linkedin}`}
                      target="_blank" rel="noreferrer"
                      style={{ fontSize: 12, color: 'var(--tng-purple-700)', textDecoration: 'none' }}
                    >
                      ↗ Ver no LinkedIn
                    </a>
                  )}
                </div>

                {showAppliedDate && (
                  <div>
                    <Label>Data de aplicação</Label>
                    <input
                      type="date"
                      value={job.applied_at ?? ''}
                      onChange={e => patch({ applied_at: e.target.value })}
                      style={fieldStyle}
                    />
                  </div>
                )}

                <div>
                  <Label>Cover note</Label>
                  <textarea
                    value={job.cover_note ?? ''}
                    onChange={e => patch({ cover_note: e.target.value })}
                    placeholder="Mensagem de candidatura..."
                    rows={5}
                    style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.6 }}
                  />
                </div>

                <div>
                  <Label>Notas de entrevista</Label>
                  <textarea
                    value={job.interview_notes ?? ''}
                    onChange={e => patch({ interview_notes: e.target.value })}
                    placeholder="O que aconteceu, próximos passos..."
                    rows={6}
                    style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.6 }}
                  />
                </div>
              </div>
            )}

            {/* ── HISTÓRICO ── */}
            {activeTab === 'historico' && (
              <StatusTimeline log={job.status_log} createdAt={job.created_at} />
            )}

          </div>

          {/* Footer: save */}
          <div style={{
            padding: '14px 24px',
            borderTop: '0.5px solid var(--tng-rule)',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            gap: 12, flexShrink: 0,
          }}>
            {dirty && (
              <span style={{ fontSize: 12, color: 'var(--tng-mute)', fontFamily: 'var(--tng-font-mono)' }}>
                não salvo
              </span>
            )}
            <button
              onClick={save}
              disabled={!dirty || saving}
              style={{
                padding: '8px 22px',
                background: dirty ? 'var(--tng-purple-700)' : 'var(--tng-bone)',
                border: 'none', borderRadius: 'var(--tng-radius-xs)',
                cursor: dirty ? 'pointer' : 'default',
                color: dirty ? 'var(--tng-cream)' : 'var(--tng-mute)',
                fontSize: 13, fontWeight: 600, fontFamily: 'var(--tng-font-body)',
                transition: 'background 150ms, color 150ms',
              }}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>

        </div>
      </div>
    </div>
    </>
  )
}
