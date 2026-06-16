'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { EnrollmentWithProgress, RecommendedProgram } from './app-shell'

interface ProgramsPanelProps {
  enrollments: EnrollmentWithProgress[]
  activeSlug: string | null
  recommendedProgram: RecommendedProgram | null
  onClose: () => void
}

function IcoCheck() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l3.5 3.5 6.5-7" />
    </svg>
  )
}
function IcoArrow() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  )
}
function IcoLayers() {
  return (
    <svg viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="8,1 15,5 8,9 1,5" /><path d="M1 9l7 4 7-4" /><path d="M1 12l7 4 7-4" />
    </svg>
  )
}
function IcoTarget() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5" /><circle cx="8" cy="8" r="3" /><circle cx="8" cy="8" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}
function IcoCompass() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5" /><path d="M10 6l-2 5-2-5 5-2z" />
    </svg>
  )
}
function IcoClose() {
  return (
    <svg viewBox="0 0 15 15" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="3" y1="3" x2="12" y2="12" /><line x1="12" y1="3" x2="3" y2="12" />
    </svg>
  )
}

export function ProgramsPanel({ enrollments, activeSlug, recommendedProgram, onClose }: ProgramsPanelProps) {
  const router = useRouter()

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function navigate(slug: string) {
    router.push(`/${slug}/days`)
    onClose()
  }

  return (
    <>
      <style>{`
        /* ── scrim ─────────────────────────────────────────────── */
        .sbc-scrim {
          position: fixed; inset: 0; z-index: 49;
        }

        /* ── balloon (desktop) ─────────────────────────────────── */
        .sbc-panel {
          position: fixed;
          left: calc(var(--sidebar-w, 252px) + 10px);
          top: 50%; transform: translateY(-46%);
          width: 292px; max-height: 82vh;
          z-index: 50;
          background: var(--tng-paper);
          border: 1.5px solid var(--tng-ink);
          border-radius: 16px;
          box-shadow: 5px 5px 0 var(--tng-ink);
          display: flex; flex-direction: column;
          overflow: hidden;
          animation: sbc-pop .14s cubic-bezier(.2,1.4,.5,1) both;
        }
        @keyframes sbc-pop {
          from { opacity: 0; transform: translateY(-46%) scale(.95); }
          to   { opacity: 1; transform: translateY(-46%) scale(1); }
        }

        /* ── bottom sheet (mobile) ─────────────────────────────── */
        @media (max-width: 768px) {
          .sbc-scrim {
            background: rgba(20,20,20,0.45);
          }
          .sbc-panel {
            left: 0; top: auto; bottom: 0;
            width: 100%; max-height: 85dvh;
            border-radius: 20px 20px 0 0;
            box-shadow: 0 -4px 32px rgba(0,0,0,0.18);
            transform: none;
            animation: sbc-slide-up .22s cubic-bezier(.2,1.2,.4,1) both;
          }
          @keyframes sbc-slide-up {
            from { opacity: 0; transform: translateY(40px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        }

        /* ── panel header ──────────────────────────────────────── */
        .sbc-panel-h {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 14px 12px;
          border-bottom: 1px solid var(--tng-rule);
          flex-shrink: 0;
        }
        .sbc-panel-h .ttl {
          font-family: var(--tng-font-display); font-weight: 800; font-size: 15px;
          letter-spacing: -0.01em; color: var(--tng-purple-900);
        }
        .sbc-panel-h .ct {
          font-family: var(--tng-font-mono); font-size: 10px;
          letter-spacing: 0.08em; text-transform: uppercase; color: var(--tng-ink-3);
        }
        .sbc-x {
          width: 28px; height: 28px; border-radius: 999px;
          border: 1px solid var(--tng-rule); background: var(--tng-cream);
          color: var(--tng-ink-2); display: grid; place-items: center; cursor: pointer;
          flex-shrink: 0;
        }
        .sbc-x:hover { border-color: var(--tng-ink); color: var(--tng-ink); }

        /* ── scrollable body ───────────────────────────────────── */
        .sbc-panel-body { flex: 1; overflow-y: auto; padding: 10px 12px 14px; display: flex; flex-direction: column; gap: 0; }

        /* ── section label ─────────────────────────────────────── */
        .sbc-sec-l {
          font-family: var(--tng-font-mono); font-size: 9.5px;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--tng-ink-3); margin: 14px 4px 8px;
        }
        .sbc-sec-l:first-child { margin-top: 4px; }

        /* ── program list ──────────────────────────────────────── */
        .sbc-progs { display: flex; flex-direction: column; gap: 8px; }
        .sbc-prog {
          display: flex; align-items: center; gap: 12px; padding: 12px;
          border: 1px solid var(--tng-rule); border-radius: 12px;
          cursor: pointer; background: var(--tng-cream);
          transition: border-color 120ms, transform 120ms;
        }
        .sbc-prog:hover { border-color: var(--tng-purple-300); transform: translateX(2px); }
        .sbc-prog.active { border-color: var(--tng-purple-700); background: var(--tng-purple-100); cursor: default; }
        .sbc-prog.active:hover { transform: none; }
        .sbc-prog.done { }
        .sbc-prog .pi {
          width: 38px; height: 38px; border-radius: 10px;
          background: var(--tng-purple-700); color: var(--tng-lime);
          display: grid; place-items: center; flex-shrink: 0;
        }
        .sbc-prog.done .pi { background: var(--tng-success); color: #fff; }
        .sbc-prog .pb { flex: 1; min-width: 0; }
        .sbc-prog .pn {
          font-size: 13.5px; font-weight: 700; color: var(--tng-purple-900);
          line-height: 1.2; display: flex; align-items: center; gap: 7px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sbc-prog .pstate {
          font-family: var(--tng-font-mono); font-size: 10.5px;
          color: var(--tng-ink-3); margin-top: 4px; display: flex; align-items: center; gap: 6px;
        }
        .sbc-prog .bar {
          height: 4px; border-radius: 3px; background: rgba(20,20,20,0.08);
          margin-top: 7px; overflow: hidden;
        }
        .sbc-prog .bar i { display: block; height: 100%; border-radius: 3px; background: var(--tng-purple-700); }
        .sbc-prog.done .bar i { background: var(--tng-success); }
        .sbc-prog .pck { flex-shrink: 0; color: var(--tng-purple-700); display: inline-flex; }

        /* tags */
        .sbc-tag {
          font-family: var(--tng-font-mono); font-size: 8.5px; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase; padding: 2px 7px; border-radius: 999px;
          white-space: nowrap; flex-shrink: 0;
        }
        .sbc-tag.now { background: var(--tng-purple-700); color: var(--tng-lime); }
        .sbc-tag.ok  { background: #E2F2EA; color: var(--tng-success); border: 1px solid #9FCBB5; }

        /* ── recommended card ──────────────────────────────────── */
        .sbc-rec {
          border: 1.5px solid var(--tng-ink); border-radius: 13px;
          background: var(--tng-paper); box-shadow: 3px 3px 0 var(--tng-ink); padding: 13px;
        }
        .sbc-rec-top { display: flex; align-items: center; gap: 10px; margin-bottom: 9px; }
        .sbc-rec-top .pi {
          width: 34px; height: 34px; border-radius: 9px;
          background: var(--tng-coral); color: #fff;
          display: grid; place-items: center; flex-shrink: 0;
        }
        .sbc-rec-top .pn {
          font-family: var(--tng-font-display); font-weight: 800; font-size: 15px;
          color: var(--tng-purple-900); line-height: 1.1; letter-spacing: -0.01em;
        }
        .sbc-rec-why {
          display: flex; align-items: flex-start; gap: 7px; font-size: 12px;
          line-height: 1.35; color: var(--tng-ink-2);
          background: #F2FAD5; border: 1px solid #B4DD3A;
          border-radius: 8px; padding: 8px 10px; margin-bottom: 11px;
        }
        .sbc-rec-why svg { color: #5E7A0F; flex-shrink: 0; margin-top: 1px; }
        .sbc-rec-foot {
          display: flex; align-items: center;
          justify-content: space-between; gap: 10px;
        }
        .sbc-rec-meta { font-family: var(--tng-font-mono); font-size: 10.5px; color: var(--tng-ink-3); }
        .sbc-rec-foot .pr {
          font-family: var(--tng-font-display); font-weight: 800;
          font-size: 17px; color: var(--tng-purple-900);
        }
        .sbc-rec-cta {
          display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px;
          border-radius: 999px; border: 1.5px solid var(--tng-ink);
          background: var(--tng-coral); color: #fff;
          font-weight: 700; font-size: 12.5px; cursor: pointer;
          white-space: nowrap; transition: transform 120ms;
        }
        .sbc-rec-cta:hover { transform: translate(-1px,-1px); }

        /* ── explore link ──────────────────────────────────────── */
        .sbc-explore {
          display: flex; align-items: center; justify-content: center; gap: 7px;
          margin-top: 13px; padding-top: 13px; border-top: 1px solid var(--tng-rule);
          font-family: var(--tng-font-mono); font-size: 12px;
          font-weight: 700; color: var(--tng-purple-700);
          cursor: pointer; text-decoration: none;
        }
        .sbc-explore:hover { color: var(--tng-purple-900); }
      `}</style>

      {/* Backdrop */}
      <div className="sbc-scrim" onClick={onClose} />

      {/* Panel */}
      <div className="sbc-panel">
        {/* Header */}
        <div className="sbc-panel-h">
          <div>
            <div className="ttl">Meus programas</div>
            <div className="ct">({enrollments.length} {enrollments.length === 1 ? 'programa' : 'programas'})</div>
          </div>
          <button className="sbc-x" onClick={onClose} aria-label="Fechar">
            <IcoClose />
          </button>
        </div>

        {/* Body */}
        <div className="sbc-panel-body">
          {/* Enrolled programs */}
          <div className="sbc-sec-l">Seus programas</div>
          <div className="sbc-progs">
            {enrollments.map(e => {
              const isActive  = e.slug === activeSlug
              const isDone    = e.status === 'completed' || e.completedDays >= e.totalDays
              const pct       = e.totalDays > 0 ? Math.min((e.completedDays / e.totalDays) * 100, 100) : 0
              const stateText = isDone
                ? 'Concluído · 100%'
                : `Em andamento · Dia ${e.currentDay} de ${e.totalDays}`

              return (
                <div
                  key={e.id}
                  className={`sbc-prog${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}
                  onClick={() => !isActive && navigate(e.slug)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={ev => ev.key === 'Enter' && !isActive && navigate(e.slug)}
                >
                  <div className="pi">
                    {isDone ? <IcoCheck /> : <IcoLayers />}
                  </div>
                  <div className="pb">
                    <div className="pn">
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.name}</span>
                      {isActive && <span className="sbc-tag now">Agora</span>}
                      {isDone && !isActive && <span className="sbc-tag ok">Concluído</span>}
                    </div>
                    <div className="pstate">
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: isDone ? 'var(--tng-success)' : isActive ? 'var(--tng-purple-700)' : 'var(--tng-ink-3)', flexShrink: 0 }} />
                      {stateText}
                    </div>
                    {!isDone && (
                      <div className="bar">
                        <i style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                  {!isActive && (
                    <div className="pck"><IcoArrow /></div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Recommended program */}
          {recommendedProgram && (
            <>
              <div className="sbc-sec-l">Próximo recomendado</div>
              <div className="sbc-rec">
                <div className="sbc-rec-top">
                  <div className="pi"><IcoCompass /></div>
                  <div className="pn">{recommendedProgram.name}</div>
                </div>

                {recommendedProgram.description && (
                  <div className="sbc-rec-why">
                    <IcoTarget />
                    <span>
                      {recommendedProgram.description.length > 100
                        ? recommendedProgram.description.slice(0, 100) + '…'
                        : recommendedProgram.description}
                    </span>
                  </div>
                )}

                <div className="sbc-rec-foot">
                  <div>
                    {recommendedProgram.duration_days && (
                      <div className="sbc-rec-meta">{recommendedProgram.duration_days} dias · IA diária</div>
                    )}
                    {recommendedProgram.price_brl != null && (
                      <div className="pr">
                        R$ {recommendedProgram.price_brl.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </div>
                    )}
                  </div>
                  <button
                    className="sbc-rec-cta"
                    onClick={() => {
                      router.push(`/programs/${recommendedProgram.slug}`)
                      onClose()
                    }}
                  >
                    Começar →
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Explore all */}
          <a
            href="/programs"
            className="sbc-explore"
            onClick={onClose}
          >
            <IcoCompass />
            Explorar todos os programas
          </a>
        </div>
      </div>
    </>
  )
}
