'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

type Round = 'HR Screening' | 'Behavioral' | 'Technical' | 'Offer Negotiation'
type Mode  = 'guided' | 'pit'

interface Message {
  role: 'interviewer' | 'candidate'
  content: string
}

interface Profile {
  target_role?: string | null
  seniority?: string | null
  tech_stack?: string[] | null
  years_experience?: number | null
  value_proposition?: string | null
  salary_min?: number | null
  salary_max?: number | null
  salary_currency?: string | null
}

interface CallScreenProps {
  round: Round
  mode: Mode
  profile: Profile | null
  userName: string
  onEnd: (transcript: Message[], recordingBlob: Blob | null) => void
}

const INTERVIEWERS: Record<Round, { name: string; title: string; emoji: string }> = {
  'HR Screening':      { name: 'Sarah Chen',   title: 'Senior Recruiter',          emoji: '👩‍💼' },
  'Behavioral':        { name: 'Marcus Webb',  title: 'Engineering Manager',        emoji: '🧑‍💼' },
  'Technical':         { name: 'Priya Sharma', title: 'Staff Engineer',             emoji: '👩‍💻' },
  'Offer Negotiation': { name: 'James Torres', title: 'Head of Talent Acquisition', emoji: '🤝' },
}

const DURATION_SECONDS: Record<Round, number> = {
  'HR Screening': 15 * 60,
  'Behavioral': 25 * 60,
  'Technical': 30 * 60,
  'Offer Negotiation': 20 * 60,
}

const PIT_Q_SECONDS = 90

const HINTS: Record<Round, string> = {
  'HR Screening': 'Prepare seu "why now" e tenha clareza sobre expectativa salarial antes de responder.',
  'Behavioral': 'Use estrutura STAR: Situação → Tarefa → Ação → Resultado com métricas.',
  'Technical': 'Pense em voz alta. Explique seu raciocínio antes de dar a solução final.',
  'Offer Negotiation': 'Não aceite a primeira oferta. Ancore com sua pesquisa de mercado.',
}

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export function CallScreen({ round, mode, profile, userName, onEnd }: CallScreenProps) {
  const iv = INTERVIEWERS[round]
  const isPit = mode === 'pit'

  // Camera
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [cameraError, setCameraError] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  // Conversation
  const [messages, setMessages] = useState<Message[]>([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [input, setInput] = useState('')
  const [sessionEnded, setSessionEnded] = useState(false)

  // Timers
  const [elapsed, setElapsed] = useState(0)
  const [pitSecs, setPitSecs] = useState(PIT_Q_SECONDS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pitRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalSecs = DURATION_SECONDS[round]
  const remaining = Math.max(0, totalSecs - elapsed)

  // Start camera + recording
  useEffect(() => {
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream

        const rec = new MediaRecorder(stream, { mimeType: 'video/webm' })
        rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
        rec.start(1000)
        mediaRecRef.current = rec
        setIsRecording(true)
      } catch {
        setCameraError(true)
      }
    }
    init()
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  // Global timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  // Pit per-question timer
  useEffect(() => {
    if (!isPit) return
    pitRef.current = setInterval(() => {
      setPitSecs(s => {
        if (s <= 1) { handleSend(true); return PIT_Q_SECONDS }
        return s - 1
      })
    }, 1000)
    return () => { if (pitRef.current) clearInterval(pitRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPit, currentQuestion])

  const stopAllTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (pitRef.current) clearInterval(pitRef.current)
  }

  // Fetch first question on mount
  useEffect(() => {
    fetchQuestion([])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchQuestion = useCallback(async (history: Message[]) => {
    setIsThinking(true)
    setIsSpeaking(false)

    const apiMessages = history.map(m => ({
      role: m.role === 'interviewer' ? 'assistant' : 'user',
      content: m.content,
    }))

    try {
      const res = await fetch('/api/arena/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, round, mode, profile }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (err.error === 'token_limit_reached') {
          setCurrentQuestion('Seus créditos acabaram. Encerrando sessão.')
          setTimeout(() => handleEnd(history), 2000)
          return
        }
        throw new Error(err.error ?? 'fetch_error')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''
      setIsThinking(false)
      setIsSpeaking(true)
      setCurrentQuestion('')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const event = JSON.parse(data)
            if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
              full += event.delta.text
              setCurrentQuestion(full)
            }
          } catch { /* ignore parse errors */ }
        }
      }

      setIsSpeaking(false)

      // Check if interviewer ended the session
      const endPhrases = ['thank you for your time', "that's all i needed", 'that is all i needed']
      if (endPhrases.some(p => full.toLowerCase().includes(p))) {
        const finalHistory: Message[] = [...history, { role: 'interviewer', content: full }]
        setMessages(finalHistory)
        setTimeout(() => handleEnd(finalHistory), 1500)
        return
      }

      setMessages(prev => [...prev, { role: 'interviewer', content: full }])
      if (isPit) setPitSecs(PIT_Q_SECONDS)
    } catch (err) {
      console.error('[call-screen] fetch error', err)
      setIsThinking(false)
      setCurrentQuestion('Erro de conexão. Tente encerrar e iniciar uma nova sessão.')
    }
  }, [round, mode, profile, isPit]) // eslint-disable-line

  const handleSend = useCallback((auto = false) => {
    const text = input.trim()
    if (!text && !auto) return
    if (sessionEnded) return

    setInput('')
    if (isPit) setPitSecs(PIT_Q_SECONDS)

    const userMsg: Message = { role: 'candidate', content: text || '(sem resposta)' }
    const next = [...messages, userMsg]
    setMessages(next)
    fetchQuestion(next)
  }, [input, messages, sessionEnded, isPit, fetchQuestion])

  const handleEnd = useCallback((finalMessages?: Message[]) => {
    if (sessionEnded) return
    setSessionEnded(true)
    stopAllTimers()

    // Stop recording
    let blob: Blob | null = null
    if (mediaRecRef.current && mediaRecRef.current.state !== 'inactive') {
      mediaRecRef.current.stop()
      mediaRecRef.current.onstop = () => {
        blob = new Blob(chunksRef.current, { type: 'video/webm' })
        streamRef.current?.getTracks().forEach(t => t.stop())
        onEnd(finalMessages ?? messages, blob)
      }
    } else {
      streamRef.current?.getTracks().forEach(t => t.stop())
      onEnd(finalMessages ?? messages, null)
    }
  }, [sessionEnded, messages, onEnd])

  const timerColor = remaining < 60 ? '#ff3b30' : remaining < 180 ? '#ffbd2e' : 'rgba(255,255,255,0.7)'
  const pitPct     = (pitSecs / PIT_Q_SECONDS) * 100

  const bgColor    = '#080808'
  const borderCol  = isPit ? 'rgba(255,59,48,0.12)' : 'rgba(255,255,255,0.06)'

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100dvh',
      background: bgColor, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        background: 'linear-gradient(to bottom, rgba(8,8,8,0.9) 0%, transparent 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isRecording && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(255,59,48,0.15)', border: '0.5px solid rgba(255,59,48,0.3)',
              borderRadius: 100, padding: '4px 10px',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#ff3b30',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff3b30', animation: 'blink 1.5s ease-in-out infinite' }} />
              REC
            </div>
          )}
          {isPit && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,59,48,0.12)', border: '0.5px solid rgba(255,59,48,0.3)',
              borderRadius: 100, padding: '4px 12px',
              fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: '#ff3b30',
            }}>
              🔥 THE PIT
            </div>
          )}
        </div>

        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 26, letterSpacing: '0.1em', color: timerColor,
        }}>
          {fmt(remaining)}
        </div>

        <button
          onClick={() => handleEnd()}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: '#ff3b30', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 16,
            boxShadow: '0 0 20px rgba(255,59,48,0.3)',
          }}
          title="Encerrar"
        >
          📵
        </button>
      </div>

      {/* Split layout */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'grid',
        gridTemplateColumns: 'clamp(300px, 50%, 600px) 1fr',
      }}>
        {/* Interviewer side */}
        <div style={{
          position: 'relative', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          borderRight: `0.5px solid ${borderCol}`,
          overflow: 'hidden',
        }}>
          {/* Vignette */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(8,8,8,0.5) 100%)',
          }} />

          {/* Avatar */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, zIndex: 2 }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 'clamp(72px, 14vw, 110px)',
                height: 'clamp(72px, 14vw, 110px)',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e2a1e 0%, #2a3832 50%, #1a2822 100%)',
                border: '2px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'clamp(28px, 5vw, 42px)',
                boxShadow: '0 0 0 8px rgba(255,255,255,0.03), 0 0 0 16px rgba(255,255,255,0.015), 0 20px 60px rgba(0,0,0,0.6)',
              }}>
                {iv.emoji}
              </div>
              {/* Speaking rings */}
              {isSpeaking && <>
                <div style={{
                  position: 'absolute', inset: -8, borderRadius: '50%',
                  border: '2px solid rgba(228,253,139,0.4)',
                  animation: 'speakRing 1.2s ease-in-out infinite',
                }} />
                <div style={{
                  position: 'absolute', inset: -16, borderRadius: '50%',
                  border: '1px solid rgba(228,253,139,0.15)',
                  animation: 'speakRing 1.2s ease-in-out infinite 0.2s',
                }} />
              </>}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{iv.name}</div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.07)', border: '0.5px solid rgba(255,255,255,0.1)',
                borderRadius: 100, padding: '3px 12px', fontSize: 11, color: 'rgba(255,255,255,0.6)',
              }}>
                {iv.title}
              </div>
            </div>
          </div>

          {/* Question bubble */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 10 }}>
            <div style={{
              background: 'rgba(20,20,22,0.92)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '0.5px solid rgba(255,255,255,0.09)',
              borderRadius: '6px 16px 16px 16px',
              padding: '14px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}>
              <div style={{
                fontFamily: 'monospace', fontSize: 9, color: 'var(--text3)',
                textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8,
              }}>
                {round}
              </div>

              {isThinking ? (
                <div style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <span key={i} style={{
                      width: 4, height: 4, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.35)',
                      animation: `typingDot 1.2s ease-in-out ${delay}s infinite`,
                      display: 'inline-block',
                    }} />
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 'clamp(13px, 2.2vw, 16px)', fontWeight: 400, lineHeight: 1.6, color: 'var(--text)' }}>
                  {currentQuestion || '…'}
                </div>
              )}

              {/* Pit timer bar */}
              {isPit && !isThinking && (
                <div style={{ height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 1, overflow: 'hidden', marginTop: 12 }}>
                  <div style={{
                    height: '100%', borderRadius: 1, background: '#ff3b30',
                    width: `${pitPct}%`, transition: 'width 1s linear',
                  }} />
                </div>
              )}
            </div>

            {/* Hint (guided only) */}
            {!isPit && (
              <div style={{
                marginTop: 8, background: 'rgba(228,253,139,0.08)',
                border: '0.5px solid rgba(228,253,139,0.2)',
                borderRadius: 8, padding: '9px 12px',
                display: 'flex', gap: 8, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>⚡</span>
                <span style={{ fontSize: 11, color: 'var(--accent)', lineHeight: 1.55, opacity: 0.85 }}>
                  {HINTS[round]}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Candidate side */}
        <div style={{
          position: 'relative', display: 'flex', flexDirection: 'column',
          background: 'rgba(8,8,8,0.7)',
        }}>
          {/* Camera feed */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: cameraError ? 0 : 1 }}
            />
            {cameraError && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 8,
                background: '#111',
              }}>
                <span style={{ fontSize: 32 }}>🚫</span>
                <span style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', maxWidth: 200 }}>
                  Câmera não disponível.<br />Continue sem vídeo.
                </span>
              </div>
            )}
            {/* Dark overlay for readability */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.0) 40%, rgba(0,0,0,0.7) 100%)',
            }} />
          </div>

          {/* STAR chips (guided only) */}
          {!isPit && (
            <div style={{
              position: 'absolute', top: 64, left: 16, zIndex: 10,
              display: 'flex', gap: 5, flexWrap: 'wrap',
            }}>
              {[
                { letter: 'S', label: 'Situação', color: '#5db8ff', border: 'rgba(93,184,255,.3)', bg: 'rgba(93,184,255,.1)' },
                { letter: 'T', label: 'Tarefa',   color: '#ffbd2e', border: 'rgba(255,189,46,.3)', bg: 'rgba(255,189,46,.1)' },
                { letter: 'A', label: 'Ação',     color: '#28c941', border: 'rgba(40,201,65,.3)',  bg: 'rgba(40,201,65,.1)'  },
                { letter: 'R', label: 'Resultado', color: '#c084fc', border: 'rgba(192,132,252,.3)', bg: 'rgba(192,132,252,.1)' },
              ].map(s => (
                <div key={s.letter} style={{
                  fontFamily: 'monospace', fontSize: 9, fontWeight: 600,
                  padding: '3px 8px', borderRadius: 5,
                  border: `0.5px solid ${s.border}`, background: s.bg, color: s.color,
                  backdropFilter: 'blur(8px)',
                }}>
                  {s.letter}
                </div>
              ))}
            </div>
          )}

          {/* Self-view chip */}
          <div style={{
            position: 'absolute', top: 64, right: 16, zIndex: 10,
            background: 'rgba(20,20,22,0.8)', backdropFilter: 'blur(12px)',
            border: '0.5px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '8px 12px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(228,253,139,0.1)', border: '0.5px solid rgba(228,253,139,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: 'var(--accent)',
            }}>
              {initials(userName)}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600 }}>{userName.split(' ')[0]}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                {isThinking ? 'Aguardando...' : 'Respondendo...'}
              </div>
            </div>
          </div>

          {/* Input area */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
            padding: '0 20px 20px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 8,
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text3)' }}>
                Sua resposta
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--text3)' }}>
                {input.trim().split(/\s+/).filter(w => w).length} palavras
              </span>
            </div>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
              }}
              disabled={isThinking || sessionEnded}
              placeholder={isPit ? 'Responda agora — o tempo está correndo.' : 'Escreva em inglês — sem rascunho, como faria ao vivo.'}
              style={{
                width: '100%', minHeight: 90, maxHeight: 160,
                background: 'rgba(255,255,255,0.05)',
                border: `0.5px solid ${isPit ? 'rgba(255,59,48,0.2)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 14, padding: 14,
                color: 'var(--text)', fontFamily: 'inherit', fontSize: 14, fontWeight: 300,
                lineHeight: 1.7, resize: 'none', outline: 'none',
                caretColor: 'var(--accent)',
              }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {!isPit && (
                <button
                  onClick={() => handleSend(true)}
                  style={{
                    background: 'transparent', border: '0.5px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '12px 14px',
                    fontFamily: 'inherit', fontSize: 12, color: 'var(--text3)',
                    cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  Pular
                </button>
              )}
              <button
                onClick={() => handleSend()}
                disabled={isThinking || sessionEnded}
                style={{
                  flex: 1, border: 'none', borderRadius: 10, padding: 13,
                  fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: isPit ? '#ff3b30' : 'var(--accent)',
                  color: isPit ? '#fff' : '#0c0c0e',
                  opacity: isThinking ? 0.6 : 1,
                }}
              >
                Enviar resposta →
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.25} }
        @keyframes speakRing {
          0% { transform: scale(0.95); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: scale(1.05); opacity: 0; }
        }
        @keyframes typingDot {
          0%,80%,100%{ transform: translateY(0); opacity: .3; }
          40%{ transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
