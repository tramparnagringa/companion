'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Topbar } from '@/components/layout/topbar'
import { ChatWindow } from '@/components/chat/chat-window'
import { SessionsPanel } from '@/components/chat/sessions-panel'
import { createClient } from '@/lib/supabase/client'
import type { JobContext } from '@/lib/anthropic/system-prompts'

interface LoadedSession {
  id: string
  title: string | null
  mode: 'task' | 'mentor'
  day_number: number | null
}

export default function ChatPage() {
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const urlPrompt     = searchParams.get('prompt') ?? undefined
  const dayParam      = searchParams.get('day')
  const dayNumber     = dayParam ? parseInt(dayParam, 10) : undefined
  const slug          = searchParams.get('slug') ?? undefined
  const jobId         = searchParams.get('jobId') ?? undefined

  const [chatKey, setChatKey]             = useState('new')
  const [sessionToLoad, setSessionToLoad] = useState<string | null>(null)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [panelRefresh, setPanelRefresh]   = useState(0)
  const [isPanelOpen, setIsPanelOpen]     = useState(false)
  const [userName, setUserName]           = useState<string | undefined>(undefined)
  const [jobContext, setJobContext]        = useState<JobContext | null>(null)
  const [jobLoading, setJobLoading]       = useState(!!jobId)
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(jobId ? undefined : urlPrompt)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user
      if (!u) return
      const name = (u.user_metadata?.full_name as string | undefined)?.split(' ')[0]
        ?? u.email?.split('@')[0]
      setUserName(name)
    })
  }, [])

  // Fetch job context when jobId is present
  useEffect(() => {
    if (!jobId) return
    createClient()
      .from('jobs')
      .select('company_name, role_title, fit_score, analysis_notes, strong_keywords, weak_keywords')
      .eq('id', jobId)
      .single()
      .then(({ data }) => {
        if (data) {
          setJobContext({
            company:        data.company_name,
            role:           data.role_title,
            fitScore:       data.fit_score,
            analysisNotes:  data.analysis_notes,
            strongKeywords: data.strong_keywords,
            weakKeywords:   data.weak_keywords,
          })
          setInitialPrompt(
            urlPrompt ?? `Quero me preparar para a entrevista na ${data.company_name} — ${data.role_title}`
          )
        }
        setJobLoading(false)
      })
  }, [jobId]) // eslint-disable-line react-hooks/exhaustive-deps

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
    router.push('/chat')
  }, [router])

  const breadcrumb = (
    <div className="topbar-crumb">
      <strong>Mentor IA</strong>
      {dayNumber && (
        <>
          <span className="sep crumb-detail">/</span>
          <span className="crumb-detail">Dia {dayNumber}</span>
        </>
      )}
      {jobContext && !dayNumber && (
        <>
          <span className="sep crumb-detail">/</span>
          <span className="crumb-detail">Prep · {jobContext.company}</span>
        </>
      )}
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
      <Topbar title={breadcrumb} actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {dayNumber && slug && (
            <a
              href={`/${slug}/days/${dayNumber}`}
              style={{
                fontSize: 11, fontWeight: 600, color: 'var(--tng-ink-3)',
                display: 'inline-flex', alignItems: 'center', gap: 4,
                textDecoration: 'none',
                padding: '5px 10px', borderRadius: 8,
                border: '1px solid var(--tng-rule)',
                fontFamily: 'var(--tng-font-mono)',
                transition: 'color .15s',
              }}
            >
              ← Dia {dayNumber}
            </a>
          )}
          {historyToggle}
        </div>
      } />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', position: 'relative' }}>
        <div className="chat-area" style={{
          flex: 1, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          minWidth: 0,
        }}>
          {jobLoading ? (
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--tng-mute)', fontSize: 13, fontFamily: 'var(--tng-font-mono)',
            }}>
              ✦ Carregando contexto da vaga...
            </div>
          ) : (
            <ChatWindow
              key={chatKey}
              initialPrompt={sessionToLoad ? undefined : initialPrompt}
              dayNumber={dayNumber}
              slug={slug}
              mode={dayNumber ? 'task' : 'mentor'}
              loadSessionId={sessionToLoad}
              onSessionCreated={handleSessionCreated}
              userName={userName}
              jobContext={jobContext}
            />
          )}
        </div>

        <SessionsPanel
          isOpen={isPanelOpen}
          onToggle={() => setIsPanelOpen(o => !o)}
          activeSessionId={activeSessionId}
          onSelect={handleSelectSession}
          onNew={handleNewChat}
          refreshTrigger={panelRefresh}
        />
      </div>
    </div>
  )
}
