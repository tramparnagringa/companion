import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { getAllEnrollments } from '@/lib/programs'
import { redirect } from 'next/navigation'
import { LogoMark } from '@/components/ui/logo-mark'

export const metadata: Metadata = { title: 'Programas' }
import { ProgramStore } from '@/components/program-store'

export default async function ProgramsPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const hasAccess = ['student', 'mentor', 'admin'].includes(profile?.role ?? '')

  const enrollments = hasAccess ? await getAllEnrollments(user.id, supabase) : []

  const { data: programs } = await supabase
    .from('programs')
    .select('id, slug, name, description, features, price_brl, token_allocation, validity_days')
    .eq('store_visible', true)
    .order('display_order')

  const firstName = profile?.full_name?.split(' ')[0] ?? null

  // Count actual completed days from day_activities (current_day in user_programs is unreliable)
  const enrollmentIds = enrollments.map(e => e.id)
  const { data: doneActivities } = enrollmentIds.length > 0
    ? await supabase
        .from('day_activities')
        .select('program_enrollment_id')
        .in('program_enrollment_id', enrollmentIds)
        .eq('status', 'done')
    : { data: [] as { program_enrollment_id: string }[] }

  const completedByEnrollment = new Map<string, number>()
  for (const row of doneActivities ?? []) {
    if (!row.program_enrollment_id) continue
    completedByEnrollment.set(
      row.program_enrollment_id,
      (completedByEnrollment.get(row.program_enrollment_id) ?? 0) + 1
    )
  }

  const enrollmentSummaries = enrollments.map(e => ({
    id:            e.id,
    slug:          e.program.slug,
    name:          e.program.name,
    completedDays: completedByEnrollment.get(e.id) ?? 0,
    totalDays:     e.program.total_days ?? 30,
    status:        e.status,
  }))

  // All visible programs — enrolled ones show "Acessar", others show "Comprar"
  const storePrograms = programs ?? []

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
          background: var(--tng-paper);
        }
        .pgm-inner {
          width: 100%; max-width: 1080px; margin: 0 auto; padding: 0 40px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .pgm-header .pgm-inner { height: 72px; }
        .pgm-footer .pgm-inner { padding-top: 20px; padding-bottom: 20px; }
        @media (max-width: 768px) {
          .pgm-header   { height: auto; }
          .pgm-inner    { padding: 14px 20px; height: auto !important; }
          .pgm-brand-sub { display: none; }
          .pgm-back     { padding: 7px 12px; font-size: 12px; }
          .pgm-footer .pgm-inner { flex-direction: column; gap: 8px; align-items: flex-start; }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="pgm-header">
        <div className="pgm-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LogoMark size={38} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{
                fontFamily: 'var(--tng-font-display)', fontWeight: 700, fontSize: 16,
                letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--tng-purple-700)',
              }}>Trampar na Gringa</span>
              <span className="pgm-brand-sub">Companion</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {enrollments.length > 0 && (
              <a href="/today" className="pgm-back">← Voltar ao app</a>
            )}
            <form action="/auth/signout" method="post">
              <button type="submit" style={{
                fontSize: 14, color: 'var(--tng-ink-3)',
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}>Sair</button>
            </form>
          </div>
        </div>
      </header>

      {/* ── Content ────────────────────────────────────────────── */}
      <ProgramStore
        enrollments={enrollmentSummaries}
        storePrograms={storePrograms}
        firstName={firstName}
      />

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="pgm-footer">
        <div className="pgm-inner">
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

    </div>
  )
}
