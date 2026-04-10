'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

type Phase = 'outline' | 'week' | 'refine'

const PHASE_LABELS: Record<Phase, string> = {
  outline: 'Fase 1 — Outline',
  week:    'Fase 2 — Conteúdo por semana',
  refine:  'Fase 3 — Refinamento',
}

const PHASE_HINTS: Record<Phase, string> = {
  outline: 'Ex: "crie o outline de 14 dias focado em entrevistas técnicas"',
  week:    'Ex: "gera a semana 1" ou "gera semana 2 com foco em STAR stories"',
  refine:  'Ex: "reescreva o dia 5 com mais foco em LinkedIn"',
}

const PHASE_GREETINGS: Record<Phase, string> = {
  outline: 'Programa novo! Vamos começar pelo outline — nomes e foco de cada dia, sem detalhes ainda. Me diga o objetivo do programa e eu monto a estrutura completa para você aprovar.',
  week:    'Outline pronto. Agora geramos o conteúdo semana por semana. Peça uma semana de cada vez — eu gero, você aprova, avançamos.',
  refine:  'Programa completo. Posso ajustar dias específicos, melhorar instruções de IA ou reescrever cards. O que quer refinar?',
}

interface Props {
  programId: string
  initialPhase?: Phase
  onDaysSaved: () => void
}

export function ProgramAIAssistant({ programId, initialPhase = 'outline', onDaysSaved }: Props) {
  const [phase, setPhase]     = useState<Phase>(initialPhase)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: PHASE_GREETINGS[initialPhase] }
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef             = useRef<HTMLDivElement>(null)
  const textareaRef           = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    // Add placeholder assistant message
    setMessages(m => [...m, { role: 'assistant', content: '' }])

    try {
      const res = await fetch(`/api/admin/programs/${programId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        }),
      })

      if (!res.body) return
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
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const event = JSON.parse(data)
            if (event.type === 'delta') {
              setMessages(m => {
                const copy = [...m]
                copy[copy.length - 1] = {
                  ...copy[copy.length - 1],
                  content: copy[copy.length - 1].content + event.text,
                }
                return copy
              })
            }
            if (event.type === 'days_saved') {
              onDaysSaved()
            }
            if (event.type === 'phase') {
              setPhase(event.phase as Phase)
            }
          } catch {}
        }
      }
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  // Strip JSON blocks — they're handled silently, no need to show raw JSON
  function cleanContent(content: string) {
    return content.replace(/```json[\s\S]*?```/g, '').trim()
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--bg2)', borderLeft: '0.5px solid var(--border)',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%', background: 'var(--purple)',
          boxShadow: '0 0 6px var(--purple)', flexShrink: 0,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>Assistente IA</div>
          <div style={{ fontSize: 10, color: 'var(--purple)', marginTop: 1 }}>{PHASE_LABELS[phase]}</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column',
            alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '90%', padding: '9px 12px', borderRadius: 'var(--r)',
              fontSize: 12, lineHeight: 1.6,
              background: m.role === 'user' ? 'var(--accent-dim)' : 'var(--bg3)',
              border: m.role === 'user'
                ? '0.5px solid rgba(228,253,139,.2)'
                : '0.5px solid var(--border)',
              color: m.role === 'user' ? 'var(--accent)' : 'var(--text2)',
              wordBreak: 'break-word',
            }}>
              {m.content ? (
                m.role === 'user' ? (
                  <span style={{ whiteSpace: 'pre-wrap' }}>{m.content}</span>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p:      ({ children }) => <p style={{ margin: '0 0 8px', lineHeight: 1.6 }}>{children}</p>,
                      strong: ({ children }) => <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{children}</strong>,
                      em:     ({ children }) => <em style={{ color: 'var(--text3)' }}>{children}</em>,
                      ul:     ({ children }) => <ul style={{ margin: '4px 0 8px', paddingLeft: 16 }}>{children}</ul>,
                      ol:     ({ children }) => <ol style={{ margin: '4px 0 8px', paddingLeft: 16 }}>{children}</ol>,
                      li:     ({ children }) => <li style={{ marginBottom: 2 }}>{children}</li>,
                      code:   ({ children }) => <code style={{ fontSize: 11, background: 'var(--bg4)', padding: '1px 5px', borderRadius: 4, fontFamily: 'var(--mono)' }}>{children}</code>,
                      hr:     () => <hr style={{ border: 'none', borderTop: '0.5px solid var(--border)', margin: '8px 0' }} />,
                      h3:     ({ children }) => <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', margin: '8px 0 4px' }}>{children}</h3>,
                    }}
                  >
                    {cleanContent(m.content)}
                  </ReactMarkdown>
                )
              ) : (
                <span style={{ opacity: 0.4 }}>▋</span>
              )}
            </div>
            {/* Badge when days were saved */}
            {m.role === 'assistant' && m.content.includes('```json') && cleanContent(m.content) !== m.content && (
              <span style={{
                fontSize: 10, color: 'var(--green)', marginTop: 4,
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 10, height: 10 }}>
                  <polyline points="2,6 5,9 10,3" />
                </svg>
                Dias salvos automaticamente
              </span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: '0.5px solid var(--border)' }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-end',
          background: 'var(--bg3)', borderRadius: 'var(--rsm)',
          border: '0.5px solid var(--border2)', padding: '6px 8px',
        }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PHASE_HINTS[phase]}
            rows={2}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text)', fontSize: 12, lineHeight: 1.5,
              resize: 'none', fontFamily: 'inherit',
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            style={{
              padding: '6px 10px', borderRadius: 'var(--rsm)', fontSize: 12,
              background: !input.trim() || loading ? 'var(--bg4)' : 'var(--accent-dim)',
              color: !input.trim() || loading ? 'var(--text4)' : 'var(--accent)',
              border: `0.5px solid ${!input.trim() || loading ? 'var(--border)' : 'rgba(228,253,139,.3)'}`,
              cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
              flexShrink: 0, alignSelf: 'flex-end',
            }}
          >
            {loading ? '…' : '↑'}
          </button>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 5, paddingLeft: 2 }}>
          Enter para enviar · Shift+Enter para nova linha
        </div>
      </div>
    </div>
  )
}
