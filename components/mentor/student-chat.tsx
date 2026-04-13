'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Quais são os principais pontos fortes desse candidato?',
  'Esse candidato está pronto para entrevistas internacionais?',
  'O que recomendar para a próxima sessão de mentoria?',
  'Quais são os gaps mais críticos a trabalhar?',
]

export function StudentChat({ userId }: { userId: string }) {
  const [messages, setMessages]     = useState<Message[]>([])
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [sessionId, setSessionId]   = useState<string | null>(null)
  const bottomRef                   = useRef<HTMLDivElement>(null)
  const inputRef                    = useRef<HTMLTextAreaElement>(null)

  // Load existing session on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`/api/mentor/student-chat?userId=${userId}`)
        if (res.ok) {
          const { sessionId: sid, messages: msgs } = await res.json()
          if (sid) setSessionId(sid)
          if (msgs?.length) setMessages(msgs)
        }
      } catch { /* ignore */ }
      finally { setLoadingHistory(false) }
    }
    loadHistory()
  }, [userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text: string) {
    if (!text.trim() || loading) return

    const userMsg: Message = { role: 'user', content: text.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    const assistantMsg: Message = { role: 'assistant', content: '' }
    setMessages([...next, assistantMsg])

    try {
      const res = await fetch('/api/mentor/student-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, messages: next, sessionId }),
      })

      if (!res.ok || !res.body) throw new Error('Erro na resposta')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') break
          try {
            const parsed = JSON.parse(payload)
            if (parsed.text) {
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + parsed.text,
                }
                return updated
              })
            }
            // Capture sessionId returned on first message
            if (parsed.sessionId && !sessionId) {
              setSessionId(parsed.sessionId)
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: 'Erro ao conectar com a IA.' }
        return updated
      })
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  if (loadingHistory) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text4)', fontSize: 13 }}>
        Carregando histórico…
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 500 }}>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16 }}>

        {messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{
              padding: '16px 18px',
              background: 'var(--bg2)', border: '0.5px solid var(--border)',
              borderRadius: 'var(--r)', fontSize: 13, color: 'var(--text3)', lineHeight: 1.6,
            }}>
              Faça perguntas sobre esse candidato. A IA tem acesso ao perfil completo, progresso, pipeline de vagas e preparação para entrevistas.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    textAlign: 'left', padding: '9px 14px', borderRadius: 'var(--rsm)',
                    background: 'none', border: '0.5px solid var(--border2)',
                    color: 'var(--text3)', fontSize: 12, cursor: 'pointer',
                    transition: 'all .12s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--purple-dim)'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--purple)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(167,139,250,.3)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'none'
                    ;(e.currentTarget as HTMLElement).style.color = 'var(--text3)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={`msg-${i}`}
            style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: 'var(--r)',
              fontSize: 13, lineHeight: 1.65,
              background: m.role === 'user' ? 'var(--purple-dim)' : 'var(--bg2)',
              color: m.role === 'user' ? 'var(--purple)' : 'var(--text)',
              border: `0.5px solid ${m.role === 'user' ? 'rgba(167,139,250,.25)' : 'var(--border)'}`,
            }}>
              {m.role === 'assistant' ? (
                m.content ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p:      ({ children }) => <p style={{ margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>{children}</p>,
                      h3:     ({ children }) => <h3 style={{ fontSize: 13, fontWeight: 600, margin: '10px 0 4px' }}>{children}</h3>,
                      h2:     ({ children }) => <h2 style={{ fontSize: 14, fontWeight: 600, margin: '12px 0 4px' }}>{children}</h2>,
                      ul:     ({ children }) => <ul style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{children}</ul>,
                      ol:     ({ children }) => <ol style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{children}</ol>,
                      li:     ({ children }) => <li style={{ marginBottom: 3 }}>{children}</li>,
                      strong: ({ children }) => <strong style={{ fontWeight: 600, color: 'var(--purple)' }}>{children}</strong>,
                      code:   ({ children }) => <code style={{ fontFamily: 'var(--mono)', fontSize: 11, background: 'var(--bg3)', padding: '1px 5px', borderRadius: 4 }}>{children}</code>,
                      hr:     () => <hr style={{ border: 'none', borderTop: '0.5px solid var(--border2)', margin: '10px 0' }} />,
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                ) : (
                  <span style={{ opacity: 0.4 }}>
                    <span style={{ animation: 'pulse 1s infinite' }}>●</span>
                  </span>
                )
              ) : (
                <span style={{ whiteSpace: 'pre-wrap' }}>{m.content}</span>
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        borderTop: '0.5px solid var(--border)', paddingTop: 14,
        display: 'flex', gap: 10, alignItems: 'flex-end',
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte sobre esse candidato… (Enter para enviar)"
          rows={2}
          disabled={loading}
          style={{
            flex: 1, padding: '9px 12px', borderRadius: 'var(--rsm)',
            background: 'var(--bg3)', border: '0.5px solid var(--border2)',
            color: 'var(--text)', fontSize: 13, outline: 'none',
            resize: 'none', fontFamily: 'inherit', lineHeight: 1.5,
            opacity: loading ? 0.6 : 1,
          }}
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          style={{
            padding: '9px 16px', borderRadius: 'var(--rsm)',
            background: loading || !input.trim() ? 'var(--bg4)' : 'var(--purple-dim)',
            color: loading || !input.trim() ? 'var(--text4)' : 'var(--purple)',
            border: `0.5px solid ${loading || !input.trim() ? 'var(--border)' : 'rgba(167,139,250,.3)'}`,
            fontSize: 13, fontWeight: 500, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            flexShrink: 0, transition: 'all .12s',
          }}
        >
          {loading ? '...' : 'Enviar'}
        </button>
      </div>
    </div>
  )
}
