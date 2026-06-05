import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { getEnrollmentBySlug } from '@/lib/programs'
import { ProgramStore } from '@/components/program-store'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createServerClient()
  const { data: program } = await supabase
    .from('programs')
    .select('name, description')
    .eq('slug', slug)
    .eq('store_visible', true)
    .maybeSingle()

  if (!program) return { title: 'Programa não encontrado' }

  return {
    title: program.name,
    description: program.description ?? undefined,
  }
}

export default async function ProgramLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: program } = await supabase
    .from('programs')
    .select('id, slug, name, description, features, price_brl, token_allocation, validity_days')
    .eq('slug', slug)
    .eq('store_visible', true)
    .maybeSingle()

  if (!program) notFound()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const hasAccess = ['student', 'mentor', 'admin'].includes(profile?.role ?? '')
  const firstName = profile?.full_name?.split(' ')[0] ?? null

  const enrollment = hasAccess ? await getEnrollmentBySlug(user.id, slug, supabase) : null

  let completedDays = 0
  if (enrollment) {
    const { data: doneActivities } = await supabase
      .from('day_activities')
      .select('id')
      .eq('program_enrollment_id', enrollment.id)
      .eq('status', 'done')
    completedDays = doneActivities?.length ?? 0
  }

  const enrollmentSummaries = enrollment
    ? [{
        id: enrollment.id,
        slug: enrollment.program.slug,
        name: enrollment.program.name,
        completedDays,
        totalDays: enrollment.program.total_days ?? 30,
        status: enrollment.status,
      }]
    : []

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--tng-cream)',
      fontFamily: 'var(--tng-font-body)',
    }}>
      <style>{`
        .pgm-header {
          display: flex; align-items: center; justify-content: space-between;
          height: 72px; padding: 0 40px;
          border-bottom: 1px solid var(--tng-rule);
          background: var(--tng-cream);
        }
        .pgm-brand-sub {
          font-family: var(--tng-font-mono); font-size: 10px;
          text-transform: uppercase; letter-spacing: .20em;
          color: var(--tng-coral); margin-top: 5px;
        }
        .pgm-back {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 999px;
          border: 1px solid var(--tng-rule); background: var(--tng-paper);
          color: var(--tng-ink); font-size: 14px; font-weight: 500;
          text-decoration: none; white-space: nowrap;
        }
        .pgm-footer {
          border-top: 1px solid var(--tng-rule);
          padding: 20px 40px;
          display: flex; align-items: center; justify-content: space-between;
          background: var(--tng-paper);
        }
        @media (max-width: 768px) {
          .pgm-header   { height: auto; padding: 14px 20px; }
          .pgm-brand-sub { display: none; }
          .pgm-back     { padding: 7px 12px; font-size: 12px; }
          .pgm-footer   { padding: 16px 20px; flex-direction: column; gap: 8px; align-items: flex-start; }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="pgm-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mark.svg" width={38} height={38} alt="TNG" style={{ flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{
              fontFamily: 'var(--tng-font-display)', fontWeight: 700, fontSize: 16,
              letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--tng-purple-700)',
            }}>Trampar na Gringa</span>
            <span className="pgm-brand-sub">Companion</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {hasAccess && (
            <a href="/today" className="pgm-back">← Voltar ao app</a>
          )}
          {!hasAccess && (
            <a href="/programs" className="pgm-back">← Ver todos os programas</a>
          )}
          <form action="/auth/signout" method="post">
            <button type="submit" style={{
              fontSize: 14, color: 'var(--tng-ink-3)',
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}>Sair</button>
          </form>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────────── */}
      <ProgramStore
        enrollments={enrollmentSummaries}
        storePrograms={[program]}
        firstName={firstName}
      />

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="pgm-footer">
        <div style={{ fontSize: 13, color: 'var(--tng-ink-3)' }}>
          {!hasAccess && (
            <>Já comprou?{' '}
              <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--tng-ink-2)', textDecoration: 'underline' }}>
                Fale com a equipe TNG →
              </a>
            </>
          )}
        </div>
        <span style={{ fontSize: 13, color: 'var(--tng-mute)' }}>© Trampar na Gringa</span>
      </div>
    </div>
  )
}
