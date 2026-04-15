'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'assistant'
  content: string
  toolCalls?: string[]
}

interface Props {
  open: boolean
  onClose: () => void
  pendingPrompt: string | null
  onPromptConsumed: () => void
  onBeforeSend: () => Promise<void>
  onCvUpdated: () => void
  variant?: 'overlay' | 'sidebar'
}

export function CvAiPanel({ open, onClose, pendingPrompt, onPromptConsumed, onBeforeSend, onCvUpdated, variant = 'overlay' }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [collapsed, setCollapsed] = useState(true)
  const messagesEndRef           = useRef<HTMLDivElement>(null)
  const didConsumePrompt         = useRef<string | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auto-send pending prompt from ✦ button clicks
  useEffect(() => {
    if (pendingPrompt && pendingPrompt !== didConsumePrompt.current) {
      didConsumePrompt.current = pendingPrompt
      onPromptConsumed()
      sendMessage(pendingPrompt)
    }
  }, [pendingPrompt]) // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: Message = { role: 'user', content: text }
    const updatedMessages  = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      // Flush any pending debounced save so the AI reads the latest content
      await onBeforeSend()

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          mode: 'cv',
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setMessages(prev => [...prev, { role: 'assistant', content: err.error === 'token_limit_reached'
          ? '⚠️ Saldo de tokens insuficiente.'
          : `Erro: ${err.error ?? res.status}` }])
        return
      }

      const reader = res.body?.getReader()
      if (!reader) return

      let assistantContent = ''
      const toolCalls: string[] = []
      let cvWasUpdated = false
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
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent, toolCalls: [...toolCalls] }
                return updated
              })
            }
            if (event.type === 'tool_result') {
              toolCalls.push(event.tool)
              if (event.tool === 'update_cv_section' || event.tool === 'save_cv_bullets') {
                // Reload immediately so the document updates as each section is written
                onCvUpdated()
              }
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent, toolCalls: [...toolCalls] }
                return updated
              })
            }
          } catch { /* ignore parse errors */ }
        }
      }

      if (cvWasUpdated) onCvUpdated()
    } catch (err) {
      console.error('[cv-ai-panel]', err)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao conectar com a IA.' }])
    } finally {
      setLoading(false)
    }
  }, [loading, messages, onBeforeSend, onCvUpdated])

  if (variant === 'overlay' && !open) return null

  const panelContent = (
    <>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '0.5px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--purple)', fontSize: 14 }}>✦</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Assistente de CV</span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              style={{ fontSize: 10, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
            >
              Limpar
            </button>
          )}
          {variant === 'sidebar' && (
            <button
              onClick={() => setCollapsed(true)}
              title="Recolher"
              style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14, padding: '2px 4px', lineHeight: 1 }}
            >
              ›
            </button>
          )}
          {variant === 'overlay' && (
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 18, padding: '2px 4px', lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ color: 'var(--text3)', fontSize: 12, textAlign: 'center', marginTop: 24 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✦</div>
            Pergunte qualquer coisa sobre o seu CV ou clique em ✦ em qualquer elemento para melhorá-lo.
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {msg.toolCalls.map((tool, ti) => (
                  <div key={ti} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text3)' }}>
                    <span style={{ color: 'var(--green)' }}>✓</span>
                    <span style={{ color: 'var(--purple)', fontFamily: 'var(--mono)' }}>{tool}()</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '90%',
              background: msg.role === 'user' ? 'var(--accent-dim)' : 'var(--bg3)',
              border: `0.5px solid ${msg.role === 'user' ? 'rgba(228,253,139,.2)' : 'var(--border)'}`,
              borderRadius: 'var(--rsm)',
              padding: '8px 12px',
              fontSize: 12,
              color: msg.role === 'user' ? 'var(--accent)' : 'var(--text2)',
              lineHeight: 1.6,
            }}>
              {msg.role === 'assistant' ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{
            alignSelf: 'flex-start', background: 'var(--bg3)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--rsm)', padding: '8px 12px', fontSize: 12, color: 'var(--text3)',
          }}>
            <span style={{ animation: 'pulse 1s infinite' }}>✦ pensando…</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: '0.5px solid var(--border)', flexShrink: 0, display: 'flex', gap: 6 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
          placeholder="Peça para a IA melhorar seu CV…"
          disabled={loading}
          style={{
            flex: 1, background: 'var(--bg3)', border: '0.5px solid var(--border2)',
            borderRadius: 'var(--rsm)', padding: '8px 12px', fontSize: 12,
            color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none',
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{
            background: 'var(--accent)', color: 'var(--accent-text)', border: 'none',
            borderRadius: 'var(--rsm)', padding: '8px 14px', fontSize: 12,
            fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading || !input.trim() ? 0.5 : 1,
          }}
        >
          →
        </button>
      </div>
    </>
  )

  if (variant === 'sidebar') {
    if (collapsed) {
      return (
        <div style={{
          width: 36,
          flexShrink: 0,
          borderLeft: '0.5px solid var(--border2)',
          background: 'var(--bg2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 12,
          height: '100%',
          overflow: 'hidden',
          transition: 'width 0.2s ease',
        }}>
          <button
            onClick={() => setCollapsed(false)}
            title="Abrir assistente"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--purple)', fontSize: 16, padding: 6,
              borderRadius: 'var(--rsm)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}
          >
            <span>✦</span>
            <span style={{ fontSize: 9, color: 'var(--text3)', writingMode: 'vertical-rl', letterSpacing: 1 }}>IA</span>
          </button>
        </div>
      )
    }

    return (
      <div style={{
        width: 360,
        flexShrink: 0,
        borderLeft: '0.5px solid var(--border2)',
        background: 'var(--bg2)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        transition: 'width 0.2s ease',
      }}>
        {panelContent}
      </div>
    )
  }

  // overlay (default)
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
      pointerEvents: 'none',
    }}>
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', pointerEvents: 'auto' }}
        className="md:hidden"
      />
      <div style={{
        position: 'relative',
        width: 'min(420px, 100vw)',
        height: 'min(600px, 100dvh - 60px)',
        background: 'var(--bg2)',
        border: '0.5px solid var(--border2)',
        borderRadius: 'var(--r) 0 0 var(--r)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.4)',
        pointerEvents: 'auto',
      }}>
        {panelContent}
      </div>
    </div>
  )
}
