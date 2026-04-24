'use client'

import { useState } from 'react'

interface Program {
  id: string
  name: string
  description: string | null
  price_brl: number | null
  token_allocation: number | null
  validity_days: number | null
}

export function PricingCards({
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
        padding: '32px 24px', background: 'var(--bg3)',
        border: '0.5px solid var(--border)', borderRadius: 'var(--r)',
        textAlign: 'center', color: 'var(--text3)', fontSize: 13,
      }}>
        Nenhum programa disponível para compra no momento.
      </div>
    )
  }

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: programs.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 16,
      }}>
        {programs.map((program) => {
          const isEnrolled = enrolled.has(program.id)
          return (
          <div
            key={program.id}
            style={{
              background: 'var(--bg3)',
              border: `0.5px solid ${isEnrolled ? 'var(--border)' : 'var(--border2)'}`,
              borderRadius: 'var(--rlg)',
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              opacity: isEnrolled ? 0.55 : 1,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>
                  {program.name}
                </span>
                {isEnrolled && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 7px',
                    borderRadius: 4, background: 'var(--green-dim)',
                    color: 'var(--green)', letterSpacing: '.05em', textTransform: 'uppercase',
                  }}>
                    Inscrito
                  </span>
                )}
              </div>
              {program.description && (
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                  {program.description}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {program.token_allocation && (
                <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ color: 'var(--green)', fontSize: 10 }}>●</span>
                  {(program.token_allocation / 1_000_000).toFixed(0)}M créditos de IA
                </div>
              )}
              {program.validity_days && (
                <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ color: 'var(--green)', fontSize: 10 }}>●</span>
                  Acesso por {program.validity_days} dias
                </div>
              )}
            </div>

            <div style={{ marginTop: 'auto' }}>
              {program.price_brl != null && (
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>R$ </span>
                  <span style={{ fontSize: 26, fontWeight: 600, color: 'var(--text)' }}>
                    {program.price_brl.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </span>
                </div>
              )}
              <button
                onClick={() => !isEnrolled && handleBuy(program.id)}
                disabled={loading === program.id || isEnrolled}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: isEnrolled ? 'var(--bg4)' : loading === program.id ? 'var(--accent-dim)' : 'var(--accent)',
                  color: isEnrolled ? 'var(--text4)' : loading === program.id ? 'var(--accent)' : 'var(--accent-text)',
                  border: isEnrolled ? '0.5px solid var(--border)' : loading === program.id ? '0.5px solid var(--accent)' : 'none',
                  borderRadius: 'var(--rsm)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isEnrolled || loading === program.id ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font)',
                  transition: 'opacity 0.15s',
                }}
              >
                {isEnrolled ? 'Já inscrito' : loading === program.id ? 'Aguarde...' : 'Comprar →'}
              </button>
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
