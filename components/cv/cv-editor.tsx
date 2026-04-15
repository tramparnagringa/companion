'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { CVContent } from './types'
import { EMPTY_CV } from './types'
import { CvDocument } from './cv-document'
import { CvAiPanel }  from './cv-ai-panel'

function parseJsonArray<T>(raw: unknown, fallback: T[]): T[] {
  if (Array.isArray(raw)) return raw as T[]
  if (typeof raw === 'string' && raw.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed as T[]
    } catch { /* ignore */ }
  }
  return fallback
}

function withDefaults(raw: unknown): CVContent {
  const c = (raw ?? {}) as Partial<CVContent>
  return {
    personal:   { ...EMPTY_CV.personal,  ...(c.personal  ?? {}) },
    summary:    parseJsonArray(c.summary, EMPTY_CV.summary).filter(Boolean).length > 0
                  ? parseJsonArray(c.summary, EMPTY_CV.summary)
                  : EMPTY_CV.summary,
    skills:     {
      primary:  { ...EMPTY_CV.skills.primary,  ...(c.skills?.primary  ?? {}) },
      adjacent: parseJsonArray(c.skills?.adjacent, []),
    },
    experience: parseJsonArray(c.experience, []).map((exp: any) => ({
      role:     exp.role     ?? '',
      company:  exp.company  ?? '',
      location: exp.location,
      period:   exp.period   ?? '',
      bullets:  parseJsonArray(exp.bullets, [{ text: '', ai_generated: false }]),
    })),
    education: parseJsonArray(c.education, []).map((edu: any) => ({
      degree:      edu.degree      ?? '',
      institution: edu.institution ?? '',
      year:        edu.year        ?? '',
    })),
    optional:   c.optional,
  }
}

interface CvVersion {
  id: string
  name: string
  is_active: boolean
  generated_by: 'manual' | 'ai'
  content: CVContent
  created_at: string
}

interface Props {
  initialVersions: CvVersion[]
}

type SaveStatus = 'saved' | 'saving' | 'unsaved'

export function CvEditor({ initialVersions }: Props) {
  const [content, setContent]          = useState<CVContent>(EMPTY_CV)
  const [versions, setVersions]        = useState<CvVersion[]>(initialVersions)
  const [activeVersion, setActiveVer]  = useState<CvVersion | null>(null)
  const [saveStatus, setSaveStatus]    = useState<SaveStatus>('saved')
  const [aiOpen, setAiOpen]            = useState(false)
  const [pendingPrompt, setPending]    = useState<string | null>(null)
  const [historyOpen, setHistory]      = useState(false)
  const [saveFlash, setSaveFlash]      = useState(false)
  const [editingName, setEditingName]  = useState(false)
  const [nameValue, setNameValue]      = useState('')
  const [isDesktop, setIsDesktop]      = useState(false)

  const saveTimer        = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentRef       = useRef<CVContent>(EMPTY_CV)
  const activeVersionRef = useRef<CvVersion | null>(null)

  // On mount: load active version, or create first version if none exist
  useEffect(() => {
    async function init() {
      let vers = initialVersions

      if (vers.length === 0) {
        // First time — create "Meu CV"
        try {
          const res = await fetch('/api/cv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Meu CV', content: EMPTY_CV }),
          })
          const created = await res.json() as CvVersion
          // Mark it active
          await fetch(`/api/cv/${created.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: true }),
          })
          vers = [{ ...created, is_active: true }]
          setVersions(vers)
        } catch { /* silent */ }
      } else if (!vers.some(v => v.is_active)) {
        // No active marked — mark the most recent
        const first = vers[0]
        await fetch(`/api/cv/${first.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: true }),
        }).catch(() => {})
        vers = vers.map((v, i) => ({ ...v, is_active: i === 0 }))
        setVersions(vers)
      }

      const active = vers.find(v => v.is_active) ?? vers[0] ?? null
      if (active) {
        const loaded = withDefaults(active.content)
        setContent(loaded)
        contentRef.current = loaded
      }
      setActiveVer(active)
      activeVersionRef.current = active
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Save content to the active version by ID
  const flushSave = useCallback(async () => {
    const v = activeVersionRef.current
    if (!v) return
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    setSaveStatus('saving')
    try {
      await fetch(`/api/cv/${v.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: contentRef.current }),
      })
      setSaveStatus('saved')
    } catch {
      setSaveStatus('unsaved')
    }
  }, [])

  const scheduleSave = useCallback((next: CVContent) => {
    contentRef.current = next
    setSaveStatus('unsaved')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const v = activeVersionRef.current
      if (!v) return
      setSaveStatus('saving')
      try {
        await fetch(`/api/cv/${v.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: next }),
        })
        setSaveStatus('saved')
      } catch {
        setSaveStatus('unsaved')
      }
    }, 1200)
  }, [])

  function updateContent(updater: (prev: CVContent) => CVContent) {
    setContent(prev => {
      const next = updater(prev)
      scheduleSave(next)
      return next
    })
  }

  // Save a copy (snapshot) of the current content as a new version
  async function saveCopy() {
    await flushSave()
    const name = new Date().toLocaleString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    try {
      const res = await fetch('/api/cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content: contentRef.current }),
      })
      const newVersion = await res.json() as CvVersion
      setVersions(prev => [newVersion, ...prev])
      setSaveFlash(true)
      setTimeout(() => setSaveFlash(false), 1800)
    } catch { /* silent */ }
  }

  async function deleteVersion(id: string) {
    try {
      await fetch(`/api/cv/${id}`, { method: 'DELETE' })
      setVersions(prev => prev.filter(v => v.id !== id))
    } catch { /* silent */ }
  }

  async function commitNameEdit() {
    if (!activeVersion) return
    const trimmed = nameValue.trim()
    setEditingName(false)
    if (!trimmed || trimmed === activeVersion.name) return
    try {
      await fetch(`/api/cv/${activeVersion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const updated = { ...activeVersion, name: trimmed }
      setActiveVer(updated)
      activeVersionRef.current = updated
      setVersions(prev => prev.map(v => v.id === activeVersion.id ? updated : v))
    } catch { /* silent */ }
  }

  // Load a version: set it as active in DB and load its content
  async function loadVersion(version: CvVersion) {
    const restored = withDefaults(version.content)
    contentRef.current = restored
    setContent(restored)
    setHistory(false)
    // Mark this version as active, unmark others
    const updated = { ...version, is_active: true }
    setActiveVer(updated)
    activeVersionRef.current = updated
    setVersions(prev => prev.map(v => ({ ...v, is_active: v.id === version.id })))
    setSaveStatus('saving')
    try {
      await Promise.all([
        // Set new active
        fetch(`/api/cv/${version.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: true }),
        }),
        // Unset previous active (if different)
        ...(activeVersion && activeVersion.id !== version.id ? [
          fetch(`/api/cv/${activeVersion.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: false }),
          }),
        ] : []),
      ])
      setSaveStatus('saved')
    } catch {
      setSaveStatus('unsaved')
    }
  }

  // Create a new blank version
  async function newCV() {
    if (!confirm('Isso vai criar um novo CV em branco. Continuar?')) return
    const blank = withDefaults(null)
    const name = `Novo CV — ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
    try {
      // Unset current active
      if (activeVersion) {
        await fetch(`/api/cv/${activeVersion.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: false }),
        })
      }
      const res = await fetch('/api/cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content: blank }),
      })
      const newVersion = await res.json() as CvVersion
      // Mark it active
      await fetch(`/api/cv/${newVersion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true }),
      })
      const activeNew = { ...newVersion, is_active: true }
      setVersions(prev => [activeNew, ...prev.map(v => ({ ...v, is_active: false }))])
      setActiveVer(activeNew)
      activeVersionRef.current = activeNew
    } catch { /* silent */ }
    contentRef.current = blank
    setContent(blank)
  }

  async function reloadActive() {
    try {
      const res  = await fetch('/api/cv', { cache: 'no-store' })
      const data = await res.json() as { versions: CvVersion[] }
      if (data.versions) {
        setVersions(data.versions)
        const active = data.versions.find(v => v.is_active) ?? data.versions[0] ?? null
        if (active) {
          setContent(withDefaults(active.content))
          setActiveVer(active)
          activeVersionRef.current = active
        }
      }
      setSaveStatus('saved')
    } catch (err) {
      console.error('[reloadActive]', err)
    }
  }

  function triggerAiAction(prompt: string) {
    setPending(prompt)
    setAiOpen(true)
  }

  return (
    <div data-cv-editor style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Top bar ── */}
      <div data-print-hide style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 16px', borderBottom: '0.5px solid var(--border)',
        background: 'var(--bg2)', flexShrink: 0,
      }}>

        {/* Current version name — always visible */}
        {editingName && activeVersion ? (
          <input
            autoFocus
            value={nameValue}
            onChange={e => setNameValue(e.target.value)}
            onBlur={commitNameEdit}
            onKeyDown={e => {
              if (e.key === 'Enter') commitNameEdit()
              if (e.key === 'Escape') setEditingName(false)
            }}
            style={{
              background: 'var(--bg3)', border: '0.5px solid var(--accent)',
              borderRadius: 'var(--rsm)', padding: '3px 8px', fontSize: 12,
              color: 'var(--text)', fontFamily: 'var(--font)', outline: 'none', width: 180,
            }}
          />
        ) : (
          <button
            onClick={() => activeVersion && (setNameValue(activeVersion.name), setEditingName(true))}
            title={activeVersion ? 'Clique para renomear' : undefined}
            style={{
              background: 'none', border: 'none', padding: '2px 4px',
              fontSize: 12, fontWeight: 500, color: 'var(--text2)',
              cursor: activeVersion ? 'text' : 'default', borderRadius: 'var(--rsm)',
            }}
          >
            {activeVersion?.name ?? ''}
          </button>
        )}

        <span style={{
          fontSize: 10,
          color: saveStatus === 'saved'  ? 'var(--green)'
               : saveStatus === 'saving' ? 'var(--accent)'
               : 'var(--text3)',
          transition: 'color 0.2s',
        }}>
          {saveStatus === 'saved' ? '● salvo' : saveStatus === 'saving' ? '● salvando…' : '● não salvo'}
        </span>

        <div style={{ flex: 1 }} />

        {/* Histórico */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setHistory(o => !o)}
            style={{
              background: historyOpen ? 'var(--bg4)' : 'var(--bg3)',
              border: '0.5px solid var(--border2)', borderRadius: 'var(--rsm)',
              padding: '5px 10px', fontSize: 11,
              color: 'var(--text2)', cursor: 'pointer',
            }}
          >
            Versões {versions.length > 0 && `(${versions.length})`}
          </button>

          {historyOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              width: 260, background: 'var(--bg2)',
              border: '0.5px solid var(--border2)', borderRadius: 'var(--r)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 40,
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '8px 12px', borderBottom: '0.5px solid var(--border)',
                fontSize: 10, fontWeight: 600, color: 'var(--text3)',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Versões salvas
              </div>
              {versions.length === 0 ? (
                <div style={{ padding: '16px 12px', fontSize: 12, color: 'var(--text4)', textAlign: 'center' }}>
                  Nenhuma versão ainda.
                </div>
              ) : (
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {versions.map(v => (
                    <div
                      key={v.id}
                      onClick={() => !v.is_active && loadVersion(v)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '9px 12px', borderBottom: '0.5px solid var(--border)',
                        cursor: v.is_active ? 'default' : 'pointer',
                        background: v.is_active ? 'var(--bg3)' : 'transparent',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name}</span>
                          {v.is_active && <span style={{ fontSize: 9, color: 'var(--green)', fontWeight: 600, letterSpacing: '0.04em', flexShrink: 0 }}>ATIVA</span>}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>
                          {v.created_at ? new Date(v.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </div>
                      </div>
                      {!v.is_active && (
                        <button
                          onClick={e => { e.stopPropagation(); deleteVersion(v.id) }}
                          title="Apagar versão"
                          style={{
                            fontSize: 15, padding: '2px 5px', borderRadius: 'var(--rsm)',
                            background: 'none', border: 'none',
                            color: 'var(--text4)', cursor: 'pointer', flexShrink: 0,
                            lineHeight: 1,
                          }}
                        >×</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* New blank CV */}
        <button
          onClick={newCV}
          style={{
            background: 'var(--accent)', color: 'var(--accent-text)', border: 'none',
            borderRadius: 'var(--rsm)', padding: '5px 13px', fontSize: 12,
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          Novo CV
        </button>

        {/* Save copy */}
        <button
          onClick={saveCopy}
          style={{
            background: saveFlash ? 'var(--green-dim)' : 'transparent',
            color: saveFlash ? 'var(--green)' : 'var(--text2)',
            border: saveFlash ? '0.5px solid var(--green)' : '0.5px solid var(--border2)',
            borderRadius: 'var(--rsm)', padding: '5px 13px', fontSize: 12,
            fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s, color 0.2s, border-color 0.2s',
          }}
        >
          {saveFlash ? '✓ Salvo' : 'Salvar cópia'}
        </button>

        {/* AI button — only on mobile */}
        {!isDesktop && (
          <button
            onClick={() => setAiOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: aiOpen ? 'var(--purple-dim)' : 'var(--bg3)',
              border: `0.5px solid ${aiOpen ? 'rgba(167,139,250,.3)' : 'var(--border2)'}`,
              borderRadius: 'var(--rsm)', padding: '5px 12px',
              fontSize: 12, color: aiOpen ? 'var(--purple)' : 'var(--text2)',
              cursor: 'pointer',
            }}
          >
            <span>✦</span> IA
          </button>
        )}
      </div>

      {/* ── Document + AI panel ── */}
      <div
        data-cv-body
        style={{ flex: 1, overflow: 'hidden', display: 'flex' }}
        onClick={() => historyOpen && setHistory(false)}
      >
        <div data-cv-scroll style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          <CvDocument
            content={content}
            onChange={updateContent}
            onAiAction={triggerAiAction}
          />
        </div>

        <div data-print-hide style={{ display: 'contents' }}>
          <CvAiPanel
            variant={isDesktop ? 'sidebar' : 'overlay'}
            open={isDesktop || aiOpen}
            onClose={() => setAiOpen(false)}
            pendingPrompt={pendingPrompt}
            onPromptConsumed={() => setPending(null)}
            onBeforeSend={flushSave}
            onCvUpdated={reloadActive}
          />
        </div>
      </div>
    </div>
  )
}
