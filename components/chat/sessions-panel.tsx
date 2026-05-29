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

function formatSessionDate(iso: string): string {
  const date      = new Date(iso)
  const now       = new Date()
  const isToday   = date.toDateString() === now.toDateString()
  const isYest    = date.toDateString() === new Date(now.getTime() - 86_400_000).toDateString()
  const diffDays  = Math.floor((now.getTime() - date.getTime()) / 86_400_000)

  if (isToday)    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (isYest)     return 'ontem'
  if (diffDays < 7) return date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')
}

const PANEL_WIDTH_DESKTOP = 'min(30vw, 380px)'
const PANEL_WIDTH_MOBILE  = 'min(95vw, 420px)'

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
    if (isMobile) onToggle()
  }

  function handleNew() {
    onNew()
    if (isMobile) onToggle()
  }

  const panelContent = (
    <div style={{
      width: isMobile ? PANEL_WIDTH_MOBILE : PANEL_WIDTH_DESKTOP,
      height: '100%',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg)',
      borderLeft: '0.5px solid var(--border)',
    }}>

      {/* Header */}
      <div style={{
        padding: '18px 20px 14px',
        borderBottom: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            Histórico
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
            {sessions.length > 0 ? `${sessions.length} conversa${sessions.length !== 1 ? 's' : ''}` : 'Nenhuma conversa'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleNew}
            title="Nova conversa"
            style={{
              height: 34, paddingInline: 14,
              borderRadius: 8,
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--accent-dim)',
              border: '0.5px solid rgba(228,253,139,.25)',
              cursor: 'pointer', color: 'var(--accent)',
              fontSize: 12, fontWeight: 600,
            }}
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 12, height: 12 }}>
              <line x1="7" y1="2" x2="7" y2="12" /><line x1="2" y1="7" x2="12" y2="7" />
            </svg>
            Nova
          </button>
          <button
            onClick={onToggle}
            title="Fechar"
            style={{
              width: 34, height: 34, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: '0.5px solid var(--border2)',
              cursor: 'pointer', color: 'var(--text3)', fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {loading && (
          <div style={{ fontSize: 13, color: 'var(--text3)', padding: '20px 20px' }}>
            Carregando…
          </div>
        )}
        {!loading && sessions.length === 0 && (
          <div style={{ fontSize: 13, color: 'var(--text3)', padding: '20px', lineHeight: 1.6 }}>
            Nenhuma conversa ainda.<br />Comece uma para ela aparecer aqui.
          </div>
        )}
        {sessions.map(session => {
          const isActive = session.id === activeSessionId
          const isPrep   = session.title?.startsWith('Prep ·')
          const isCV     = session.title?.startsWith('CV ·')
          const isMentor = session.mode === 'mentor' && !isPrep

          const displayTitle = isPrep
            ? session.title!.replace(/^Prep · /, '')
            : isCV
              ? session.title!.replace(/^CV · /, '')
              : (session.title ?? 'Sem título')

          return (
            <button
              key={session.id}
              onClick={() => handleSelect(session)}
              style={{
                width: '100%', textAlign: 'left',
                padding: '12px 20px',
                cursor: 'pointer',
                background: isActive ? 'var(--bg3)' : 'none',
                border: 'none',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                display: 'flex', flexDirection: 'column', gap: 5,
              }}
            >
              {/* Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                {session.day_number && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                    background: 'rgba(100,40,130,0.15)', color: 'var(--purple)',
                    padding: '2px 7px', borderRadius: 5, flexShrink: 0,
                  }}>
                    DIA {session.day_number}
                  </span>
                )}
                {isPrep && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                    background: 'rgba(255,107,53,0.14)', color: '#c0460e',
                    padding: '2px 7px', borderRadius: 5, flexShrink: 0,
                  }}>
                    PREP
                  </span>
                )}
                {isMentor && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                    background: 'var(--teal-dim)', color: 'var(--teal)',
                    padding: '2px 7px', borderRadius: 5, flexShrink: 0,
                  }}>
                    MENTOR
                  </span>
                )}
                {isCV && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                    background: 'rgba(228,253,139,0.15)', color: 'var(--accent)',
                    padding: '2px 7px', borderRadius: 5, flexShrink: 0,
                  }}>
                    CV
                  </span>
                )}
              </div>

              {/* Title */}
              <span style={{
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--text)' : 'var(--text2)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                display: 'block',
                lineHeight: 1.4,
              }}>
                {displayTitle}
              </span>

              {/* Date */}
              <span style={{
                fontSize: 12,
                color: 'var(--text3)',
                fontFamily: 'var(--mono)',
              }}>
                {formatSessionDate(session.updated_at)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )

  // Mobile: overlay drawer from the right
  if (isMobile) {
    if (!isOpen) return null
    return (
      <>
        <div
          onClick={onToggle}
          style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.55)' }}
        />
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          zIndex: 100, boxShadow: '-6px 0 32px rgba(0,0,0,0.45)',
        }}>
          {panelContent}
        </div>
      </>
    )
  }

  // Desktop: inline collapsible
  return (
    <div style={{
      width: isOpen ? PANEL_WIDTH_DESKTOP : 0,
      flexShrink: 0,
      overflow: 'hidden',
      transition: 'width 0.22s ease',
      height: '100%',
    }}>
      {panelContent}
    </div>
  )
}
