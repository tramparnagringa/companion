'use client'

import { useEffect, useRef, useState } from 'react'

type Round = 'HR Screening' | 'Behavioral' | 'Technical' | 'Offer Negotiation'
type Mode  = 'guided' | 'pit'

interface Feedback { type: 'positive' | 'warning' | 'negative' | 'tip'; text: string }
interface AnnotatedSegment { text: string; quality: 'strong' | 'ok' | 'weak' }
interface QuestionReview {
  question: string
  answer: string
  score: number
  feedback: Feedback[]
  annotated: AnnotatedSegment[]
}
interface DebriefData {
  verdict: string
  scores: { clareza: number; evidencia: number; ingles: number }
  questions: QuestionReview[]
}

interface HistoryEntry { date: string; round: string; mode: string; avg: number }

interface DebriefScreenProps {
  debriefData: DebriefData | null
  isLoading: boolean
  round: Round
  mode: Mode
  duration: number
  recordingBlob: Blob | null
  onRestart: () => void
}

const STORAGE_KEY = 'tng_arena_history'

const FEEDBACK_ICONS: Record<string, string> = {
  positive: '✅',
  warning: '⚠️',
  negative: '❌',
  tip: '💡',
}

const QUALITY_STYLES: Record<string, { bg: string; color: string }> = {
  strong: { bg: 'rgba(40,201,65,.12)',  color: '#28c941' },
  ok:     { bg: 'rgba(255,189,46,.12)', color: '#ffbd2e' },
  weak:   { bg: 'rgba(255,59,48,.12)',  color: '#ff3b30' },
}

function Ring({ value, color, label, sub }: { value: number; color: string; label: string; sub: string }) {
  const r = 30
  const circ = 2 * Math.PI * r
  const offset = circ - (value / 100) * circ
  return (
    <div style={{
      background: 'var(--bg2)', border: '0.5px solid var(--border)',
      borderRadius: 14, padding: '18px 12px', textAlign: 'center',
    }}>
      <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto 12px' }}>
        <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="36" cy="36" r={r} fill="none" stroke="var(--border)" strokeWidth="5" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: '.05em', color,
        }}>
          {value}
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 10, color: 'var(--text3)' }}>{sub}</div>
    </div>
  )
}

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}m ${String(sec).padStart(2, '0')}s`
}

export function DebriefScreen({ debriefData, isLoading, round, mode, duration, recordingBlob, onRestart }: DebriefScreenProps) {
  const [tab, setTab] = useState<'perq' | 'anotada' | 'hist'>('perq')
  const [openQ, setOpenQ] = useState<number | null>(0)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const savedRef = useRef(false)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    setHistory(raw ? JSON.parse(raw) : [])
  }, [])

  // Save this session to history once debrief loads
  useEffect(() => {
    if (!debriefData || savedRef.current) return
    savedRef.current = true
    const avg = Math.round((debriefData.scores.clareza + debriefData.scores.evidencia + debriefData.scores.ingles) / 3)
    const entry: HistoryEntry = { date: new Date().toISOString(), round, mode, avg }
    const updated = [...history, entry].slice(-21)
    setHistory(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }, [debriefData]) // eslint-disable-line

  const downloadRecording = () => {
    if (!recordingBlob) return
    const url = URL.createObjectURL(recordingBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `arena-${round.toLowerCase().replace(/ /g, '-')}-${Date.now()}.webm`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100dvh', background: 'var(--bg)', gap: 16,
      }}>
        <div style={{ display: 'inline-flex', gap: 4 }}>
          {[0, 0.2, 0.4].map((d, i) => (
            <span key={i} style={{
              width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)',
              animation: `typingDot 1.2s ease-in-out ${d}s infinite`, display: 'inline-block',
            }} />
          ))}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text3)' }}>Gerando debrief…</div>
        <style>{`@keyframes typingDot{0%,80%,100%{transform:translateY(0);opacity:.3;}40%{transform:translateY(-5px);opacity:1;}}`}</style>
      </div>
    )
  }

  if (!debriefData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div>Não foi possível gerar o debrief.</div>
          <button onClick={onRestart} style={{ marginTop: 16, background: 'var(--accent)', color: '#0c0c0e', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  const { verdict, scores, questions } = debriefData
  const avg = Math.round((scores.clareza + scores.evidencia + scores.ingles) / 3)
  const verdictColor = avg >= 75 ? 'var(--accent)' : avg >= 60 ? '#ffbd2e' : mode === 'pit' ? '#ff3b30' : '#ffbd2e'
  const isPit = mode === 'pit'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 20px 60px', overflowY: 'auto', minHeight: '100dvh',
      background: 'var(--bg)', position: 'relative',
    }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 50% 30% at 50% 0%, rgba(228,253,139,0.05) 0%, transparent 70%)' }} />

      <div style={{ width: '100%', maxWidth: 580, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 'clamp(52px, 13vw, 80px)',
            letterSpacing: '0.04em', lineHeight: 0.95,
            marginBottom: 6, color: verdictColor,
          }}>
            {verdict}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 300 }}>
            {round} · {questions.length} perguntas · {fmt(duration)}
          </div>
        </div>

        {/* Pit banner */}
        {isPit && (
          <div style={{
            background: 'rgba(255,59,48,0.07)', border: '0.5px solid rgba(255,59,48,0.18)',
            borderRadius: 12, padding: '14px 16px', fontSize: 12, lineHeight: 1.6,
            color: 'var(--text3)', marginBottom: 24,
          }}>
            <strong style={{ color: '#ff3b30' }}>The Pit completado.</strong> Sem hints, sem estrutura, sem pausa.
            Agora você sabe o que aguenta sob pressão real.
          </div>
        )}

        {/* Scores */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          <Ring value={scores.clareza}  color="var(--accent)" label="Clareza"   sub="Estrutura" />
          <Ring value={scores.evidencia} color="#ffbd2e"       label="Evidência" sub="Métricas"  />
          <Ring value={scores.ingles}   color="#5db8ff"        label="Inglês"    sub="Fluência"  />
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 3, background: 'var(--bg2)', border: '0.5px solid var(--border)',
          borderRadius: 10, padding: 3, marginBottom: 18,
        }}>
          {([['perq', 'Por pergunta'], ['anotada', 'Anotada'], ['hist', 'Histórico']] as [typeof tab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: '8px 4px', borderRadius: 7, fontSize: 11, fontWeight: 600,
              textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
              border: tab === id ? '0.5px solid var(--border)' : 'none',
              background: tab === id ? 'var(--bg3)' : 'transparent',
              color: tab === id ? 'var(--text)' : 'var(--text3)',
              fontFamily: 'inherit',
            }}>{label}</button>
          ))}
        </div>

        {/* Per question tab */}
        {tab === 'perq' && questions.map((q, i) => {
          const scoreColor = q.score >= 75 ? '#28c941' : q.score >= 55 ? '#ffbd2e' : '#ff3b30'
          const isOpen = openQ === i
          return (
            <div key={i} style={{
              background: 'var(--bg2)', border: '0.5px solid var(--border)',
              borderRadius: 12, overflow: 'hidden', marginBottom: 8,
            }}>
              <div onClick={() => setOpenQ(isOpen ? null : i)} style={{
                padding: '13px 16px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: 12, cursor: 'pointer',
              }}>
                <div style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{q.question}</div>
                <div style={{
                  fontFamily: 'monospace', fontSize: 10, fontWeight: 600,
                  padding: '3px 8px', borderRadius: 5, flexShrink: 0,
                  background: `${scoreColor}18`, color: scoreColor,
                }}>
                  {q.score}
                </div>
              </div>
              {isOpen && (
                <div style={{ padding: '0 16px 14px', borderTop: '0.5px solid var(--border)' }}>
                  <div style={{
                    fontSize: 12, color: 'var(--text3)', fontStyle: 'italic',
                    lineHeight: 1.6, padding: '12px 0', marginBottom: 10,
                    borderBottom: '0.5px solid var(--border)',
                  }}>
                    &ldquo;{q.answer}&rdquo;
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                    {q.feedback.map((fb, j) => (
                      <div key={j} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 12, lineHeight: 1.5 }}>
                        <span style={{ fontSize: 13, flexShrink: 0 }}>{FEEDBACK_ICONS[fb.type]}</span>
                        <span style={{ color: 'var(--text3)' }}
                          dangerouslySetInnerHTML={{ __html: fb.text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text);font-weight:500">$1</strong>') }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Annotated tab */}
        {tab === 'anotada' && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--text3)', marginBottom: 12 }}>
              Resposta anotada
            </div>
            {questions.map((q, i) => (
              <div key={i} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, fontWeight: 500 }}>{q.question}</div>
                <div style={{ fontSize: 13, lineHeight: 1.9, color: 'var(--text3)' }}>
                  {q.annotated?.map((seg, j) => {
                    const s = QUALITY_STYLES[seg.quality] ?? QUALITY_STYLES.ok
                    return (
                      <span key={j} style={{ background: s.bg, color: s.color, borderRadius: 3, padding: '1px 3px', marginRight: 2 }}>
                        {seg.text}
                      </span>
                    )
                  }) ?? <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>{q.answer}</span>}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 4 }}>
              {[['strong', '#28c941', 'Forte'], ['ok', '#ffbd2e', 'Pode melhorar'], ['weak', '#ff3b30', 'Fraco']].map(([k, c, label]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text3)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: QUALITY_STYLES[k].bg, display: 'inline-block', border: `0.5px solid ${c}30` }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History tab */}
        {tab === 'hist' && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--text3)', marginBottom: 12 }}>
              Últimas {Math.min(history.length, 21)} sessões
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, marginBottom: 8 }}>
              {history.slice(-21).map((h, i) => {
                const isNow = i === Math.min(history.length, 21) - 1
                const c = h.avg >= 75 ? 'rgba(228,253,139,.45)' : h.avg >= 55 ? 'rgba(255,189,46,.3)' : 'rgba(255,59,48,.25)'
                const bc = h.avg >= 75 ? 'var(--accent)' : h.avg >= 55 ? '#ffbd2e' : '#ff3b30'
                return (
                  <div key={i} title={`${h.round} · ${h.avg}`} style={{
                    aspectRatio: '1', borderRadius: 4,
                    background: c, border: `0.5px solid ${bc}`,
                    outline: isNow ? '2px solid var(--accent)' : 'none',
                    outlineOffset: 2,
                    cursor: 'default',
                  }} />
                )
              })}
              {/* Empty cells */}
              {Array.from({ length: Math.max(0, 21 - history.length) }).map((_, i) => (
                <div key={`e-${i}`} style={{ aspectRatio: '1', borderRadius: 4, background: 'var(--bg3)', border: '0.5px solid var(--border)' }} />
              ))}
            </div>
            {history.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                Sessões: <strong style={{ color: 'var(--text)' }}>{history.length}</strong>
                {' · '}Média: <strong style={{ color: 'var(--text)' }}>
                  {Math.round(history.reduce((s, h) => s + h.avg, 0) / history.length)}
                </strong>
                {' · '}The Pit: <strong style={{ color: '#ff3b30' }}>
                  {history.filter(h => h.mode === 'pit').length}×
                </strong>
              </div>
            )}
          </div>
        )}

        <div style={{ height: 1, background: 'var(--border)', margin: '24px 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: recordingBlob ? 'repeat(3,1fr)' : '1fr 1fr', gap: 10 }}>
          <button onClick={onRestart} style={{
            background: 'var(--bg2)', border: '0.5px solid var(--border)',
            borderRadius: 10, padding: 14, fontFamily: 'inherit',
            fontSize: 13, fontWeight: 500, color: 'var(--text)', cursor: 'pointer',
          }}>
            ← Novo round
          </button>
          {recordingBlob && (
            <button onClick={downloadRecording} style={{
              background: 'var(--bg2)', border: '0.5px solid var(--border)',
              borderRadius: 10, padding: 14, fontFamily: 'inherit',
              fontSize: 13, fontWeight: 500, color: 'var(--text)', cursor: 'pointer',
            }}>
              ⬇ Baixar gravação
            </button>
          )}
          <button onClick={onRestart} style={{
            background: isPit ? '#ff3b30' : 'var(--accent)',
            color: isPit ? '#fff' : '#0c0c0e',
            border: 'none', borderRadius: 10, padding: 14,
            fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          }}>
            {isPit ? 'Repetir →' : 'Repetir no Pit →'}
          </button>
        </div>
      </div>
    </div>
  )
}
