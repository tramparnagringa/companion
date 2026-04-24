'use client'

import { useState } from 'react'

interface Program {
  id: string
  slug: string
  name: string
  description: string | null
  features: string[]
  price_brl: number | null
  token_allocation: number | null
  validity_days: number | null
}

export function ProgramStore({
  programs,
  enrolledProgramIds = [],
}: {
  programs: Program[]
  enrolledProgramIds?: string[]
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const enrolled = new Set(enrolledProgramIds)

  async function handleBuy(programId: string) {
    setLoading(programId)
    setError(null)
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: programId }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError('Erro ao iniciar pagamento. Tente novamente.')
        return
      }
      window.location.href = data.url
    } catch {
      setError('Erro ao iniciar pagamento. Tente novamente.')
    } finally {
      setLoading(null)
    }
  }

  if (programs.length === 0) {
    return (
      <div style={{
        padding: '48px 24px', background: 'var(--bg2)',
        border: '0.5px solid var(--border)', borderRadius: 'var(--rlg)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 6 }}>
          Nenhum programa disponível no momento.
        </div>
        <div style={{ fontSize: 12, color: 'var(--text4)' }}>
          Entre em contato com a equipe TNG para mais informações.
        </div>
      </div>
    )
  }

  const isSingle = programs.length === 1

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isSingle ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 16,
      }}>
        {programs.map((program) => {
          const isEnrolled = enrolled.has(program.id)
          const isLoading = loading === program.id

          return (
            <div
              key={program.id}
              style={{
                background: 'var(--bg2)',
                border: `0.5px solid ${isEnrolled ? 'var(--border2)' : 'var(--border2)'}`,
                borderRadius: 'var(--rlg)',
                padding: '28px 28px 24px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {/* Enrolled badge */}
              {isEnrolled && (
                <div style={{
                  position: 'absolute', top: 20, right: 20,
                  fontSize: 10, fontWeight: 600, padding: '3px 9px',
                  borderRadius: 6, background: 'var(--green-dim)',
                  color: 'var(--green)', letterSpacing: '.05em', textTransform: 'uppercase',
                }}>
                  Inscrito
                </div>
              )}

              {/* Name + description */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                  {program.name}
                </div>
                {program.description && (
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65 }}>
                    {program.description}
                  </div>
                )}
              </div>

              {/* Feature list */}
              {program.features.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
                  {program.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{
                        color: 'var(--accent)', fontSize: 12, lineHeight: 1,
                        marginTop: 2, flexShrink: 0,
                      }}>✓</span>
                      <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                        {f}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Auto features from metadata */}
              {program.features.length === 0 && (program.token_allocation || program.validity_days) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
                  {program.token_allocation && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: 'var(--accent)', fontSize: 12 }}>✓</span>
                      <span style={{ fontSize: 13, color: 'var(--text2)' }}>
                        {(program.token_allocation / 1_000_000).toFixed(0)}M créditos de IA inclusos
                      </span>
                    </div>
                  )}
                  {program.validity_days && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: 'var(--accent)', fontSize: 12 }}>✓</span>
                      <span style={{ fontSize: 13, color: 'var(--text2)' }}>
                        Acesso por {program.validity_days >= 365 ? '1 ano' : `${program.validity_days} dias`}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* Price + CTA */}
              <div style={{
                borderTop: '0.5px solid var(--border)',
                paddingTop: 20,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: 16,
              }}>
                <div>
                  {program.price_brl != null && (
                    <>
                      <div style={{ fontSize: 11, color: 'var(--text4)', marginBottom: 2 }}>
                        Pagamento único
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                        <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 400 }}>R$</span>
                        <span style={{
                          fontSize: 30, fontWeight: 600, color: 'var(--text)',
                          fontFamily: 'var(--mono)', letterSpacing: '-.02em',
                        }}>
                          {program.price_brl.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 2 }}>
                        Pagamento seguro · acesso imediato
                      </div>
                    </>
                  )}
                </div>

                {isEnrolled ? (
                  <a
                    href={`/${program.slug}/today`}
                    style={{
                      padding: '11px 22px',
                      background: 'var(--purple-dim)',
                      color: 'var(--purple)',
                      border: '0.5px solid var(--purple)',
                      borderRadius: 'var(--rsm)',
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: 'var(--font)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      textDecoration: 'none',
                      display: 'inline-block',
                    }}
                  >
                    Acessar →
                  </a>
                ) : (
                  <button
                    onClick={() => handleBuy(program.id)}
                    disabled={isLoading}
                    style={{
                      padding: '11px 22px',
                      background: isLoading ? 'var(--accent-dim)' : 'var(--accent)',
                      color: isLoading ? 'var(--accent)' : 'var(--accent-text)',
                      border: isLoading ? '0.5px solid var(--accent)' : 'none',
                      borderRadius: 'var(--rsm)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {isLoading ? 'Aguarde...' : 'Comprar agora →'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {error && (
        <div style={{
          marginTop: 12, padding: '10px 14px',
          background: 'var(--red-dim)', border: '0.5px solid var(--red)',
          borderRadius: 'var(--rsm)', fontSize: 12, color: 'var(--red)',
        }}>
          {error}
        </div>
      )}
    </div>
  )
}
