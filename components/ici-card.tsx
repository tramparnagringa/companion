'use client'

import { useState, useEffect } from 'react'

const SHARE_SCHEMES = ['lime', 'coral', 'purple', 'dark', 'paper', 'white', 'deep'] as const

// Background + text color for each scheme used in the score banner
const SCHEME_STYLES: Record<typeof SHARE_SCHEMES[number], { bg: string; text: string; muted: string; isDark: boolean }> = {
  lime:   { bg: '#C9F23D', text: '#2A002E', muted: 'rgba(42,0,46,0.55)',    isDark: false },
  coral:  { bg: '#FF6B35', text: '#FBF8F1', muted: 'rgba(251,248,241,0.7)', isDark: true  },
  purple: { bg: '#430049', text: '#FBF8F1', muted: 'rgba(251,248,241,0.55)', isDark: true  },
  dark:   { bg: '#0e0e10', text: '#FBF8F1', muted: 'rgba(251,248,241,0.45)', isDark: true  },
  paper:  { bg: '#FBF8F1', text: '#2A002E', muted: 'rgba(42,0,46,0.50)',    isDark: false },
  white:  { bg: '#ffffff', text: '#2A002E', muted: 'rgba(42,0,46,0.45)',    isDark: false },
  deep:   { bg: '#2A002E', text: '#FBF8F1', muted: 'rgba(251,248,241,0.45)', isDark: true  },
}

function verdictEmoji(overall: number): string {
  if (overall >= 8.0) return '🚀'
  if (overall >= 6.5) return '✈️'
  if (overall >= 5.0) return '⚡'
  return '🌱'
}

export interface ICIDimensions {
  ingles_profissional: number
  senioridade_especializacao: number
  posicionamento_mercado: number
  exposicao_internacional: number
  prontidao_processo: number
}

export interface ICIScores {
  overall: number
  verdict: string
  subtitle: string
  tagline?: string
  gap_dimension: string
  gap_message: string
  dimensions: ICIDimensions
  generated_at?: string
}

interface ICICardProps {
  scores: ICIScores
  compact?: boolean
  mini?: boolean
  showShare?: boolean
}

const DIMENSION_LABELS: Record<keyof ICIDimensions, string> = {
  ingles_profissional:        'Inglês Profissional',
  senioridade_especializacao: 'Senioridade & Especialização',
  posicionamento_mercado:     'Posicionamento de Mercado',
  exposicao_internacional:    'Exposição Internacional',
  prontidao_processo:         'Prontidão para o Processo',
}

function getGapKey(dims: ICIDimensions): keyof ICIDimensions {
  return (Object.entries(dims) as Array<[keyof ICIDimensions, number]>)
    .reduce((min, cur) => cur[1] < min[1] ? cur : min)[0]
}

export function ICICard({ scores, compact = false, mini = false, showShare = true }: ICICardProps) {
  const gapKey  = getGapKey(scores.dimensions)
  const [colorKey] = useState(
    () => SHARE_SCHEMES[Math.floor(Math.random() * SHARE_SCHEMES.length)]
  )
  const scheme     = SCHEME_STYLES[colorKey]
  const previewSrc = `/api/og/ici?s=${encodeURIComponent(JSON.stringify(scores))}&c=${colorKey}`
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (mini) {
    return (
      <div style={{
        background: 'var(--tng-paper)',
        border: '1px solid var(--tng-rule)',
        borderRadius: 10,
        padding: '14px 16px',
        width: '100%',
      }}>
        {/* Eyebrow */}
        <div style={{
          fontFamily: 'var(--tng-font-mono)', fontSize: 9, fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--tng-ink-3)', marginBottom: 8,
        }}>
          ICI · Competitividade Internacional
        </div>

        {/* Score + verdict */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
            <span style={{
              fontFamily: 'var(--tng-font-display)', fontSize: 34, fontWeight: 800,
              color: 'var(--tng-purple-900)', lineHeight: 1, letterSpacing: '-0.03em',
            }}>
              {scores.overall.toFixed(1)}
            </span>
            <span style={{
              fontFamily: 'var(--tng-font-display)', fontSize: 14, fontWeight: 700,
              color: 'var(--tng-ink-3)', paddingBottom: 3,
            }}>
              /10
            </span>
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--tng-font-mono)', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--tng-purple-700)',
            }}>
              {verdictEmoji(scores.overall)} {scores.verdict}
            </div>
            {scores.subtitle && (
              <div style={{ fontSize: 11, color: 'var(--tng-ink-3)', marginTop: 2, lineHeight: 1.3 }}>
                {scores.subtitle}
              </div>
            )}
          </div>
        </div>

        {/* Dimension bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(Object.entries(DIMENSION_LABELS) as Array<[keyof ICIDimensions, string]>).map(([key, label]) => {
            const score = scores.dimensions[key]
            const isGap = key === gapKey
            return (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: isGap ? 'var(--tng-coral)' : 'var(--tng-ink-2)', fontWeight: isGap ? 600 : 400 }}>
                    {label}
                  </span>
                  <span style={{
                    fontSize: 10, color: isGap ? 'var(--tng-coral)' : 'var(--tng-purple-700)',
                    fontFamily: 'var(--tng-font-mono)', fontWeight: 600,
                  }}>
                    {score.toFixed(1)}
                  </span>
                </div>
                <div style={{ height: 3, background: 'var(--tng-bone)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    width: `${score * 10}%`, height: '100%', borderRadius: 2,
                    background: isGap ? 'var(--tng-coral)' : 'var(--tng-purple-700)',
                    transition: 'width 700ms cubic-bezier(.2,.7,.2,1)',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div style={{
        background: 'var(--tng-purple-700)',
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
          <span style={{
            fontFamily: 'var(--tng-font-display)',
            fontSize: 44,
            fontWeight: 800,
            color: 'var(--tng-cream)',
            lineHeight: 1,
            letterSpacing: '-0.04em',
          }}>
            {scores.overall.toFixed(1)}
          </span>
          <span style={{
            fontFamily: 'var(--tng-font-display)',
            fontSize: 16,
            fontWeight: 700,
            color: 'rgba(245,239,226,0.45)',
            paddingBottom: 4,
          }}>
            /10
          </span>
        </div>
        <div>
          <div style={{
            fontFamily: 'var(--tng-font-mono)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--tng-lime)',
            marginBottom: 4,
          }}>
            {scores.verdict}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(183,177,160,0.8)', lineHeight: 1.4 }}>
            Gap: {scores.gap_dimension}
          </div>
        </div>
        <div style={{
          position: 'absolute', right: -8, top: -8,
          fontSize: 72, lineHeight: 1,
          opacity: 0.07, transform: 'rotate(-5deg)',
          pointerEvents: 'none', userSelect: 'none',
        }}>
          ✌️
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'var(--tng-paper)',
      border: '1px solid var(--tng-rule)',
      borderRadius: 16,
      padding: '24px 28px',
      boxShadow: '0 2px 10px rgba(20,20,20,0.07)',
      width: '100%',
      maxWidth: 600,
    }}>

      {/* Eyebrow */}
      <div style={{
        fontFamily: 'var(--tng-font-mono)',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: 'var(--tng-ink-3)',
        marginBottom: 6,
      }}>
        ICI · Índice de Competitividade
      </div>

      {/* Title */}
      <div style={{
        fontFamily: 'var(--tng-font-display)',
        fontSize: 22,
        fontWeight: 700,
        color: 'var(--tng-purple-900)',
        letterSpacing: '-0.02em',
        lineHeight: 1.1,
        marginBottom: 18,
      }}>
        Índice de Competitividade Internacional
      </div>

      {/* Score banner — two halves when showShare, full-width otherwise */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
        minHeight: isMobile ? 'auto' : 160,
        border: '1px solid #18181b',
        boxShadow: '4px 4px 0 #18181b',
      }}>
        {/* Left: score + verdict */}
        <div style={{
          width: showShare && !isMobile ? '55%' : '100%',
          background: scheme.bg,
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 8,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
            <span style={{
              fontFamily: 'var(--tng-font-display)',
              fontSize: isMobile ? 72 : 98, fontWeight: 600,
              color: scheme.text,
              lineHeight: 1, letterSpacing: '-0.04em',
            }}>
              {scores.overall.toFixed(1)}
            </span>
            <span style={{
              fontFamily: 'var(--tng-font-display)',
              fontSize: 22, fontWeight: 700,
              color: scheme.muted,
              lineHeight: 1, paddingBottom: 7,
            }}>
              /10
            </span>
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: 999,
            background: scheme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
            border: `0.5px solid ${scheme.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'}`,
            alignSelf: 'flex-start',
          }}>
            <span style={{ fontSize: 13, lineHeight: 1 }}>{verdictEmoji(scores.overall)}</span>
            <span style={{
              fontFamily: 'var(--tng-font-mono)',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: scheme.text,
            }}>
              {scores.verdict}
            </span>
          </div>
          {/* Watermark */}
          {!showShare && (
            <div style={{
              position: 'absolute', right: -10, top: -8,
              fontSize: 100, lineHeight: 1, opacity: 0.07,
              transform: 'rotate(-5deg)',
              pointerEvents: 'none', userSelect: 'none',
            }}>✌️</div>
          )}
        </div>

        {/* Right: OG card preview + download */}
        {showShare && (
          <div style={{
            width: isMobile ? '100%' : '45%',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            background: scheme.bg,
            overflow: 'hidden',
          }}>
            <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
              <img
                src={previewSrc}
                alt="Prévia do card compartilhável"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <a
              href={previewSrc}
              download={`ici-${scores.overall.toFixed(1)}.png`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '8px 12px',
                borderTop: `0.5px solid ${scheme.muted}`,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: scheme.muted,
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              Compartilhar
            </a>
          </div>
        )}
      </div>

      {/* Dimensions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 20 }}>
        {(Object.entries(DIMENSION_LABELS) as Array<[keyof ICIDimensions, string]>).map(([key, label]) => {
          const score    = scores.dimensions[key]
          const isGap    = key === gapKey
          const barFill  = isGap ? 'var(--tng-coral)' : 'var(--tng-purple-700)'
          const labelClr = isGap ? 'var(--tng-coral)' : 'var(--tng-ink)'
          const scoreClr = isGap ? 'var(--tng-coral-text)' : 'var(--tng-purple-700)'

          return (
            <div key={key}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 8,
              }}>
                <span style={{
                  fontSize: 15,
                  color: labelClr,
                  fontWeight: isGap ? 600 : 400,
                  lineHeight: 1,
                }}>
                  {label}
                </span>
                <span style={{
                  fontSize: 15,
                  fontFamily: 'var(--tng-font-display)',
                  fontWeight: 700,
                  color: scoreClr,
                  flexShrink: 0,
                  marginLeft: 12,
                }}>
                  {score.toFixed(1)}
                </span>
              </div>
              {/* Bar */}
              <div style={{
                height: 7,
                background: 'var(--tng-bone)',
                borderRadius: 4,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${score * 10}%`,
                  height: '100%',
                  background: barFill,
                  borderRadius: 4,
                  transition: 'width 700ms cubic-bezier(.2,.7,.2,1)',
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Gap callout */}
      {scores.gap_message && (
        <div style={{
          border: '1.5px dashed var(--tng-coral)',
          borderRadius: 10,
          padding: '14px 16px',
          display: 'flex',
          gap: 14,
          alignItems: 'flex-start',
          background: 'rgba(255,107,53,0.04)',
        }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--tng-coral)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 1,
          }}>
            <span style={{
              color: '#fff',
              fontSize: 13,
              fontWeight: 800,
              fontFamily: 'var(--tng-font-mono)',
              lineHeight: 1,
            }}>!</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--tng-ink-2)', lineHeight: 1.65 }}>
            <span style={{ color: 'var(--tng-coral)', fontWeight: 700 }}>
              Gap principal: {scores.gap_dimension}.
            </span>
            {' '}{scores.gap_message}
          </div>
        </div>
      )}

    </div>
  )
}
