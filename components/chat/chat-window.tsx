'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  User, UserCheck, UserPlus, FileText, FilePen,
  BookmarkCheck, CalendarDays, CalendarCheck,
  Hash, Briefcase, Link2, Star, BarChart2, Pencil, Sparkles,
} from 'lucide-react'

type ToolMeta = { icon: React.ReactNode; label: string; color: string; type: 'read' | 'write' }

const TOOL_META: Record<string, ToolMeta> = {
  // --- profile (purple)
  get_profile:           { icon: <User size={9} />,           label: 'Perfil carregado',        color: '#6A1A74', type: 'read'  },
  update_profile:        { icon: <UserCheck size={9} />,      label: 'Perfil atualizado',       color: '#6A1A74', type: 'write' },
  save_contact:          { icon: <UserPlus size={9} />,       label: 'Contato salvo',           color: '#6A1A74', type: 'write' },
  save_linkedin_content: { icon: <Link2 size={9} />,          label: 'LinkedIn atualizado',     color: '#6A1A74', type: 'write' },
  // --- notes / plans (amber)
  get_action_notes:      { icon: <FileText size={9} />,       label: 'Notas carregadas',        color: '#C47D0E', type: 'read'  },
  save_action_note:      { icon: <BookmarkCheck size={9} />,  label: 'Nota salva',              color: '#C47D0E', type: 'write' },
  save_star_story:       { icon: <Star size={9} />,           label: 'História STAR salva',     color: '#C47D0E', type: 'write' },
  // --- day / progress (green)
  get_day_context:       { icon: <CalendarDays size={9} />,   label: 'Contexto do dia',         color: '#18895A', type: 'read'  },
  get_day_activity:      { icon: <CalendarDays size={9} />,   label: 'Atividade carregada',     color: '#18895A', type: 'read'  },
  save_day_output:       { icon: <CalendarCheck size={9} />,  label: 'Progresso salvo',         color: '#18895A', type: 'write' },
  // --- jobs / career (coral)
  create_job:            { icon: <Briefcase size={9} />,      label: 'Vaga criada',             color: '#B84E18', type: 'write' },
  update_job_status:     { icon: <Briefcase size={9} />,      label: 'Status atualizado',       color: '#B84E18', type: 'write' },
  get_jobs:              { icon: <Briefcase size={9} />,      label: 'Vagas carregadas',        color: '#B84E18', type: 'read'  },
  get_application_stats: { icon: <BarChart2 size={9} />,      label: 'Estatísticas carregadas', color: '#B84E18', type: 'read'  },
  // --- cv / documents (blue)
  get_cv_draft:          { icon: <FileText size={9} />,       label: 'CV carregado',            color: '#2D6CDF', type: 'read'  },
  save_cv_bullets:       { icon: <FilePen size={9} />,        label: 'CV atualizado',           color: '#2D6CDF', type: 'write' },
  update_cv_section:     { icon: <FilePen size={9} />,        label: 'CV atualizado',           color: '#2D6CDF', type: 'write' },
  // --- keywords (teal)
  add_keywords:          { icon: <Hash size={9} />,           label: 'Keywords adicionadas',    color: '#0E8A8A', type: 'write' },
  // --- meta (gray)
  set_chat_title:        { icon: <Pencil size={9} />,         label: 'Título definido',         color: '#6E665B', type: 'write' },
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  toolCalls?: string[]
  timestamp?: string   // ISO string, set at send time
}

interface JobCtx {
  company: string
  role: string
  fitScore?: number | null
  analysisNotes?: string | null
  strongKeywords?: string[] | null
  weakKeywords?: string[] | null
}

interface ChatWindowProps {
  initialPrompt?: string
  dayNumber?: number
  slug?: string
  mode?: 'task' | 'mentor' | 'reflect'
  loadSessionId?: string | null
  onSessionCreated?: (sessionId: string) => void
  userName?: string
  jobContext?: JobCtx | null
}

function formatTime(iso?: string): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

const WELCOME_CHIPS = [
  'Preparar para entrevista',
  'Melhorar meu LinkedIn',
  'Revisar meu CV',
  'Onde buscar vagas internacionais',
]

export function ChatWindow({ initialPrompt, dayNumber, slug, mode = 'task', loadSessionId, onSessionCreated, userName, jobContext }: ChatWindowProps) {
  const router = useRouter()
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [dayCompleted, setDayCompleted] = useState(false)
  const [planSaved, setPlanSaved] = useState<{ title: string } | null>(null)

  const messagesEndRef     = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const userScrolledRef    = useRef(false)
  const didAutoSend        = useRef(false)
  const prevLoadId         = useRef<string | null | undefined>(undefined)

  // Welcome mode: shown before first message in free-form mentor chat
  const isWelcomeMode = messages.length === 0 && mode === 'mentor' && !dayNumber && !jobContext && !loadSessionId

  // Auto-scroll: only when the user hasn't manually scrolled up
  useEffect(() => {
    if (!userScrolledRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  function handleScroll() {
    const el = scrollContainerRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    userScrolledRef.current = distFromBottom > 80
  }

  // Load existing session when loadSessionId changes
  useEffect(() => {
    if (loadSessionId === prevLoadId.current) return
    prevLoadId.current = loadSessionId

    if (!loadSessionId) {
      setMessages([])
      setSessionId(null)
      setDayCompleted(false)
      setPlanSaved(null)
      didAutoSend.current = false
      return
    }

    fetch(`/api/chat/sessions/${loadSessionId}`)
      .then(r => r.json())
      .then(({ session }) => {
        if (session) {
          setSessionId(session.id)
          setMessages(Array.isArray(session.messages) ? session.messages : [])
        }
      })
  }, [loadSessionId])

  const initialPromptRef = useRef(initialPrompt)
  useEffect(() => {
    // One-shot: auto-send on mount only. Uses a ref so we don't re-trigger
    // if the parent re-renders before the first message is sent.
    if (initialPromptRef.current && !didAutoSend.current) {
      didAutoSend.current = true
      send(initialPromptRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const saveSession = useCallback(async (sid: string, msgs: Message[]) => {
    await fetch('/api/chat/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sid, messages: msgs }),
    })
  }, [])

  async function send(text?: string) {
    const content = text ?? input
    if (!content.trim() || loading) return
    userScrolledRef.current = false
    const userMsg: Message = { role: 'user', content, timestamp: new Date().toISOString() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    if (!text) setInput('')
    setLoading(true)

    // Create session on first message
    let currentSessionId = sessionId
    if (!currentSessionId) {
      const sessionTitle = jobContext
        ? `Prep · ${jobContext.company} — ${jobContext.role}`.slice(0, 80)
        : content.slice(0, 60)

      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:      sessionTitle,
          mode,
          day_number: dayNumber ?? null,
        }),
      })
      const data = await res.json()
      currentSessionId = data.id
      setSessionId(data.id)
      onSessionCreated?.(data.id)
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages
            .map(m => ({ role: m.role, content: m.content }))
            .filter(m => m.content.trim() !== ''),
          mode,
          dayNumber,
          slug,
          sessionId: currentSessionId,
          ...(jobContext ? { jobContext } : {}),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        if (err.error === 'token_limit_reached') {
          setMessages(prev => [...prev, { role: 'assistant', content: 'Você atingiu o limite de tokens. Adquira mais para continuar.' }])
        }
        return
      }

      const reader = res.body?.getReader()
      if (!reader) return

      // Each tool_result that is followed by more text creates a new bubble.
      // `segments` tracks the separate text blocks; `newSegmentPending` is set
      // true when a tool fires so the next text delta opens a fresh message.
      let segments: Array<{ content: string; toolCalls: string[] }> = [{ content: '', toolCalls: [] }]
      let newSegmentPending = false
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const event = JSON.parse(data)

            if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
              const text = event.delta.text
              const cur = segments[segments.length - 1]
              if (newSegmentPending && cur.content !== '') {
                // Tool fired after real text — start a new bubble
                segments.push({ content: text, toolCalls: [] })
                newSegmentPending = false
                setMessages(prev => [...prev, { role: 'assistant', content: text, toolCalls: [] }])
              } else {
                // Either no pending segment, or current segment is still empty
                // (tools fired before any text) — fill the existing bubble
                newSegmentPending = false
                cur.content += text
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { role: 'assistant', content: cur.content, toolCalls: cur.toolCalls }
                  return updated
                })
              }
            }

            if (event.type === 'tool_result') {
              segments[segments.length - 1].toolCalls.push(event.tool)
              newSegmentPending = true
              if (event.tool === 'save_day_output') setDayCompleted(true)
              if (event.tool === 'save_action_note') {
                setPlanSaved({ title: event.title ?? 'Plano de ação' })
                router.refresh()
              }
              setMessages(prev => {
                const updated = [...prev]
                const cur = segments[segments.length - 1]
                updated[updated.length - 1] = { role: 'assistant', content: cur.content, toolCalls: [...cur.toolCalls] }
                return updated
              })
            }

            if (event.type === 'error') {
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: `Erro: ${event.message ?? 'falha na chamada à IA'}` }
                return updated
              })
            }
          } catch {}
        }
      }

      const segmentMessages: Message[] = segments.map((seg, i) => ({
        role: 'assistant' as const,
        content: seg.content,
        toolCalls: seg.toolCalls,
        timestamp: i === segments.length - 1 ? new Date().toISOString() : undefined,
      }))
      const finalMessages: Message[] = [...updatedMessages, ...segmentMessages]
      setMessages(finalMessages)
      if (currentSessionId) await saveSession(currentSessionId, finalMessages)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {isWelcomeMode ? (
        /* ── Claude-style centered welcome ── */
        <div className="chat-welcome-center">
          <div className="chat-welcome-greeting">
            {userName ? `Oi, ${userName} 👋` : 'Olá 👋'}
          </div>
          <div className="chat-welcome-sub">No que posso te ajudar hoje?</div>

          <div className="chat-welcome-form">
            <textarea
              className="chat-welcome-textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Escreva uma mensagem..."
              rows={3}
              autoFocus
            />
            <button
              className="chat-welcome-send"
              onClick={() => send()}
              disabled={!input.trim() || loading}
            >
              Enviar →
            </button>
          </div>

          <div className="chat-welcome-chips">
            {WELCOME_CHIPS.map(chip => (
              <button
                key={chip}
                className="chat-welcome-chip"
                onClick={() => send(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="chat-messages" ref={scrollContainerRef} onScroll={handleScroll}>

            {/* Context pill */}
            <div className="chat-context-pill">
              <span className="chat-context-dot" />
              Contexto carregado
              {dayNumber && <span className="chat-context-tag">Dia {dayNumber}</span>}
            </div>

            {/* Empty state for non-welcome modes */}
            {messages.length === 0 && (dayNumber || jobContext || mode !== 'mentor') && (
              <div className="chat-empty">
                <div className="chat-empty-icon">✦</div>
                <div className="chat-empty-text">
                  {dayNumber
                    ? 'A IA já tem o contexto do seu dia. Comece a conversa.'
                    : jobContext
                      ? `Contexto carregado: ${jobContext.company} — ${jobContext.role}. Pronto para preparar.`
                      : 'Comece colando uma vaga, fazendo uma pergunta ou pedindo uma análise.'}
                </div>
              </div>
            )}

            {messages.map((msg, i) => {
              const prevRole = messages[i - 1]?.role
              const sameAsPrev = prevRole === msg.role
              return (
              <div key={i} className={msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-ai'}>

                {msg.role === 'assistant' && (!sameAsPrev || (msg.toolCalls && msg.toolCalls.length > 0)) && (
                  <div className="chat-msg-ai-label">
                    {!sameAsPrev && <><span style={{ fontSize: 12 }}>✦</span>Mentor IA</>}
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="chat-tools">
                        {msg.toolCalls.map((tool, ti) => {
                          const meta: ToolMeta = TOOL_META[tool] ?? { icon: <Sparkles size={9} />, label: tool, color: '#6E665B', type: 'write' }
                          return (
                            <span
                              key={ti}
                              className="chat-tool-badge"
                              title={meta.label}
                              style={{
                                color: meta.color,
                                background: meta.color + '18',
                                borderColor: meta.color + '50',
                                borderStyle: meta.type === 'read' ? 'dashed' : 'solid',
                              }}
                            >
                              {meta.icon}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {msg.role === 'user' && !sameAsPrev && userName && (
                  <div className="chat-msg-user-label">{userName}</div>
                )}

                {msg.role === 'user' ? (
                  <>
                    <div className="chat-bubble-user">{msg.content}</div>
                    {formatTime(msg.timestamp) && (
                      <div style={{
                        fontSize: 10, color: 'var(--tng-mute)',
                        fontFamily: 'var(--tng-font-mono)',
                        textAlign: 'right', marginTop: 4,
                      }}>
                        {formatTime(msg.timestamp)}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="chat-bubble-ai">
                      <div className="chat-ai-body">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p:      ({ children }) => <p>{children}</p>,
                          h2:     ({ children }) => <h2>{children}</h2>,
                          h3:     ({ children }) => <h3>{children}</h3>,
                          ul:     ({ children }) => <ul>{children}</ul>,
                          ol:     ({ children }) => <ol>{children}</ol>,
                          li:     ({ children }) => <li>{children}</li>,
                          strong: ({ children }) => <strong>{children}</strong>,
                          code:   ({ children }) => <code>{children}</code>,
                          hr:     () => <hr />,
                          table:  ({ children }) => <table>{children}</table>,
                          th:     ({ children }) => <th>{children}</th>,
                          td:     ({ children }) => <td>{children}</td>,
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontWeight: 700,
                                color: 'var(--tng-purple-700)',
                                textDecoration: 'underline',
                                textDecorationColor: 'var(--tng-coral)',
                                textDecorationThickness: '2px',
                                textUnderlineOffset: '3px',
                              }}
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {msg.content || (loading && i === messages.length - 1 ? '…' : '')}
                      </ReactMarkdown>
                      </div>
                    </div>
                    {formatTime(msg.timestamp) && (
                      <div style={{
                        fontSize: 10, color: 'var(--tng-mute)',
                        fontFamily: 'var(--tng-font-mono)',
                        marginTop: 4,
                      }}>
                        {formatTime(msg.timestamp)}
                      </div>
                    )}
                  </>
                )}
              </div>
              )
            })}

            {/* Typing indicator */}
            {loading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="chat-msg-ai">
                <div className="chat-msg-ai-label">
                  <span style={{ fontSize: 12 }}>✦</span>
                  Mentor IA
                </div>
                <div className="chat-typing">
                  {[0, 0.2, 0.4].map((delay, idx) => (
                    <span key={idx} className="chat-typing-dot" style={{ animationDelay: `${delay}s` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Day completion notification */}
          {dayCompleted && dayNumber && slug && (
            <div className="chat-notify" style={{ background: '#F2FAD5', border: '1px solid #B4DD3A' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16, color: '#5E7A0F' }}>✓</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#5E7A0F' }}>Sessão concluída</div>
                  <div style={{ fontSize: 11, color: 'var(--tng-ink-3)', marginTop: 2 }}>
                    Volte ao dia para marcar as atividades como concluídas
                  </div>
                </div>
              </div>
              <a href={`/${slug}/days/${dayNumber}`} className="chat-notify-link"
                style={{ background: '#5E7A0F', color: '#F2FAD5' }}>
                Ir para o Dia {dayNumber} →
              </a>
            </div>
          )}

          {/* Plan saved notification */}
          {planSaved && (
            <div className="chat-notify" style={{ background: 'var(--tng-purple-100)', border: '1px solid var(--tng-purple-300)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16, color: 'var(--tng-purple-700)' }}>◈</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tng-purple-700)' }}>{planSaved.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--tng-ink-3)', marginTop: 2 }}>Plano salvo — acesse na sua lista de planos</div>
                </div>
              </div>
              <a href="/plans" className="chat-notify-link"
                style={{ background: 'var(--tng-purple-700)', color: 'white' }}>
                Ver planos →
              </a>
            </div>
          )}

          {/* Input */}
          <div className="chat-composer">
            <textarea
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Escreva uma mensagem..."
              rows={1}
            />
            <button
              className="chat-send"
              onClick={() => send()}
              disabled={!input.trim() || loading}
            >
              Enviar
            </button>
          </div>
        </>
      )}
    </div>
  )
}
