'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/topbar'
import { ChatWindow } from '@/components/chat/chat-window'
import { SessionsPanel } from '@/components/chat/sessions-panel'

interface LoadedSession {
  id: string
  title: string | null
  mode: 'task' | 'mentor'
  day_number: number | null
}

export default function ChatPage() {
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const initialPrompt = searchParams.get('prompt') ?? undefined
  const dayParam      = searchParams.get('day')
  const dayNumber     = dayParam ? parseInt(dayParam, 10) : undefined

  // chatKey controls ChatWindow remount (only on explicit session switch / new chat)
  const [chatKey, setChatKey]             = useState('new')
  // sessionToLoad tells ChatWindow to fetch+restore a past session
  const [sessionToLoad, setSessionToLoad] = useState<string | null>(null)
  // activeSessionId just highlights the correct item in the panel
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [panelRefresh, setPanelRefresh]   = useState(0)
  const [isPanelOpen, setIsPanelOpen]     = useState(false)

  // Open panel by default on wide screens
  useEffect(() => {
    if (window.innerWidth >= 900) setIsPanelOpen(true)
  }, [])

  // Session created during current chat — just update panel, don't remount
  const handleSessionCreated = useCallback((id: string) => {
    setActiveSessionId(id)
    setPanelRefresh(n => n + 1)
  }, [])

  // User clicked a past session — remount ChatWindow to load it
  const handleSelectSession = useCallback((session: LoadedSession) => {
    setActiveSessionId(session.id)
    setSessionToLoad(session.id)
    setChatKey(session.id)
  }, [])

  // User clicked "Nova conversa" — navigate to clean /chat URL
  const handleNewChat = useCallback(() => {
    setActiveSessionId(null)
    setSessionToLoad(null)
    setChatKey('new-' + Date.now())
    router.push('/chat')
  }, [router])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title="Chat + Mentor" subtitle="Conversa livre com IA" />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
        <SessionsPanel
          isOpen={isPanelOpen}
          onToggle={() => setIsPanelOpen(o => !o)}
          activeSessionId={activeSessionId}
          onSelect={handleSelectSession}
          onNew={handleNewChat}
          refreshTrigger={panelRefresh}
        />

        {/* Chat area */}
        <div style={{
          flex: 1, overflow: 'hidden',
          padding: '20px 24px',
          display: 'flex', flexDirection: 'column',
          minWidth: 0,
        }}>
          {/* Toggle button row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <button
              onClick={() => setIsPanelOpen(o => !o)}
              title={isPanelOpen ? 'Ocultar conversas' : 'Ver conversas'}
              style={{
                width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isPanelOpen ? 'var(--bg3)' : 'none',
                border: '0.5px solid var(--border2)',
                cursor: 'pointer', color: 'var(--text3)', fontSize: 13,
              }}
            >
              ☰
            </button>
            {dayNumber && (
              <a
                href="/today"
                style={{
                  fontSize: 11, fontWeight: 500, color: 'var(--text3)',
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  textDecoration: 'none',
                  padding: '4px 8px', borderRadius: 6,
                  border: '0.5px solid var(--border2)',
                  transition: 'color .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
              >
                ← Dia {dayNumber}
              </a>
            )}
          </div>

          <ChatWindow
            key={chatKey}
            initialPrompt={sessionToLoad ? undefined : initialPrompt}
            dayNumber={dayNumber}
            loadSessionId={sessionToLoad}
            onSessionCreated={handleSessionCreated}
          />
        </div>
      </div>
    </div>
  )
}
