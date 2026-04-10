'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { UserCard } from '@/components/layout/user-card'

// ── Types ────────────────────────────────────────────────────────────────────

export interface StudentSummary {
  id: string
  name: string | null
  role: string
  currentDay: number
  lastActivityAt: string | null
  health: 'green' | 'yellow' | 'red'
}

interface Dossier {
  id: string
  name: string | null
  role: string
  currentDay: number
  completedCount: number
  lastActivityAt: string | null
  health: 'green' | 'yellow' | 'red'
  target: {
    role: string | null
    seniority: string | null
    stack: string[]
    regions: string[]
    workPreference: string | null
    salaryMin: number | null
    salaryMax: number | null
    salaryCurrency: string
  }
  pipeline: { total: number; applied: number; interviewing: number; offers: number }
  tokens: { remaining: number; total: number; expiresAt: string | null }
  vulnerabilities: string[]
  valueProp: string | null
  lastMentorSession: string | null
}

interface Message {
  role: 'user' | 'assistant' | 'note'
  content: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return 'nunca'
  const h = (Date.now() - new Date(iso).getTime()) / 3_600_000
  if (h < 1)  return 'agora'
  if (h < 24) return `${Math.round(h)}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M'
  if (n >= 1_000) return Math.round(n / 1_000) + 'k'
  return String(n)
}

function buildBriefing(d: Dossier): string {
  const lines: string[] = [`**Briefing — ${d.name ?? 'Aluno'}, Dia ${d.currentDay}/30.**`]

  if (d.health === 'red') {
    lines.push(`⚠ Inativo: ${timeAgo(d.lastActivityAt)}.`)
  } else if (d.health === 'yellow') {
    lines.push(`⚡ Ritmo desacelerou — ${timeAgo(d.lastActivityAt)}.`)
  } else {
    lines.push(`Ativo — ${timeAgo(d.lastActivityAt)}.`)
  }

  if (d.pipeline.interviewing > 0 || d.pipeline.offers > 0) {
    lines.push(`${d.pipeline.interviewing} entrevista${d.pipeline.interviewing !== 1 ? 's' : ''} ativa${d.pipeline.interviewing !== 1 ? 's' : ''}.${d.pipeline.offers > 0 ? ` ${d.pipeline.offers} oferta.` : ''}`)
  }

  if (d.vulnerabilities.length > 0) {
    lines.push(`Vulnerabilidades: ${d.vulnerabilities.join(', ')}.`)
  }

  lines.push(`Saldo: ${fmtTokens(d.tokens.remaining)} tokens.`)
  lines.push(`\n_Use os atalhos acima ou escreva diretamente._`)
  return lines.join('\n')
}

// Simple markdown → HTML (bold, italic, inline code only)
function mdToHtml(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code style="font-family:var(--mono);font-size:11px;background:var(--accent-dim);color:var(--accent);padding:1px 5px;border-radius:3px">$1</code>')
    .replace(/\n/g, '<br>')
}

// ── Dot ──────────────────────────────────────────────────────────────────────

const DOT_COLORS = { green: '#4ade80', yellow: '#fbbf24', red: '#f87171' }
const DOT_SHADOWS = { green: '0 0 5px #4ade80', yellow: '0 0 5px #fbbf24', red: '0 0 5px #f87171' }

// ── Main component ────────────────────────────────────────────────────────────

export function MentorWorkspace({
  students,
  currentUserRole,
  currentUser,
}: {
  students: StudentSummary[]
  currentUserRole: string
  currentUser?: User | null
}) {
  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [dossier, setDossier]         = useState<Dossier | null>(null)
  const [loadingDossier, setLoading]  = useState(false)
  const [histories, setHistories]     = useState<Record<string, Message[]>>({})
  const [input, setInput]             = useState('')
  const [streaming, setStreaming]     = useState(false)
  const [search, setSearch]           = useState('')
  const [noteMode, setNoteMode]       = useState(false)
  const [noteText, setNoteText]       = useState('')
  const [savingNote, setSavingNote]   = useState(false)
  const [enrollMode, setEnrollMode]   = useState(false)
  const [programs, setPrograms]       = useState<{ id: string; name: string; total_days: number }[]>([])
  const [enrolling, setEnrolling]     = useState<string | null>(null) // program_id being enrolled
  const [enrollMsg, setEnrollMsg]     = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const msgsRef   = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  const messages: Message[] = selectedId ? (histories[selectedId] ?? []) : []

  function scrollBottom() {
    setTimeout(() => msgsRef.current?.scrollTo({ top: msgsRef.current.scrollHeight, behavior: 'smooth' }), 60)
  }

  useEffect(() => { scrollBottom() }, [messages.length])

  const selectStudent = useCallback(async (id: string) => {
    if (id === selectedId) return
    setSelectedId(id)
    setNoteMode(false)
    setNoteText('')

    if (histories[id]) return // already loaded

    setLoading(true)
    try {
      const res  = await fetch(`/api/mentor/students/${id}`)
      const data = await res.json() as Dossier
      setDossier(data)
      setHistories(h => ({ ...h, [id]: [{ role: 'assistant', content: buildBriefing(data) }] }))
    } finally {
      setLoading(false)
    }
  }, [selectedId, histories])

  // Restore dossier when switching back to an already-loaded student
  useEffect(() => {
    if (!selectedId || !histories[selectedId]) return
    if (dossier?.id === selectedId) return
    fetch(`/api/mentor/students/${selectedId}`)
      .then(r => r.json())
      .then(setDossier)
      .catch(() => {})
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function sendMessage(text: string) {
    if (!selectedId || !text.trim() || streaming) return

    const userMsg: Message = { role: 'user', content: text }
    const history = [...messages, userMsg]
    setHistories(h => ({ ...h, [selectedId]: history }))
    setInput('')
    setStreaming(true)
    inputRef.current?.focus()

    const apiMessages = history
      .filter(m => m.role !== 'note')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    try {
      const res = await fetch('/api/mentor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, studentId: selectedId }),
      })

      const reader  = res.body!.getReader()
      const decoder = new TextDecoder()
      let text = ''
      const sid = selectedId

      setHistories(h => ({ ...h, [sid]: [...history, { role: 'assistant', content: '' }] }))

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ') || line === 'data: [DONE]') continue
          try {
            const ev = JSON.parse(line.slice(6))
            if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
              text += ev.delta.text
              setHistories(h => {
                const hist = [...(h[sid] ?? [])]
                hist[hist.length - 1] = { role: 'assistant', content: text }
                return { ...h, [sid]: hist }
              })
            }
          } catch {}
        }
      }
    } catch (err) {
      console.error('[mentor-workspace] chat error', err)
      setHistories(h => ({
        ...h,
        [selectedId]: [...history, { role: 'assistant', content: 'Erro de conexão. Tente novamente.' }],
      }))
    } finally {
      setStreaming(false)
    }
  }

  async function saveNote() {
    if (!selectedId || !noteText.trim()) return
    setSavingNote(true)
    try {
      await fetch('/api/mentor/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: selectedId, note: noteText }),
      })
      setHistories(h => ({
        ...h,
        [selectedId]: [...(h[selectedId] ?? []), { role: 'note', content: noteText }],
      }))
      setNoteText('')
      setNoteMode(false)
    } finally {
      setSavingNote(false)
    }
  }

  function quickAction(text: string) {
    setNoteMode(false)
    setEnrollMode(false)
    sendMessage(text)
  }

  async function openEnroll() {
    setNoteMode(false)
    setEnrollMsg(null)
    const next = !enrollMode
    setEnrollMode(next)
    if (next && programs.length === 0) {
      const res = await fetch('/api/admin/programs')
      const data = await res.json()
      setPrograms((data as { id: string; name: string; total_days: number; is_published: boolean }[])
        .filter(p => p.is_published))
    }
  }

  async function enrollStudent(programId: string, programName: string) {
    if (!selectedId) return
    setEnrolling(programId)
    setEnrollMsg(null)
    try {
      const res = await fetch('/api/mentor/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: selectedId, program_id: programId }),
      })
      const data = await res.json()
      if (res.ok) {
        setEnrollMsg({ type: 'ok', text: `Enrollado em "${programName}".` })
        setEnrollMode(false)
      } else if (data.error === 'already_enrolled') {
        setEnrollMsg({ type: 'err', text: 'Aluno já está ativo neste programa.' })
      } else {
        setEnrollMsg({ type: 'err', text: data.error ?? 'Erro ao enrollar.' })
      }
    } finally {
      setEnrolling(null)
    }
  }

  // Group + filter students
  const q = search.toLowerCase()
  const filtered = (arr: StudentSummary[]) =>
    arr.filter(s => !q || (s.name ?? '').toLowerCase().includes(q) || s.role.toLowerCase().includes(q))

  const grouped = {
    red:    filtered(students.filter(s => s.health === 'red')),
    yellow: filtered(students.filter(s => s.health === 'yellow')),
    green:  filtered(students.filter(s => s.health === 'green')),
  }

  const sel = students.find(s => s.id === selectedId)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={`mentor-workspace${selectedId ? ' mentor-has-selection' : ''}`} style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── LEFT panels wrapper (student list + dossier) ─── */}
      <div className="mentor-panels-left" style={{ display: 'flex', overflow: 'hidden', flexShrink: 0 }}>

      {/* ── LEFT: student list ─────────────────────────────── */}
      <div className="mentor-panel-students" style={{
        width: 248, minWidth: 248,
        background: 'var(--bg2)', borderRight: '0.5px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 14px 12px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
          <div style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--purple)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 5, height: 5, background: 'var(--purple)', borderRadius: '50%', display: 'inline-block' }} />
              TNG Mentor
            </span>
          </div>
          {/* Search */}
          <div style={{
            background: 'var(--bg3)', border: '0.5px solid var(--border2)',
            borderRadius: 'var(--rsm)', padding: '6px 10px',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 12, height: 12, color: 'var(--text4)', flexShrink: 0 }}>
              <circle cx="7" cy="7" r="4.5" /><line x1="10.5" y1="10.5" x2="14" y2="14" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar aluno…"
              style={{
                background: 'none', border: 'none', outline: 'none',
                fontSize: 12, color: 'var(--text)', width: '100%',
              }}
            />
          </div>
        </div>

        {/* Student list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {(['red', 'yellow', 'green'] as const).map(h => {
            const group = grouped[h]
            if (!group.length) return null
            const labels = { red: 'EM RISCO', yellow: 'DESACELERANDO', green: 'ATIVOS' }
            const labelColors = { red: 'var(--red)', yellow: 'var(--yellow)', green: 'var(--green)' }
            return (
              <div key={h}>
                <div style={{
                  padding: '10px 14px 4px',
                  fontSize: 9, fontWeight: 600, letterSpacing: '.1em',
                  color: labelColors[h], textTransform: 'uppercase',
                }}>
                  {labels[h]} · {group.length}
                </div>
                {group.map(s => {
                  const isActive = s.id === selectedId
                  return (
                    <button
                      key={s.id}
                      onClick={() => selectStudent(s.id)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '8px 14px', cursor: 'pointer', border: 'none',
                        borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                        background: isActive ? 'rgba(228,253,139,.04)' : 'none',
                        transition: 'background .1s',
                      }}
                      className={isActive ? '' : 'mentor-student-row'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                          background: DOT_COLORS[s.health],
                          boxShadow: DOT_SHADOWS[s.health],
                        }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                          {s.name ?? 'Sem nome'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text4)', fontFamily: 'var(--mono)', paddingLeft: 12 }}>
                        Dia {s.currentDay} · {timeAgo(s.lastActivityAt)}
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          })}

          {students.length === 0 && (
            <div style={{ padding: '24px 14px', fontSize: 12, color: 'var(--text4)', textAlign: 'center' }}>
              Nenhum aluno cadastrado.
            </div>
          )}
        </div>
      </div>

      {/* ── MIDDLE: dossier ────────────────────────────────── */}
      <div className="mentor-panel-dossier" style={{
        width: 268, minWidth: 268,
        background: 'var(--bg2)', borderRight: '0.5px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {!selectedId ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text4)', textAlign: 'center', padding: 24 }}>
              Selecione um aluno
            </div>
          </div>
        ) : loadingDossier || !dossier ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text4)' }}>Carregando…</div>
          </div>
        ) : (
          <>
            <div style={{ padding: '16px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>
                {dossier.name ?? 'Sem nome'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                {dossier.target.role ?? dossier.role} · Dia {dossier.currentDay}/30
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>

              {/* Progresso */}
              <DossierSection label="Progresso">
                <DRow k="Dias completos" v={`${dossier.completedCount} / 30`} vc="var(--accent)" />
                <DRow k="Candidaturas" v={String(dossier.pipeline.total)} />
                <DRow k="Entrevistas ativas" v={String(dossier.pipeline.interviewing)} vc={dossier.pipeline.interviewing > 0 ? 'var(--yellow)' : undefined} />
                {dossier.lastMentorSession && <DRow k="Última sessão" v={timeAgo(dossier.lastMentorSession)} />}
              </DossierSection>

              {/* Pipeline mini-funnel */}
              <DossierSection label="Pipeline">
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 2 }}>
                  {dossier.pipeline.applied > 0 && (
                    <PipeTag label={`${dossier.pipeline.applied} aplicadas`} color="var(--blue)" />
                  )}
                  {dossier.pipeline.interviewing > 0 && (
                    <PipeTag label={`${dossier.pipeline.interviewing} entrevista`} color="var(--yellow)" />
                  )}
                  {dossier.pipeline.offers > 0 && (
                    <PipeTag label={`${dossier.pipeline.offers} oferta`} color="var(--green)" />
                  )}
                  {dossier.pipeline.applied === 0 && dossier.pipeline.total === 0 && (
                    <span style={{ fontSize: 12, color: 'var(--text4)' }}>Nenhuma candidatura ainda</span>
                  )}
                </div>
              </DossierSection>

              {/* Vulnerabilities */}
              {dossier.vulnerabilities.length > 0 && (
                <DossierSection label="Vulnerabilidades">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
                    {dossier.vulnerabilities.map((v, i) => (
                      <span key={i} style={{
                        fontSize: 11, padding: '3px 9px', borderRadius: 5, display: 'inline-block',
                        background: 'rgba(248,113,113,.08)',
                        border: '1px solid rgba(248,113,113,.2)',
                        color: 'var(--red)',
                      }}>
                        {v}
                      </span>
                    ))}
                  </div>
                </DossierSection>
              )}

              {/* Tokens */}
              <DossierSection label="Tokens">
                <DRow k="Saldo atual" v={fmtTokens(dossier.tokens.remaining)} vc="var(--accent)" />
                <DRow k="Consumido" v={fmtTokens(dossier.tokens.total - dossier.tokens.remaining)} />
                {dossier.tokens.expiresAt && (
                  <DRow k="Expira" v={new Date(dossier.tokens.expiresAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })} />
                )}
                <div style={{ marginTop: 7, height: 3, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2, transition: 'width .5s',
                    width: dossier.tokens.total > 0
                      ? `${Math.min(100, Math.round((dossier.tokens.remaining / dossier.tokens.total) * 100))}%`
                      : '0%',
                    background: 'var(--accent)',
                  }} />
                </div>
              </DossierSection>

              {/* Cargo-alvo */}
              {(dossier.target.role || dossier.target.stack.length > 0) && (
                <DossierSection label="Cargo-alvo">
                  {dossier.target.role && <DRow k="Role" v={dossier.target.role} />}
                  {dossier.target.stack.length > 0 && (
                    <DRow k="Stack" v={dossier.target.stack.slice(0, 4).join(' · ')} />
                  )}
                  {dossier.target.regions.length > 0 && (
                    <DRow k="Mercado" v={dossier.target.regions.join(', ')} />
                  )}
                  {dossier.target.salaryMin && (
                    <DRow
                      k="Pretensão"
                      v={`$${Math.round(dossier.target.salaryMin / 1000)}k–$${Math.round((dossier.target.salaryMax ?? 0) / 1000)}k`}
                      vc="var(--green)"
                    />
                  )}
                </DossierSection>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── end LEFT panels wrapper ─────────────────────────── */}
      </div>

      {/* ── RIGHT: chat ────────────────────────────────────── */}
      <div className="mentor-panel-chat" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{
          padding: '13px 18px', borderBottom: '0.5px solid var(--border)',
          background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Back button — mobile only */}
            <button
              onClick={() => setSelectedId(null)}
              className="mentor-mobile-back"
              style={{
                display: 'none', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 'var(--rsm)', background: 'none',
                border: '0.5px solid var(--border2)', cursor: 'pointer',
                color: 'var(--text3)', fontSize: 12,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="10,4 6,8 10,12" />
              </svg>
              Alunos
            </button>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>
              {sel ? (
                <>Sessão com <strong style={{ color: 'var(--text)' }}>{sel.name ?? 'Aluno'}</strong></>
              ) : (
                <span style={{ color: 'var(--text4)' }}>TNG Mentor</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {streaming && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  border: '2px solid var(--bg4)', borderTopColor: 'var(--accent)',
                  animation: 'spin .8s linear infinite',
                }} />
                <span style={{ fontSize: 11, color: 'var(--text4)' }}>gerando…</span>
              </div>
            )}
            <span style={{ fontSize: 11, color: 'var(--text4)', fontFamily: 'var(--mono)' }}>
              mentor · service role
            </span>
          </div>
        </div>

        {/* Quick actions */}
        {selectedId && (
          <div style={{
            padding: '9px 18px', borderBottom: '0.5px solid var(--border)',
            background: 'var(--bg2)', display: 'flex', gap: 7, flexWrap: 'wrap', flexShrink: 0,
          }}>
            {[
              { icon: '⚡', label: 'Tokens',  msg: 'Quero adicionar tokens para este aluno. Me guia.' },
              { icon: '🗺', label: 'Plano',   msg: 'Cria um plano personalizado para este aluno baseado no dossier.' },
              { icon: '⏱', label: 'Acesso',  msg: 'Quero estender o acesso deste aluno. Quais as opções?' },
              { icon: '📄', label: 'CV',      msg: 'Mostra o CV mais recente deste aluno e dá uma análise.' },
            ].map(({ icon, label, msg }) => (
              <button
                key={label}
                onClick={() => quickAction(msg)}
                disabled={streaming}
                className="mentor-qa-chip"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 20,
                  background: 'var(--bg3)', border: '0.5px solid var(--border2)',
                  fontSize: 12, color: 'var(--text3)', cursor: streaming ? 'not-allowed' : 'pointer',
                  opacity: streaming ? .5 : 1, transition: 'all .15s', whiteSpace: 'nowrap',
                }}
              >
                <span>{icon}</span> {label}
              </button>
            ))}
            <button
              onClick={() => setNoteMode(m => !m)}
              className={noteMode ? '' : 'mentor-qa-chip'}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 20,
                background: noteMode ? 'var(--purple-dim)' : 'var(--bg3)',
                border: `0.5px solid ${noteMode ? 'var(--purple)' : 'var(--border2)'}`,
                fontSize: 12, color: noteMode ? 'var(--purple)' : 'var(--text3)',
                cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
              }}
            >
              📝 Nota
            </button>
            <button
              onClick={openEnroll}
              className={enrollMode ? '' : 'mentor-qa-chip'}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 20,
                background: enrollMode ? 'var(--teal-dim)' : 'var(--bg3)',
                border: `0.5px solid ${enrollMode ? 'var(--teal)' : 'var(--border2)'}`,
                fontSize: 12, color: enrollMode ? 'var(--teal)' : 'var(--text3)',
                cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
              }}
            >
              ＋ Enrollar
            </button>
          </div>
        )}

        {/* Messages */}
        <div
          ref={msgsRef}
          style={{ flex: 1, overflowY: 'auto', padding: '22px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {!selectedId && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: 'var(--text4)', fontSize: 13 }}>
                <div style={{ marginBottom: 8 }}>✦</div>
                Selecione um aluno para iniciar
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            if (msg.role === 'note') {
              return (
                <div key={i} style={{
                  alignSelf: 'stretch', padding: '9px 13px', borderRadius: 8,
                  background: 'var(--purple-dim)', border: '0.5px solid rgba(167,139,250,.2)',
                  fontSize: 12, color: 'var(--text3)',
                }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '.08em', display: 'block', marginBottom: 4 }}>
                    📝 Nota interna
                  </span>
                  {msg.content}
                </div>
              )
            }

            const isMe = msg.role === 'user'
            return (
              <div key={i} style={{
                display: 'flex', gap: 9, maxWidth: 700,
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                flexDirection: isMe ? 'row-reverse' : 'row',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600,
                  background: isMe ? 'var(--bg3)' : 'var(--accent-dim)',
                  border: isMe ? '0.5px solid var(--border2)' : '1px solid rgba(228,253,139,.18)',
                  color: isMe ? 'var(--text3)' : 'var(--accent)',
                }}>
                  {isMe ? 'M' : '✦'}
                </div>
                <div style={{
                  background: isMe ? 'var(--accent-dim)' : 'var(--bg3)',
                  border: `0.5px solid ${isMe ? 'rgba(228,253,139,.12)' : 'var(--border)'}`,
                  borderRadius: 12, padding: '10px 13px',
                  fontSize: 13, lineHeight: 1.65, color: 'var(--text)',
                }}
                  dangerouslySetInnerHTML={{ __html: mdToHtml(msg.content) }}
                />
              </div>
            )
          })}

          {/* Streaming indicator */}
          {streaming && (
            <div style={{ display: 'flex', gap: 9, alignSelf: 'flex-start', maxWidth: 700 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: 'var(--accent-dim)', border: '1px solid rgba(228,253,139,.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: 'var(--accent)',
              }}>✦</div>
              <div style={{
                background: 'var(--bg3)', border: '0.5px solid var(--border)',
                borderRadius: 12, padding: '12px 16px',
                display: 'flex', gap: 4, alignItems: 'center',
              }}>
                {[0, 200, 400].map(delay => (
                  <span key={delay} style={{
                    width: 5, height: 5, background: 'var(--text4)', borderRadius: '50%',
                    display: 'inline-block', animation: `bounce 1.2s ${delay}ms infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Enroll panel */}
        {enrollMode && selectedId && (
          <div style={{
            padding: '12px 18px', borderTop: '0.5px solid var(--border)',
            background: 'var(--bg2)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--teal)', marginBottom: 10 }}>
              Enrollar em programa
            </div>
            {programs.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text4)' }}>
                Nenhum programa publicado.{' '}
                <a href="/admin/programs" style={{ color: 'var(--teal)', textDecoration: 'none' }}>Criar um →</a>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {programs.map(p => (
                  <button
                    key={p.id}
                    onClick={() => enrollStudent(p.id, p.name)}
                    disabled={!!enrolling}
                    style={{
                      padding: '6px 14px', borderRadius: 20, fontSize: 12,
                      background: enrolling === p.id ? 'var(--teal-dim)' : 'var(--bg3)',
                      color: enrolling === p.id ? 'var(--teal)' : 'var(--text2)',
                      border: `0.5px solid ${enrolling === p.id ? 'var(--teal)' : 'var(--border2)'}`,
                      cursor: enrolling ? 'not-allowed' : 'pointer',
                      opacity: enrolling && enrolling !== p.id ? .5 : 1,
                      transition: 'all .15s',
                    }}
                  >
                    {enrolling === p.id ? '…' : p.name}
                    <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text4)' }}>
                      {p.total_days}d
                    </span>
                  </button>
                ))}
              </div>
            )}
            {enrollMsg && (
              <div style={{
                marginTop: 8, fontSize: 12, padding: '6px 10px', borderRadius: 6,
                background: enrollMsg.type === 'ok' ? 'var(--green-dim)' : 'var(--red-dim)',
                color: enrollMsg.type === 'ok' ? 'var(--green)' : 'var(--red)',
                border: `0.5px solid ${enrollMsg.type === 'ok' ? 'var(--green)' : 'var(--red)'}`,
              }}>
                {enrollMsg.text}
              </div>
            )}
          </div>
        )}

        {/* Note input */}
        {noteMode && selectedId && (
          <div style={{
            padding: '12px 18px', borderTop: '0.5px solid var(--border)',
            background: 'var(--bg2)', display: 'flex', gap: 9, alignItems: 'flex-end',
          }}>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Nota interna sobre este aluno (não fica visível para o aluno)…"
              rows={2}
              style={{
                flex: 1, background: 'var(--bg3)', border: '0.5px solid var(--purple)',
                borderRadius: 9, padding: '9px 13px', fontSize: 13, color: 'var(--text)',
                resize: 'none', outline: 'none', lineHeight: 1.5, fontFamily: 'var(--font)',
              }}
            />
            <button
              onClick={saveNote}
              disabled={savingNote || !noteText.trim()}
              style={{
                padding: '9px 16px', borderRadius: 9, fontSize: 12, fontWeight: 500,
                background: savingNote || !noteText.trim() ? 'var(--bg4)' : 'var(--purple-dim)',
                color: savingNote || !noteText.trim() ? 'var(--text4)' : 'var(--purple)',
                border: `0.5px solid ${savingNote || !noteText.trim() ? 'var(--border)' : 'var(--purple)'}`,
                cursor: savingNote || !noteText.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {savingNote ? '…' : 'Salvar'}
            </button>
          </div>
        )}

        {/* Chat input */}
        {selectedId && (
          <div style={{
            padding: '13px 18px', borderTop: '0.5px solid var(--border)',
            background: 'var(--bg2)', display: 'flex', gap: 9, alignItems: 'flex-end',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 110) + 'px'
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
              }}
              placeholder="Escreva uma instrução ou use os atalhos acima…"
              rows={1}
              style={{
                flex: 1, background: 'var(--bg3)', border: '0.5px solid var(--border2)',
                borderRadius: 9, padding: '9px 13px', fontSize: 13, color: 'var(--text)',
                resize: 'none', outline: 'none', minHeight: 38, maxHeight: 110,
                lineHeight: 1.5, fontFamily: 'var(--font)', transition: 'border-color .15s',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border2)' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={streaming || !input.trim()}
              style={{
                width: 36, height: 36, flexShrink: 0, background: 'var(--accent)',
                border: 'none', borderRadius: 9, cursor: streaming || !input.trim() ? 'not-allowed' : 'pointer',
                fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: streaming || !input.trim() ? .35 : 1, transition: 'opacity .15s',
              }}
            >
              ↑
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: .3; }
          40%            { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .mentor-qa-chip:hover {
          border-color: var(--accent) !important;
          color: var(--accent) !important;
          background: var(--accent-dim) !important;
        }
      `}</style>
    </div>
  )
}

// ── Dossier sub-components ────────────────────────────────────────────────────

function DossierSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '.1em',
        textTransform: 'uppercase', color: 'var(--text4)', marginBottom: 8,
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function DRow({ k, v, vc }: { k: string; v: string; vc?: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '4px 0', borderBottom: '0.5px solid var(--border)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--text3)' }}>{k}</span>
      <span style={{ fontSize: 12, fontWeight: 500, fontFamily: 'var(--mono)', color: vc ?? 'var(--text)' }}>{v}</span>
    </div>
  )
}

const PIPE_STYLES: Record<string, { bg: string; border: string }> = {
  'var(--blue)':   { bg: 'rgba(96,165,250,.08)',  border: 'rgba(96,165,250,.25)'  },
  'var(--yellow)': { bg: 'rgba(251,191,36,.08)',  border: 'rgba(251,191,36,.25)'  },
  'var(--green)':  { bg: 'rgba(74,222,128,.08)',  border: 'rgba(74,222,128,.25)'  },
}

function PipeTag({ label, color }: { label: string; color: string }) {
  const s = PIPE_STYLES[color] ?? { bg: 'var(--bg4)', border: 'var(--border)' }
  return (
    <span style={{
      fontSize: 10, padding: '3px 8px', borderRadius: 4,
      fontFamily: 'var(--mono)',
      background: s.bg, color, border: `1px solid ${s.border}`,
    }}>
      {label}
    </span>
  )
}
