'use client'

type Round = 'HR Screening' | 'Behavioral' | 'Technical' | 'Offer Negotiation'
type Mode  = 'guided' | 'pit'

interface Profile {
  target_role?: string | null
  seniority?: string | null
  tech_stack?: string[] | null
  years_experience?: number | null
}

interface LobbyScreenProps {
  profile: Profile | null
  userName: string
  selectedRound: Round
  selectedMode: Mode
  onRoundChange: (r: Round) => void
  onModeChange: (m: Mode) => void
  onStart: () => void
}

const ROUNDS: { id: Round; icon: string; label: string; desc: string; duration: string }[] = [
  { id: 'HR Screening',      icon: '📞', label: 'HR Screening',      desc: 'Motivação, salário e fit inicial',           duration: '15 min' },
  { id: 'Behavioral',        icon: '🧠', label: 'Behavioral',        desc: 'STAR · conflito · liderança · valores',      duration: '25 min' },
  { id: 'Technical',         icon: '⚙️', label: 'Technical',         desc: 'Live coding · system design',                duration: '30 min' },
  { id: 'Offer Negotiation', icon: '💰', label: 'Offer Negotiation', desc: 'Contra-proposta e ancoragem salarial',        duration: '20 min' },
]

const initials = (name: string) =>
  name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

export function LobbyScreen({
  profile,
  userName,
  selectedRound,
  selectedMode,
  onRoundChange,
  onModeChange,
  onStart,
}: LobbyScreenProps) {
  const isPit = selectedMode === 'pit'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-start', minHeight: '100dvh',
      padding: '40px 20px 60px', overflowY: 'auto',
      background: 'var(--bg)',
      position: 'relative',
    }}>
      {/* Glow */}
      <div style={{
        position: 'fixed', top: -160, left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 500, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle, rgba(228,253,139,0.06) 0%, transparent 70%)',
      }} />

      <div style={{
        width: '100%', maxWidth: 480, position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(228,253,139,0.1)', border: '0.5px solid rgba(228,253,139,0.22)',
          borderRadius: 100, padding: '5px 14px',
          fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const,
          color: 'var(--accent)', marginBottom: 28,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'blink 2s ease-in-out infinite' }} />
          Interview Arena
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(52px, 14vw, 88px)',
          letterSpacing: '0.04em', lineHeight: 0.92,
          textAlign: 'center', marginBottom: 8,
        }}>
          PROVE<br /><span style={{ color: 'var(--accent)' }}>YOUR</span><br />GAME
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text3)', textAlign: 'center', fontWeight: 300, lineHeight: 1.6, marginBottom: 32, maxWidth: 340 }}>
          Pressão real. Feedback cirúrgico. Como se fosse a entrevista de verdade.
        </p>

        {/* Candidate chip */}
        <div style={{
          width: '100%', background: 'var(--bg2)', border: '0.5px solid var(--border)',
          borderRadius: 14, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(228,253,139,0.1)', border: '1.5px solid rgba(228,253,139,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
          }}>
            {initials(userName)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{userName}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>
              {[profile?.target_role, profile?.seniority].filter(Boolean).join(' · ') || 'Configure seu dossier em /profile'}
            </div>
          </div>
          {profile?.tech_stack?.slice(0, 2).map(t => (
            <span key={t} style={{
              background: 'var(--bg3)', border: '0.5px solid var(--border)',
              borderRadius: 5, padding: '2px 8px', fontSize: 10, color: 'var(--text3)',
              fontFamily: 'monospace',
            }}>{t}</span>
          ))}
        </div>

        {/* Round list */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {ROUNDS.map(r => (
            <button
              key={r.id}
              onClick={() => onRoundChange(r.id)}
              style={{
                background: selectedRound === r.id ? 'rgba(228,253,139,0.08)' : 'var(--bg2)',
                border: `0.5px solid ${selectedRound === r.id ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 14, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 14,
                cursor: 'pointer', transition: 'all 0.18s',
                textAlign: 'left', width: '100%',
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{r.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{r.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{r.desc}</div>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>{r.duration}</span>
            </button>
          ))}
        </div>

        {/* Mode toggle */}
        <div style={{
          width: '100%', background: 'var(--bg2)', border: '0.5px solid var(--border)',
          borderRadius: 12, padding: 4, display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 4, marginBottom: 16,
        }}>
          <button
            onClick={() => onModeChange('guided')}
            style={{
              borderRadius: 9, border: selectedMode === 'guided' ? '0.5px solid var(--border)' : 'none',
              padding: '10px 8px', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              background: selectedMode === 'guided' ? 'var(--bg3)' : 'transparent',
              color: selectedMode === 'guided' ? 'var(--accent)' : 'var(--text3)',
            }}
          >
            🎯 Modo Guiado
            <span style={{ fontSize: 9, fontWeight: 400, opacity: 0.7 }}>Hints e STAR visíveis</span>
          </button>
          <button
            onClick={() => onModeChange('pit')}
            style={{
              borderRadius: 9, border: selectedMode === 'pit' ? '0.5px solid rgba(255,59,48,0.35)' : 'none',
              padding: '10px 8px', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              background: selectedMode === 'pit' ? '#160808' : 'transparent',
              color: selectedMode === 'pit' ? '#ff3b30' : 'var(--text3)',
            }}
          >
            🔥 The Pit
            <span style={{ fontSize: 9, fontWeight: 400, opacity: 0.7 }}>Sem hints · Timer · Pressão</span>
          </button>
        </div>

        {/* Start button */}
        <button
          onClick={onStart}
          style={{
            width: '100%',
            background: isPit ? '#ff3b30' : 'var(--accent)',
            color: isPit ? '#fff' : '#0c0c0e',
            border: 'none', borderRadius: 13, padding: 17,
            fontFamily: 'inherit', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.02em',
            boxShadow: isPit ? '0 0 24px rgba(255,59,48,0.2)' : 'none',
          }}
        >
          {isPit ? '🔥 Entrar no Pit →' : 'Iniciar sessão →'}
        </button>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>
    </div>
  )
}
