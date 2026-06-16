import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { LogoMark } from '@/components/ui/logo-mark'

export const metadata: Metadata = { title: 'Bem-vindo ao TNG Companion' }

export default async function WelcomePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const hasAccess = ['student', 'mentor', 'admin'].includes(profile?.role ?? '')
  const firstName = profile?.full_name?.split(' ')[0] ?? null

  const { data: programs } = await supabase
    .from('programs')
    .select('id, slug, name, description, features, price_brl, token_allocation, validity_days')
    .eq('store_visible', true)
    .order('display_order')

  const storePrograms = programs ?? []

  return (
    <div className="ws-act">
      <style>{`
        .ws-act *, .ws-act *::before, .ws-act *::after { box-sizing: border-box; }
        .ws-act {
          min-height: 100vh; display: flex; flex-direction: column;
          background: var(--tng-cream); font-family: var(--tng-font-body);
          color: var(--tng-ink); font-size: 15px; line-height: 1.55;
          -webkit-font-smoothing: antialiased;
        }
        .ws-act p { margin: 0; }

        /* ── header ──────────────────────────────────────────── */
        .ws-act-top {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 44px; flex-shrink: 0;
        }
        .ws-act-brand { display: flex; align-items: center; gap: 11px; text-decoration: none; }
        .ws-act-brand img { width: 32px; height: 32px; }
        .ws-act-brand .bs { display: flex; flex-direction: column; line-height: 1; }
        .ws-act-brand .wm {
          font-family: var(--tng-font-display); font-weight: 700; font-size: 15px;
          text-transform: uppercase; letter-spacing: 0.06em; color: var(--tng-purple-700);
        }
        .ws-act-brand .pr {
          font-family: var(--tng-font-mono); font-size: 9px;
          text-transform: uppercase; letter-spacing: 0.2em;
          color: var(--tng-coral); margin-top: 4px;
        }
        .ws-act-nav { display: flex; align-items: center; gap: 16px; }
        .ws-act-back {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 16px; border-radius: 999px;
          border: 1px solid var(--tng-rule); background: var(--tng-paper);
          color: var(--tng-ink); font-size: 13px; font-weight: 500;
          text-decoration: none; white-space: nowrap;
        }
        .ws-act-exit {
          font-size: 13px; color: var(--tng-ink-3);
          background: none; border: none; cursor: pointer;
          font-family: var(--tng-font-body);
        }

        /* ── main ────────────────────────────────────────────── */
        .ws-act-main {
          flex: 1; display: flex; align-items: center; justify-content: center;
          padding: 20px 44px 60px;
        }
        .ws-act-inner {
          max-width: 1000px; width: 100%;
          display: grid; grid-template-columns: 1.05fr 0.95fr;
          gap: 56px; align-items: center;
        }
        .ws-act-l { min-width: 0; }

        /* eyebrow */
        .ws-act-eye {
          display: inline-flex; align-items: center; gap: 9px;
          font-family: var(--tng-font-mono); font-size: 11px;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--tng-purple-700); margin-bottom: 18px;
        }
        .ws-act-eye .dot {
          width: 7px; height: 7px; border-radius: 999px;
          background: var(--tng-coral); flex-shrink: 0;
        }

        /* headline */
        .ws-act h1 {
          font-family: var(--tng-font-display);
          font-size: clamp(34px, 4.2vw, 46px);
          font-weight: 800; letter-spacing: -0.03em;
          line-height: 1.06; color: var(--tng-purple-900);
          margin: 0 0 18px; text-wrap: balance;
        }
        .ws-act h1 em {
          font-family: var(--tng-font-serif); font-style: italic;
          font-weight: 400; color: var(--tng-coral);
        }

        /* subtitle */
        .ws-act-sub {
          font-size: 17px; line-height: 1.55;
          color: var(--tng-ink-2); max-width: 460px; margin: 0 0 28px;
        }
        .ws-act-sub b { color: var(--tng-ink); font-weight: 700; }

        /* CTA row */
        .ws-act-cta { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }

        /* buttons */
        .ws-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 14px 26px; border-radius: 999px; font-family: var(--tng-font-body);
          font-weight: 700; font-size: 15px; cursor: pointer; border: 0;
          text-decoration: none; white-space: nowrap;
          transition: transform 120ms ease, box-shadow 120ms ease;
        }
        .ws-btn-lime {
          background: var(--tng-lime); color: var(--tng-purple-900);
          border: 1.5px solid var(--tng-ink); box-shadow: 3px 3px 0 var(--tng-ink);
        }
        .ws-btn-lime:hover { transform: translate(-2px,-2px); box-shadow: 5px 5px 0 var(--tng-ink); }
        .ws-btn-ghost {
          background: transparent; border: 1px solid var(--tng-rule);
          color: var(--tng-ink-2); padding: 14px 26px;
          font-size: 15px; font-weight: 600;
        }
        .ws-btn-ghost:hover { border-color: var(--tng-ink); color: var(--tng-ink); }

        /* trust label */
        .ws-act-free {
          font-family: var(--tng-font-mono); font-size: 12px;
          color: var(--tng-ink-3); margin-top: 16px;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .ws-act-free svg { width: 14px; height: 14px; color: var(--tng-success); }

        /* ── steps card ──────────────────────────────────────── */
        .ws-steps {
          background: var(--tng-paper);
          border: 1.5px solid var(--tng-ink);
          border-radius: var(--tng-radius-lg, 14px);
          box-shadow: 5px 5px 0 var(--tng-ink);
          padding: 28px 30px;
        }
        .ws-steps-eye {
          font-family: var(--tng-font-mono); font-size: 10.5px;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--tng-coral); margin-bottom: 18px;
        }
        .ws-step {
          display: flex; gap: 15px; padding: 15px 0;
          border-bottom: 1px solid var(--tng-rule);
        }
        .ws-step:last-child { border-bottom: 0; padding-bottom: 0; }
        .ws-step-n {
          width: 30px; height: 30px; border-radius: 999px;
          background: var(--tng-purple-900); color: var(--tng-lime);
          display: grid; place-items: center;
          font-family: var(--tng-font-mono); font-weight: 700;
          font-size: 13px; flex-shrink: 0;
        }
        .ws-step-b { flex: 1; min-width: 0; }
        .ws-step-h {
          font-family: var(--tng-font-display); font-size: 17px;
          font-weight: 800; color: var(--tng-purple-900);
          letter-spacing: -0.01em; line-height: 1.2;
        }
        .ws-step-s {
          font-size: 13.5px; color: var(--tng-ink-3);
          margin-top: 4px; line-height: 1.45;
        }
        .ws-step-s b { color: var(--tng-ink); font-weight: 700; }
        .ws-step-credit {
          font-family: var(--tng-font-mono); font-size: 11px;
          color: var(--tng-purple-700); font-weight: 700;
          margin-top: 6px; display: inline-flex; align-items: center; gap: 6px;
        }

        /* ── ladder ──────────────────────────────────────────── */
        .ws-ladder {
          border-top: 1px solid var(--tng-rule);
          padding: 26px 44px 36px; flex-shrink: 0;
        }
        .ws-ladder-inner { max-width: 1000px; margin: 0 auto; }
        .ws-ladder-h {
          font-family: var(--tng-font-mono); font-size: 11px;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--tng-ink-3); margin-bottom: 16px;
          display: flex; align-items: center; gap: 12px;
        }
        .ws-ladder-h::after {
          content: ""; flex: 1; height: 1px; background: var(--tng-rule);
        }
        .ws-ladder-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .ws-ladder-card {
          background: var(--tng-paper); border: 1px solid var(--tng-rule);
          border-radius: var(--tng-radius-md, 10px); padding: 16px 18px;
          text-decoration: none; display: block;
          transition: border-color 120ms ease;
        }
        .ws-ladder-card:hover { border-color: var(--tng-purple-700); }
        .ws-ladder-card .lk {
          font-family: var(--tng-font-mono); font-size: 10px;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--tng-mute); margin-bottom: 8px;
          display: flex; align-items: center; gap: 6px;
        }
        .ws-ladder-card .ln {
          font-family: var(--tng-font-display); font-size: 16px;
          font-weight: 800; color: var(--tng-ink-2);
          letter-spacing: -0.01em; line-height: 1.15;
        }
        .ws-ladder-card .ld {
          font-size: 12.5px; color: var(--tng-ink-3);
          margin-top: 5px; line-height: 1.4;
        }
        .ws-ladder-card .lp {
          font-family: var(--tng-font-mono); font-size: 12px;
          color: var(--tng-purple-700); font-weight: 700; margin-top: 10px;
        }

        /* ── responsive ──────────────────────────────────────── */
        @media (max-width: 920px) {
          .ws-act-inner { grid-template-columns: 1fr; gap: 32px; }
        }
        @media (max-width: 768px) {
          .ws-act-top { padding: 14px 20px; }
          .ws-act-main { padding: 20px 20px 48px; }
          .ws-act-cta { flex-direction: column; align-items: flex-start; }
          .ws-ladder { padding: 20px 20px 32px; }
          .ws-ladder-row { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="ws-act-top">
        <a href={hasAccess ? '/days' : '/welcome'} className="ws-act-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <LogoMark size={32} />
          <div className="bs">
            <span className="wm">Trampar na Gringa</span>
            <span className="pr">Companion</span>
          </div>
        </a>

        <nav className="ws-act-nav">
          {hasAccess && (
            <a href="/days" className="ws-act-back">← Voltar ao app</a>
          )}
          <form action="/auth/signout" method="post">
            <button type="submit" className="ws-act-exit">Sair</button>
          </form>
        </nav>
      </header>

      {/* ── Main ───────────────────────────────────────────────────── */}
      <main className="ws-act-main">
        <div className="ws-act-inner">

          {/* Left: value proposition */}
          <div className="ws-act-l">
            <div className="ws-act-eye">
              <span className="dot" />
              {firstName ? `Olá, ${firstName}` : 'Trampar na Gringa · Companion'}
            </div>

            <h1>
              Sua candidatura <em>internacional</em> começa aqui
            </h1>

            <p className="ws-act-sub">
              Programas estruturados com IA. Cada conversa salva seu progresso.{' '}
              <b>Cada dia te aproxima da vaga certa.</b>
            </p>

            <div className="ws-act-cta">
              <a href="/programs" className="ws-btn ws-btn-lime">
                Ver programas →
              </a>
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="ws-btn ws-btn-ghost"
              >
                Já comprou? Fale com a equipe
              </a>
            </div>

            <div className="ws-act-free">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 8.5l3 3 7-7" />
              </svg>
              Acesso imediato após o pagamento
            </div>
          </div>

          {/* Right: steps card */}
          <div className="ws-steps">
            <div className="ws-steps-eye">Como funciona</div>

            <div className="ws-step">
              <div className="ws-step-n">1</div>
              <div className="ws-step-b">
                <div className="ws-step-h">Escolha seu programa</div>
                <p className="ws-step-s">
                  Selecione o programa ideal para o seu momento na candidatura internacional.
                </p>
              </div>
            </div>

            <div className="ws-step">
              <div className="ws-step-n">2</div>
              <div className="ws-step-b">
                <div className="ws-step-h">Faça o pagamento</div>
                <p className="ws-step-s">
                  Via <b>PIX</b>, pagamento único. Sem mensalidade, sem surpresa.
                </p>
                <div className="ws-step-credit">
                  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="8" cy="8" r="6.5" />
                    <path d="M8 5v3.5l2 1.5" />
                  </svg>
                  Créditos de IA inclusos no programa
                </div>
              </div>
            </div>

            <div className="ws-step">
              <div className="ws-step-n">3</div>
              <div className="ws-step-b">
                <div className="ws-step-h">Comece hoje</div>
                <p className="ws-step-s">
                  A IA já tem o seu contexto. É só conversar — o Companion guia cada passo.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ── Ladder: program cards ───────────────────────────────────── */}
      {storePrograms.length > 0 && (
        <section className="ws-ladder">
          <div className="ws-ladder-inner">
            <div className="ws-ladder-h">Programas disponíveis</div>
            <div className="ws-ladder-row">
              {storePrograms.map(p => (
                <a key={p.id} href={`/programs/${p.slug}`} className="ws-ladder-card">
                  <div className="lk">
                    <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                      <circle cx="6" cy="6" r="5" />
                      <path d="M6 3.5V6l1.5 1.5" />
                    </svg>
                    Programa
                  </div>
                  <div className="ln">{p.name}</div>
                  {p.description && (
                    <div className="ld">
                      {p.description.length > 80 ? p.description.slice(0, 80) + '…' : p.description}
                    </div>
                  )}
                  {p.price_brl != null && (
                    <div className="lp">
                      R$ {p.price_brl.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} →
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
