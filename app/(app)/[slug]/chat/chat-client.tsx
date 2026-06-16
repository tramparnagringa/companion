'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/topbar'
import { ChatWindow } from '@/components/chat/chat-window'
import { SessionsPanel } from '@/components/chat/sessions-panel'

interface LoadedSession {
  id: string
  title: string | null
  mode: 'task' | 'mentor'
  day_number: number | null
}

export function ProgramChatClient({ slug, programName, userName }: { slug: string; programName: string; userName?: string }) {
  const router = useRouter()

  const [chatKey, setChatKey]                 = useState('new')
  const [sessionToLoad, setSessionToLoad]     = useState<string | null>(null)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [panelRefresh, setPanelRefresh]       = useState(0)
  const [isPanelOpen, setIsPanelOpen]         = useState(false)

  const handleSessionCreated = useCallback((id: string) => {
    setActiveSessionId(id)
    setPanelRefresh(n => n + 1)
  }, [])

  const handleSelectSession = useCallback((session: LoadedSession) => {
    setActiveSessionId(session.id)
    setSessionToLoad(session.id)
    setChatKey(session.id)
    setIsPanelOpen(false)
  }, [])

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null)
    setSessionToLoad(null)
    setChatKey('new-' + Date.now())
    router.push(`/${slug}/chat`)
  }, [router, slug])

  const breadcrumb = (
    <div className="topbar-crumb">
      <strong>{programName}</strong>
      <span className="sep crumb-detail">/</span>
      <span className="crumb-detail">Mentor IA</span>
    </div>
  )

  const historyToggle = (
    <button
      onClick={() => setIsPanelOpen(o => !o)}
      title={isPanelOpen ? 'Ocultar histórico' : 'Ver histórico de conversas'}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 12px', borderRadius: 8,
        background: isPanelOpen ? 'var(--tng-purple-100)' : 'transparent',
        border: `1px solid ${isPanelOpen ? 'var(--tng-purple-300)' : 'var(--tng-rule)'}`,
        color: isPanelOpen ? 'var(--tng-purple-700)' : 'var(--tng-ink-3)',
        cursor: 'pointer', fontSize: 12, fontWeight: 600,
        fontFamily: 'var(--tng-font-mono)', letterSpacing: '0.04em',
        transition: 'all .15s',
      }}
    >
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 13, height: 13 }}>
        <circle cx="8" cy="8" r="6" />
        <polyline points="8,5 8,8 10,10" />
      </svg>
      Histórico
    </button>
  )

  return (
    <div className="page-col">
      <Topbar title={breadcrumb} actions={historyToggle} />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', position: 'relative' }}>
        <div className="chat-area" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <ChatWindow
            key={chatKey}
            slug={slug}
            mode="mentor"
            loadSessionId={sessionToLoad}
            onSessionCreated={handleSessionCreated}
            userName={userName}
          />
        </div>

        <SessionsPanel
          isOpen={isPanelOpen}
          onToggle={() => setIsPanelOpen(o => !o)}
          activeSessionId={activeSessionId}
          onSelect={handleSelectSession}
          onNew={handleNewChat}
          refreshTrigger={panelRefresh}
          programSlug={slug}
        />
      </div>
    </div>
  )
}
