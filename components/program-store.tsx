'use client'

import { useState } from 'react'

/* ─── Types ──────────────────────────────────────────────────── */

interface EnrollmentSummary {
  id: string
  slug: string
  name: string
  completedDays: number
  totalDays: number
  status: string
}

interface StoreProgram {
  id: string
  slug: string
  name: string
  description: string | null
  features: string[]
  price_brl: number | null
  token_allocation: number | null
  validity_days: number | null
}

/* ─── Helpers ────────────────────────────────────────────────── */

function getFeatures(p: StoreProgram): string[] {
  if (p.features.length > 0) return p.features
  const auto: string[] = []
  if (p.token_allocation)
    auto.push(`${Math.floor(p.token_allocation / 1_000).toLocaleString('pt-BR')} créditos de IA inclusos`)
  if (p.validity_days)
    auto.push(`Acesso por ${p.validity_days >= 365 ? '1 ano' : `${p.validity_days} dias`}`)
  return auto
}


/* ─── Sub-components ─────────────────────────────────────────── */

function ProgressRing({ completedDays, totalDays, completed }: {
  completedDays: number; totalDays: number; completed: boolean
}) {
  const pct   = completed ? 100 : Math.min((completedDays / Math.max(totalDays, 1)) * 100, 100)
  const color = completed ? 'var(--tng-success)' : 'var(--tng-purple-700)'
  return (
    <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
      <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
        {/* scale: r=26, circ≈163.4, sw=7 */}
        <circle cx="32" cy="32" r="26" fill="none" stroke="var(--tng-bone)" strokeWidth="7" />
        <circle cx="32" cy="32" r="26" fill="none"
          stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray="163.4"
          strokeDashoffset={163.4 * (1 - pct / 100)} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--tng-font-mono)', fontSize: 13, fontWeight: 700, color,
      }}>
        {completed ? '✓' : `${Math.round(pct)}%`}
      </div>
    </div>
  )
}

function LimeCheck() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="none"
      stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  )
}

/* ─── Main component ─────────────────────────────────────────── */

export function ProgramStore({
  enrollments = [],
  storePrograms = [],
  firstName,
}: {
  enrollments?: EnrollmentSummary[]
  storePrograms?: StoreProgram[]
  firstName?: string | null
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  // Quick lookup: program slug → enrollment
  const enrollmentBySlug = new Map(enrollments.map(e => [e.slug, e]))

  async function handleBuy(programId: string) {
    setLoading(programId)
    setError(null)
    try {
      const res  = await fetch('/api/payments/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: programId }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) { setError('Erro ao iniciar pagamento. Tente novamente.'); return }
      window.location.href = data.url
    } catch {
      setError('Erro ao iniciar pagamento. Tente novamente.')
    } finally {
      setLoading(null)
    }
  }

  if (storePrograms.length === 0) return null

  return (
    <div>
      <style>{`
        .ps-wrap           { max-width: 1080px; margin: 0 auto; padding: 0 40px; }
        .ps-banner         { background: var(--tng-purple-900); padding: 56px 0 120px;
                             position: relative; overflow: hidden; }
        .ps-stage          { margin-top: -84px; padding-bottom: 72px;
                             position: relative; z-index: 1; }
        .ps-product        { background: var(--tng-paper); border: 1.5px solid var(--tng-ink);
                             border-radius: 20px; box-shadow: 8px 8px 0 var(--tng-ink);
                             display: grid; grid-template-columns: 1.5fr 1fr; overflow: hidden; }
        .ps-product-main   { padding: 40px 40px 36px; border-right: 1px solid var(--tng-rule); }
        .ps-product-aside  { padding: 40px 34px; background: var(--tng-bone);
                             display: flex; flex-direction: column; }
        .ps-product-name   { font-family: var(--tng-font-display); font-weight: 800; font-size: 40px;
                             letter-spacing: -.025em; color: var(--tng-purple-900);
                             margin: 0; line-height: 1; }
        .ps-features       { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 22px;
                             padding: 0; list-style: none; margin: 0; }
        .ps-price-amt      { font-family: var(--tng-font-display); font-weight: 800; font-size: 88px;
                             line-height: 0.82; letter-spacing: -.04em; color: var(--tng-ink); }
        .ps-cta-btn        { display: flex; align-items: center; justify-content: center;
                             border-radius: 999px; padding: 17px 24px; font-size: 17px; font-weight: 700;
                             font-family: var(--tng-font-body); cursor: pointer; text-decoration: none;
                             transition: transform 120ms var(--tng-ease), box-shadow 120ms var(--tng-ease); }
        .ps-cta-btn.buy    { background: var(--tng-coral); color: #fff;
                             border: 1.5px solid var(--tng-ink);
                             box-shadow: 4px 4px 0 var(--tng-ink); }
        .ps-cta-btn.access { background: var(--tng-lime); color: var(--tng-purple-900);
                             border: 1.5px solid var(--tng-ink);
                             box-shadow: 4px 4px 0 var(--tng-ink); }
        .ps-cta-btn:hover:not(:disabled) {
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0 var(--tng-ink) !important;
        }

        @media (max-width: 768px) {
          .ps-wrap          { padding: 0 20px; }
          .ps-banner        { padding: 36px 0 96px; }
          .ps-stage         { margin-top: -60px; padding-bottom: 48px; }
          .ps-product       { grid-template-columns: 1fr; box-shadow: 4px 4px 0 var(--tng-ink); }
          .ps-product-main  { padding: 24px 20px 20px; border-right: none;
                              border-bottom: 1px solid var(--tng-rule); }
          .ps-product-aside { padding: 24px 20px 28px; }
          .ps-product-name  { font-size: 28px; }
          .ps-features      { grid-template-columns: 1fr; gap: 12px; }
          .ps-price-amt     { font-size: 64px; }
          .ps-cta-btn       { width: 100%; box-sizing: border-box; padding: 15px 20px; font-size: 16px; }
        }
      `}</style>

      {/* ── Banner ──────────────────────────────────────────────── */}
      <section className="ps-banner">
        <div style={{
          position: 'absolute', right: -10, bottom: -30,
          fontSize: 220, opacity: 0.05, lineHeight: 1,
          transform: 'rotate(-12deg)', pointerEvents: 'none', userSelect: 'none',
        }} aria-hidden="true">✌️</div>

        <div className="ps-wrap" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--tng-font-mono)', fontSize: 12, fontWeight: 700,
            letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--tng-lime)',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--tng-lime)', flexShrink: 0 }} />
            {firstName ? `Olá, ${firstName}` : 'Programas TNG'}
          </div>

          <h2 style={{
            fontFamily: 'var(--tng-font-display)', fontWeight: 700,
            fontSize: 'clamp(26px, 5vw, 46px)',
            letterSpacing: '-.025em', color: 'var(--tng-cream)',
            margin: '16px 0 0', lineHeight: 1.05, maxWidth: '20ch',
          }}>
            {enrollments.length > 0
              ? <>Continue sua jornada <em style={{ fontFamily: 'var(--tng-font-serif)', fontStyle: 'italic', fontWeight: 400, color: 'var(--tng-lime)' }}>internacional</em></>
              : <>Destrave a próxima etapa da sua <em style={{ fontFamily: 'var(--tng-font-serif)', fontStyle: 'italic', fontWeight: 400, color: 'var(--tng-lime)' }}>candidatura</em></>
            }
          </h2>

          <p style={{ fontSize: 'clamp(14px, 2.5vw, 17px)', color: 'var(--tng-night-ink2)', margin: '16px 0 0', maxWidth: '52ch' }}>
            {enrollments.length > 0
              ? 'Seus programas ativos e novos programas disponíveis, tudo em um só lugar.'
              : 'Programas estruturados com IA. Acesso imediato. Comece hoje mesmo.'
            }
          </p>
        </div>
      </section>

      {/* ── Cards ───────────────────────────────────────────────── */}
      <section className="ps-stage">
        <div className="ps-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {storePrograms.map(p => {
            const enrollment = enrollmentBySlug.get(p.slug)
            const isEnrolled = !!enrollment
            const isLoading  = loading === p.id
            const features   = getFeatures(p)
            const completed  = enrollment?.status === 'completed'
                            || (enrollment?.completedDays ?? 0) >= (enrollment?.totalDays ?? 1)

            return (
              <div key={p.id} className="ps-product">

                {/* ── Left: main content (same for all) ─────────── */}
                <div className="ps-product-main">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo-mark.svg" width={26} height={26} alt="TNG" />
                    <span style={{
                      fontFamily: 'var(--tng-font-mono)', fontSize: 11, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--tng-purple-700)',
                    }}>Trampar na Gringa</span>
                  </div>

                  <h3 className="ps-product-name">{p.name}</h3>

                  {p.description && (
                    <p style={{ fontSize: 'clamp(14px, 2vw, 17px)', lineHeight: 1.55, color: 'var(--tng-ink-2)', margin: '16px 0 26px', maxWidth: '44ch' }}>
                      {p.description}
                    </p>
                  )}

                  {features.length > 0 && (
                    <ul className="ps-features" style={{ margin: p.description ? 0 : '26px 0 0' }}>
                      {features.map((f, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: 'var(--tng-ink)', lineHeight: 1.4 }}>
                          <span style={{
                            width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                            background: 'var(--tng-lime)', border: '1.5px solid var(--tng-purple-900)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--tng-purple-900)',
                          }}>
                            <LimeCheck />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* ── Right aside: enrolled vs available ────────── */}
                {isEnrolled && enrollment ? (
                  /* ── ENROLLED: progress + access ────────────── */
                  <div className="ps-product-aside" style={{ alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                    <ProgressRing
                      completedDays={enrollment.completedDays}
                      totalDays={enrollment.totalDays}
                      completed={completed ?? false}
                    />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{
                        fontFamily: 'var(--tng-font-mono)', fontSize: 11, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '.14em',
                        color: completed ? 'var(--tng-success)' : 'var(--tng-ink-3)',
                        marginBottom: 4,
                      }}>
                        {completed ? 'Concluído' : 'Em andamento'}
                      </div>
                      <div style={{
                        fontFamily: 'var(--tng-font-display)', fontWeight: 700, fontSize: 22,
                        color: 'var(--tng-ink)', lineHeight: 1.1,
                      }}>
                        {completed
                          ? 'Programa completo'
                          : `${enrollment.completedDays} de ${enrollment.totalDays} dias`}
                      </div>
                    </div>
                    <a
                      href={`/${enrollment.slug}/today`}
                      className="ps-cta-btn access"
                      style={{ width: '100%', boxSizing: 'border-box', marginTop: 8 }}
                    >
                      Acessar →
                    </a>
                  </div>
                ) : (
                  /* ── AVAILABLE: price + buy ──────────────────── */
                  <div className="ps-product-aside">
                    <span style={{
                      fontFamily: 'var(--tng-font-mono)', fontSize: 11,
                      textTransform: 'uppercase', letterSpacing: '.16em', color: 'var(--tng-ink-3)',
                    }}>
                      Pagamento único
                    </span>

                    {p.price_brl != null ? (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, margin: '14px 0 2px' }}>
                        <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--tng-ink-2)', marginTop: 16 }}>R$</span>
                        <span className="ps-price-amt">
                          {p.price_brl.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                    ) : (
                      <div style={{ fontSize: 16, color: 'var(--tng-ink-3)', margin: '14px 0 2px' }}>Consulte</div>
                    )}

                    <p style={{ fontSize: 14.5, color: 'var(--tng-ink-2)', margin: '0 0 4px', fontWeight: 500 }}>
                      Acesso imediato e vitalício
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--tng-ink-3)', margin: '0 0 26px' }}>
                      Sem mensalidade. Pague uma vez, use sempre.
                    </p>

                    <button
                      className="ps-cta-btn buy"
                      onClick={() => handleBuy(p.id)}
                      disabled={isLoading}
                      style={{ border: '1.5px solid var(--tng-ink)', boxShadow: isLoading ? 'none' : '4px 4px 0 var(--tng-ink)', opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'not-allowed' : 'pointer' }}
                    >
                      {isLoading ? 'Aguarde...' : 'Comprar agora →'}
                    </button>

                    <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: 'var(--tng-ink-2)' }}>
                        <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="var(--tng-success)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M8 1.5l5.5 2v4c0 3.5-2.4 6-5.5 7-3.1-1-5.5-3.5-5.5-7v-4z" /><path d="M5.5 8l1.7 1.7L11 6" />
                        </svg>
                        Garantia incondicional de 7 dias
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: 'var(--tng-ink-2)' }}>
                        <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="var(--tng-success)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13z" /><path d="M8 4.5V8l2.5 1.5" />
                        </svg>
                        Liberação na hora, direto no Companion
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )
          })}
        </div>
      </section>

      {error && (
        <div className="ps-wrap" style={{ marginBottom: 32 }}>
          <div style={{
            padding: '10px 14px', background: 'rgba(200,68,43,.08)',
            border: '1px solid rgba(200,68,43,.3)', borderRadius: 8,
            fontSize: 12, color: 'var(--tng-danger)',
          }}>{error}</div>
        </div>
      )}
    </div>
  )
}
