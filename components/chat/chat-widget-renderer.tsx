'use client'

import { ICICard, type ICIScores } from '@/components/ici-card'

// Discriminated union — add a new member for each future widget type.
// The `type` field is the key the server sends in the SSE tool_result event.
export type ChatWidget =
  | { type: 'ici_scores';    data: ICIScores }
  | { type: 'day_completed'; data: { dayNumber: number; slug?: string } }
  | { type: 'plan_saved';    data: { title: string } }

// Whether this widget should expand the message wrapper to full width
export function widgetIsFullWidth(widget: ChatWidget): boolean {
  return widget.type === 'ici_scores'
}

interface Props {
  widget: ChatWidget
}

function ICIScoresWidget({ scores }: { scores: ICIScores }) {
  return (
    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <ICICard scores={scores} showShare />
      <a
        href="/profile"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          marginTop: 2,
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--tng-purple-700)',
          textDecoration: 'underline',
          textDecorationColor: 'var(--tng-lime)',
          textUnderlineOffset: '3px',
        }}
      >
        Ver no Dossier →
      </a>
    </div>
  )
}

export function ChatWidgetRenderer({ widget }: Props) {
  switch (widget.type) {

    case 'ici_scores':
      return <ICIScoresWidget scores={widget.data} />

    case 'day_completed':
      return (
        <div style={{
          marginTop: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 16px',
          background: 'rgba(24,137,90,0.08)',
          border: '1px solid rgba(24,137,90,0.25)',
          borderRadius: 10,
          flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'rgba(24,137,90,0.12)',
              border: '1px solid rgba(24,137,90,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: 'var(--tng-success)', flexShrink: 0,
            }}>
              ✓
            </span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tng-success)', lineHeight: 1.3 }}>
                Sessão concluída
              </div>
              <div style={{ fontSize: 11, color: 'var(--tng-ink-3)', marginTop: 2 }}>
                Volte ao dia para marcar as atividades como concluídas
              </div>
            </div>
          </div>
          {widget.data.slug && widget.data.dayNumber > 0 && (
            <a
              href={`/${widget.data.slug}/days/${widget.data.dayNumber}`}
              style={{
                fontSize: 12, fontWeight: 600,
                padding: '7px 14px', borderRadius: 999,
                background: 'var(--tng-success)', color: '#fff',
                textDecoration: 'none', flexShrink: 0,
              }}
            >
              Ir para o Dia {widget.data.dayNumber} →
            </a>
          )}
        </div>
      )

    case 'plan_saved':
      return (
        <div style={{
          marginTop: 10,
          background: 'var(--tng-paper, #fff)',
          border: '0.5px solid rgba(0,0,0,0.1)',
          borderLeft: '3px solid var(--tng-coral)',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '14px 16px',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 0 }}>
              <span style={{
                width: 32, height: 32,
                borderRadius: 8,
                background: 'var(--tng-coral)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, flexShrink: 0, marginTop: 1,
              }}>
                ✦
              </span>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.06em',
                  textTransform: 'uppercase', color: 'var(--tng-coral)',
                  marginBottom: 3,
                }}>
                  Plano de ação salvo
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: 'var(--tng-ink-1)',
                  lineHeight: 1.4, wordBreak: 'break-word',
                }}>
                  {widget.data.title}
                </div>
              </div>
            </div>
            <a
              href="/plans"
              style={{
                fontSize: 12, fontWeight: 700,
                padding: '7px 14px', borderRadius: 6,
                background: 'var(--tng-coral)', color: '#fff',
                textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap',
              }}
            >
              Ver planos →
            </a>
          </div>
        </div>
      )

    default:
      return null
  }
}
