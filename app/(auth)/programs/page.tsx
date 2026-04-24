import { createServerClient } from '@/lib/supabase/server'
import { getAllEnrollments } from '@/lib/programs'
import { redirect } from 'next/navigation'
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
  const enrolledProgramIds = new Set(enrollments.map(e => e.program_id))

  const { data: programs } = await supabase
    .from('programs')
    .select('id, slug, name, description, features, price_brl, token_allocation, validity_days')
    .eq('store_visible', true)
    .order('display_order')

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '60px 24px 80px',
      fontFamily: 'var(--font)',
    }}>
      <div style={{ width: '100%', maxWidth: 780 }}>

        {/* Back link for users who already have access */}
        {hasAccess && (
          <div style={{ marginBottom: 32 }}>
            <a href="/today" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 12, color: 'var(--text3)',
              background: 'var(--bg3)', border: '0.5px solid var(--border)',
              borderRadius: 'var(--rsm)', padding: '6px 12px',
              textDecoration: 'none',
            }}>
              ← Voltar ao app
            </a>
          </div>
        )}

        {/* Hero */}
        <div style={{ marginBottom: 52 }}>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '.12em',
            textTransform: 'uppercase', color: 'var(--accent)',
            marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <span style={{ width: 5, height: 5, background: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }} />
            TNG Companion
          </div>

          <h1 style={{
            fontSize: 32, fontWeight: 600, color: 'var(--text)',
            margin: '0 0 14px', lineHeight: 1.2, letterSpacing: '-.01em',
          }}>
            Sua vaga internacional<br />começa aqui.
          </h1>
          <p style={{
            fontSize: 15, color: 'var(--text2)', margin: 0, lineHeight: 1.7,
            maxWidth: 520,
          }}>
            Programas estruturados com IA como co-piloto. Você sai com CV, LinkedIn, estratégia de candidatura e entrevistas simuladas — tudo pronto para o mercado internacional.
          </p>
        </div>

        {/* Program cards */}
        <ProgramStore programs={programs ?? []} enrolledProgramIds={[...enrolledProgramIds]} />

        {/* Footer */}
        <div style={{ marginTop: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {!hasAccess ? (
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>
              Já comprou?{' '}
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--text2)', textDecoration: 'underline' }}
              >
                Fale com a equipe TNG →
              </a>
            </div>
          ) : <div />}
          <form action="/auth/signout" method="post">
            <button type="submit" style={{
              fontSize: 12, color: 'var(--text4)', background: 'none',
              border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
              textDecoration: 'underline',
            }}>
              Sair
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
