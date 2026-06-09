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
  gap_dimension: string
  gap_message: string
  dimensions: ICIDimensions
  generated_at?: string
}

interface ICICardProps {
  scores: ICIScores
  compact?: boolean
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

export function ICICard({ scores, compact = false }: ICICardProps) {
  const gapKey = getGapKey(scores.dimensions)

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

      {/* Score banner */}
      <div style={{
        background: 'var(--tng-purple-700)',
        borderRadius: 12,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Score number */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, flexShrink: 0 }}>
          <span style={{
            fontFamily: 'var(--tng-font-display)',
            fontSize: 72,
            fontWeight: 800,
            color: 'var(--tng-cream)',
            lineHeight: 1,
            letterSpacing: '-0.04em',
          }}>
            {scores.overall.toFixed(1)}
          </span>
          <span style={{
            fontFamily: 'var(--tng-font-display)',
            fontSize: 22,
            fontWeight: 700,
            color: 'rgba(245,239,226,0.45)',
            lineHeight: 1,
            paddingBottom: 7,
          }}>
            /10
          </span>
        </div>

        {/* Verdict + subtitle */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'var(--tng-font-mono)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: 'var(--tng-lime)',
            marginBottom: 6,
          }}>
            {scores.verdict}
          </div>
          <div style={{
            fontFamily: 'var(--tng-font-mono)',
            fontSize: 13,
            color: 'rgba(183,177,160,0.85)',
            lineHeight: 1.45,
          }}>
            {scores.subtitle}
          </div>
        </div>

        {/* Watermark */}
        <div style={{
          position: 'absolute',
          right: -10,
          top: -8,
          fontSize: 100,
          lineHeight: 1,
          opacity: 0.07,
          transform: 'rotate(-5deg)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          ✌️
        </div>
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
          {/* Coral circle icon */}
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
