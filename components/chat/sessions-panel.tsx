'use client'

import { useEffect, useState } from 'react'

interface ChatSession {
  id: string
  title: string | null
  mode: 'task' | 'mentor'
  day_number: number | null
  created_at: string
  updated_at: string
}

interface SessionsPanelProps {
  isOpen: boolean
  onToggle: () => void
  activeSessionId: string | null
  onSelect: (session: ChatSession) => void
  onNew: () => void
  refreshTrigger?: number
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 1)   return 'agora'
  if (mins  < 60)  return `${mins}m`
  if (hours < 24)  return `${hours}h`
  if (days  < 7)   return `${days}d`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function SessionsPanel({ isOpen, onToggle, activeSessionId, onSelect, onNew, refreshTrigger }: SessionsPanelProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading]   = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    fetch('/api/chat/sessions')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setSessions(data) })
      .finally(() => setLoading(false))
  }, [refreshTrigger])

  function handleSelect(session: ChatSession) {
    onSelect(session)
    if (isMobile) onToggle() // auto-close drawer on mobile after selection
  }

  function handleNew() {
    onNew()
    if (isMobile) onToggle()
  }

  const panelContent = (
    <div style={{
      width: 220, height: '100%',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg)',
      borderRight: isMobile ? 'none' : '0.5px solid var(--border)',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 14px 10px',
        borderBottom: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Conversas
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={handleNew}
            title="Nova conversa"
            style={{
              width: 22, height: 22, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: '0.5px solid var(--border2)',
              cursor: 'pointer', color: 'var(--text2)', fontSize: 14, lineHeight: 1,
            }}
          >
            +
          </button>
          <button
            onClick={onToggle}
            title="Fechar"
            style={{
              width: 22, height: 22, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: '0.5px solid var(--border2)',
              cursor: 'pointer', color: 'var(--text3)', fontSize: 12, lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {loading && (
          <div style={{ fontSize: 11, color: 'var(--text3)', padding: '12px 14px' }}>
            Carregando...
          </div>
        )}
        {!loading && sessions.length === 0 && (
          <div style={{ fontSize: 11, color: 'var(--text3)', padding: '12px 14px', lineHeight: 1.5 }}>
            Nenhuma conversa ainda.
          </div>
        )}
        {sessions.map(session => {
          const isActive = session.id === activeSessionId
          return (
            <button
              key={session.id}
              onClick={() => handleSelect(session)}
              style={{
                width: '100%', textAlign: 'left',
                padding: '8px 14px', cursor: 'pointer',
                background: isActive ? 'var(--bg3)' : 'none',
                border: 'none',
                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                display: 'flex', flexDirection: 'column', gap: 3,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {session.day_number && (
                  <span style={{
                    fontSize: 9, background: 'var(--bg4)', color: 'var(--purple)',
                    padding: '1px 5px', borderRadius: 4, flexShrink: 0,
                  }}>
                    Dia {session.day_number}
                  </span>
                )}
                {session.mode === 'mentor' && (
                  <span style={{
                    fontSize: 9, background: 'var(--teal-dim)', color: 'var(--teal)',
                    padding: '1px 5px', borderRadius: 4, flexShrink: 0,
                  }}>
                    Mentor
                  </span>
                )}
              </div>
              <span style={{
                fontSize: 12, color: isActive ? 'var(--text)' : 'var(--text2)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                display: 'block', maxWidth: '100%',
              }}>
                {session.title ?? 'Sem título'}
              </span>
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>
                {timeAgo(session.updated_at)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )

  // Mobile: full-screen overlay drawer
  if (isMobile) {
    if (!isOpen) return null
    return (
      <>
        {/* Backdrop */}
        <div
          onClick={onToggle}
          style={{
            position: 'fixed', inset: 0, zIndex: 99,
            background: 'rgba(0,0,0,0.5)',
          }}
        />
        {/* Drawer */}
        <div style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          zIndex: 100, boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
        }}>
          {panelContent}
        </div>
      </>
    )
  }

  // Desktop: inline collapsible
  return (
    <div style={{
      width: isOpen ? 220 : 0,
      flexShrink: 0,
      overflow: 'hidden',
      transition: 'width 0.2s ease',
      height: '100%',
    }}>
      {panelContent}
    </div>
  )
}
