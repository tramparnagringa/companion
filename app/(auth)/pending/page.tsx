import { createServerClient } from '@/lib/supabase/server'
import { getAllEnrollments } from '@/lib/programs'
import { redirect } from 'next/navigation'

export default async function PendingPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // If they have access AND at least one enrollment, redirect to app
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile && ['student', 'mentor', 'admin'].includes(profile.role ?? '')) {
    const enrollments = await getAllEnrollments(user.id, supabase)
    if (enrollments.length > 0) redirect('/today')
  }

  const displayName = profile?.full_name ?? user.email

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 420, padding: 40, background: 'var(--bg2)',
        border: '0.5px solid var(--border2)', borderRadius: 'var(--rxl)',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '.12em',
          textTransform: 'uppercase', color: 'var(--accent)',
          marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        }}>
          <span style={{ width: 5, height: 5, background: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }} />
          TNG Companion
        </div>

        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'var(--accent-dim)', border: '1px solid rgba(228,253,139,.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, margin: '0 auto 20px',
        }}>
          ⏳
        </div>

        <div style={{ fontSize: 20, fontWeight: 500, marginBottom: 8 }}>
          Acesso pendente
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 24 }}>
          Olá, <strong style={{ color: 'var(--text)' }}>{displayName}</strong>. Sua conta foi criada com sucesso, mas o acesso ao TNG Companion é liberado manualmente após a confirmação da sua vaga.
          <br /><br />
          Se você já confirmou, entre em contato com a equipe TNG.
        </div>

        <div style={{
          background: 'var(--bg3)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--rsm)', padding: '10px 14px',
          fontSize: 12, color: 'var(--text3)',
        }}>
          Conta: <span style={{ color: 'var(--text2)', fontFamily: 'var(--mono)' }}>{user.email}</span>
        </div>

        <form action="/auth/signout" method="post" style={{ marginTop: 20 }}>
          <button type="submit" style={{
            fontSize: 12, color: 'var(--text3)', background: 'none',
            border: 'none', cursor: 'pointer', fontFamily: 'var(--font)',
            textDecoration: 'underline',
          }}>
            Sair e usar outra conta
          </button>
        </form>
      </div>
    </div>
  )
}
