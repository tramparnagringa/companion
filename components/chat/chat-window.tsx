'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'assistant'
  content: string
  toolCalls?: string[]
}

interface ChatWindowProps {
  initialPrompt?: string
  dayNumber?: number
  slug?: string
  loadSessionId?: string | null
  onSessionCreated?: (sessionId: string) => void
}

export function ChatWindow({ initialPrompt, dayNumber, slug, loadSessionId, onSessionCreated }: ChatWindowProps) {
  const mode = 'task' as const
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const didAutoSend    = useRef(false)
  const prevLoadId     = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Load existing session when loadSessionId changes
  useEffect(() => {
    if (loadSessionId === prevLoadId.current) return
    prevLoadId.current = loadSessionId

    if (!loadSessionId) {
      setMessages([])
      setSessionId(null)
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

  useEffect(() => {
    if (initialPrompt && !didAutoSend.current) {
      didAutoSend.current = true
      send(initialPrompt)
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
    const userMsg: Message = { role: 'user', content }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    if (!text) setInput('')
    setLoading(true)

    // Create session on first message
    let currentSessionId = sessionId
    if (!currentSessionId) {
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:      content.slice(0, 60),
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

      let assistantContent = ''
      const toolCalls: string[] = []
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
              assistantContent += event.delta.text
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent, toolCalls }
                return updated
              })
            }
            if (event.type === 'tool_result') {
              toolCalls.push(event.tool)
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent, toolCalls: [...toolCalls] }
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

      const finalMessages: Message[] = [
        ...updatedMessages,
        { role: 'assistant', content: assistantContent, toolCalls },
      ]
      if (currentSessionId) await saveSession(currentSessionId, finalMessages)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Context bar */}
      <div style={{
        background: 'var(--bg2)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--rsm)', padding: '8px 12px',
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
      }}>
        <span style={{
          width: 6, height: 6, background: 'var(--accent)', borderRadius: '50%',
          flexShrink: 0, animation: 'pulse 2s infinite',
        }} />
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>Contexto carregado</span>
        {dayNumber && (
          <span style={{
            fontSize: 10, background: 'var(--bg3)', color: 'var(--purple)',
            padding: '2px 7px', borderRadius: 8,
          }}>
            Dia {dayNumber}
          </span>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
        gap: 10, paddingBottom: 12,
      }}>
        {messages.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', marginTop: 40 }}>
            {mode === 'mentor'
              ? 'Olá! Sou seu mentor. Como posso ajudar hoje?'
              : 'Comece colando uma vaga ou fazendo uma pergunta sobre sua busca.'}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ maxWidth: '88%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && mode === 'mentor' && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10,
                background: 'var(--teal-dim)', color: 'var(--teal)',
                padding: '2px 7px', borderRadius: 8, marginBottom: 6,
              }}>
                ✦ Mentor
              </div>
            )}

            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
                {msg.toolCalls.map((tool, ti) => (
                  <div key={ti} style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '5px 10px', background: 'var(--bg3)',
                    borderRadius: 'var(--rsm)', borderLeft: '2px solid var(--purple)',
                    fontSize: 11, color: 'var(--text3)',
                  }}>
                    <span style={{ color: 'var(--green)', fontWeight: 500, fontFamily: 'var(--mono)' }}>✓</span>
                    <span style={{ color: 'var(--purple)', fontWeight: 500, fontFamily: 'var(--mono)' }}>{tool}()</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{
              padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.65,
              background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg2)',
              color: msg.role === 'user' ? 'var(--accent-text)' : 'var(--text)',
              border: msg.role === 'assistant' ? '0.5px solid var(--border)' : 'none',
              borderBottomLeftRadius:  msg.role === 'assistant' ? 3 : 12,
              borderBottomRightRadius: msg.role === 'user' ? 3 : 12,
            }}>
              {msg.role === 'assistant' ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p:      ({ children }) => <p style={{ margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>{children}</p>,
                    h3:     ({ children }) => <h3 style={{ fontSize: 13, fontWeight: 600, margin: '10px 0 4px' }}>{children}</h3>,
                    h2:     ({ children }) => <h2 style={{ fontSize: 14, fontWeight: 600, margin: '12px 0 4px' }}>{children}</h2>,
                    ul:     ({ children }) => <ul style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{children}</ul>,
                    ol:     ({ children }) => <ol style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{children}</ol>,
                    li:     ({ children }) => <li style={{ marginBottom: 3 }}>{children}</li>,
                    strong: ({ children }) => <strong style={{ fontWeight: 600, color: 'var(--accent)' }}>{children}</strong>,
                    code:   ({ children }) => <code style={{ fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4 }}>{children}</code>,
                    hr:     () => <hr style={{ border: 'none', borderTop: '0.5px solid var(--border2)', margin: '10px 0' }} />,
                    table:  ({ children }) => <table style={{ borderCollapse: 'collapse', fontSize: 12, marginBottom: 8, width: '100%' }}>{children}</table>,
                    th:     ({ children }) => <th style={{ padding: '4px 8px', borderBottom: '0.5px solid var(--border2)', textAlign: 'left', fontWeight: 600 }}>{children}</th>,
                    td:     ({ children }) => <td style={{ padding: '4px 8px', borderBottom: '0.5px solid var(--border3)' }}>{children}</td>,
                  }}
                >
                  {msg.content || (loading && i === messages.length - 1 ? '...' : '')}
                </ReactMarkdown>
              ) : (
                <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
              )}
            </div>
          </div>
        ))}

        {loading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div style={{ alignSelf: 'flex-start' }}>
            <div style={{
              display: 'flex', gap: 4, padding: '10px 14px',
              background: 'var(--bg2)', border: '0.5px solid var(--border)',
              borderRadius: 12, borderBottomLeftRadius: 3, width: 'fit-content',
            }}>
              {[0, 0.2, 0.4].map((delay, i) => (
                <span key={i} style={{
                  width: 5, height: 5, background: 'var(--text3)', borderRadius: '50%',
                  display: 'inline-block', animation: `bop 1.2s infinite ${delay}s`,
                }} />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'flex-end',
        paddingTop: 10, borderTop: '0.5px solid var(--border)',
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder={mode === 'mentor' ? 'Fale com seu mentor...' : 'Cole uma vaga ou faça uma pergunta...'}
          rows={1}
          style={{
            flex: 1, minHeight: 38, maxHeight: 100, padding: '9px 13px',
            fontSize: 13, lineHeight: 1.5, background: 'var(--bg2)',
            border: '0.5px solid var(--border2)', borderRadius: 'var(--r)',
            color: 'var(--text)', fontFamily: 'var(--font)', resize: 'none',
            outline: 'none',
          }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          style={{
            padding: '9px 14px', borderRadius: 'var(--rsm)', border: 'none',
            background: 'var(--accent)', color: 'var(--accent-text)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font)',
            opacity: !input.trim() || loading ? 0.5 : 1,
          }}
        >
          Enviar
        </button>
      </div>
    </div>
  )
}
