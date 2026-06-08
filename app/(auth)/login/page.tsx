'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LogoMark } from '@/components/ui/logo-mark'

export default function LoginPage() {
  const [loading, setLoading] = useState<'google' | 'linkedin' | null>(null)
  const [error, setError]     = useState('')

  async function signIn(provider: 'google' | 'linkedin_oidc') {
    const key = provider === 'google' ? 'google' : 'linkedin'
    setLoading(key)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
      setLoading(null)
    }
    // On success the browser redirects — no need to reset loading
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--tng-cream)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Decorative background rule */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 3, background: 'var(--tng-purple-700)',
        }} />
      </div>

      <div style={{
        width: 400, padding: '36px 40px 40px',
        background: 'var(--tng-paper)',
        border: '1px solid var(--tng-rule)',
        borderRadius: 22,
        boxShadow: '0 2px 0 rgba(20,20,20,.04), 0 24px 48px -12px rgba(20,20,20,.12)',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <LogoMark size={28} />
          <div>
            <div style={{
              fontFamily: 'var(--tng-font-display)',
              fontWeight: 700, fontSize: 13,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--tng-purple-700)',
              lineHeight: 1,
            }}>
              Trampar na Gringa
            </div>
            <div style={{
              fontFamily: 'var(--mono)', fontSize: 9,
              textTransform: 'uppercase', letterSpacing: '0.18em',
              color: 'var(--tng-coral)', marginTop: 3,
            }}>
              Companion
            </div>
          </div>
        </div>

        {/* Heading */}
        <div style={{
          fontSize: 26, fontWeight: 700, marginBottom: 8,
          fontFamily: 'var(--tng-font-display)',
          color: 'var(--tng-purple-900)',
          letterSpacing: '-0.02em', lineHeight: 1.1,
        }}>
          Bem-vindo de volta.
        </div>
        <div style={{
          fontSize: 14, color: 'var(--tng-ink-3)', marginBottom: 28, lineHeight: 1.65,
        }}>
          Acesse com sua conta Google ou LinkedIn para continuar sua jornada.
        </div>

        {error && (
          <div style={{
            background: 'rgba(200, 68, 43, .08)',
            border: '1px solid rgba(200, 68, 43, .25)',
            borderRadius: 8, padding: '10px 14px',
            fontSize: 13, color: 'var(--tng-danger)', marginBottom: 18,
          }}>
            {error}
          </div>
        )}

        {/* Google */}
        <button
          onClick={() => signIn('google')}
          disabled={loading !== null}
          style={{
            width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 500,
            background: loading === 'google' ? 'var(--tng-bone)' : 'var(--tng-cream)',
            color: loading !== null ? 'var(--tng-ink-3)' : 'var(--tng-ink)',
            border: '1px solid var(--tng-rule)', borderRadius: 10,
            cursor: loading !== null ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            marginBottom: 10, transition: 'all 150ms',
          }}
        >
          {loading === 'google' ? (
            <span style={{ opacity: 0.5 }}>Redirecionando...</span>
          ) : (
            <>
              <GoogleIcon />
              Entrar com Google
            </>
          )}
        </button>

        {/* LinkedIn */}
        <button
          onClick={() => signIn('linkedin_oidc')}
          disabled={loading !== null}
          style={{
            width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 500,
            background: loading === 'linkedin' ? 'var(--tng-bone)' : 'var(--tng-cream)',
            color: loading !== null ? 'var(--tng-ink-3)' : 'var(--tng-ink)',
            border: '1px solid var(--tng-rule)', borderRadius: 10,
            cursor: loading !== null ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'all 150ms',
          }}
        >
          {loading === 'linkedin' ? (
            <span style={{ opacity: 0.5 }}>Redirecionando...</span>
          ) : (
            <>
              <LinkedInIcon />
              Entrar com LinkedIn
            </>
          )}
        </button>

        <div style={{
          textAlign: 'center', fontSize: 12, color: 'var(--tng-ink-3)', marginTop: 22, lineHeight: 1.6,
        }}>
          Ainda não tem acesso?{' '}
          <a
            href="https://tng.dev"
            style={{
              color: 'var(--tng-purple-700)', textDecoration: 'underline',
              textDecorationColor: 'var(--tng-lime)',
            }}
          >
            Saiba mais sobre o bootcamp
          </a>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M15.68 8.18c0-.57-.05-1.11-.14-1.64H8v3.1h4.3a3.67 3.67 0 0 1-1.59 2.41v2h2.57c1.5-1.38 2.4-3.42 2.4-5.87z" fill="#4285F4"/>
      <path d="M8 16c2.16 0 3.97-.72 5.29-1.94l-2.57-2a4.84 4.84 0 0 1-2.72.75c-2.09 0-3.86-1.41-4.49-3.31H.86v2.06A8 8 0 0 0 8 16z" fill="#34A853"/>
      <path d="M3.51 9.5A4.84 4.84 0 0 1 3.26 8c0-.52.09-1.02.25-1.5V4.44H.86A8 8 0 0 0 0 8c0 1.29.31 2.51.86 3.56L3.51 9.5z" fill="#FBBC05"/>
      <path d="M8 3.19c1.18 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 .86 4.44L3.51 6.5C4.14 4.6 5.91 3.19 8 3.19z" fill="#EA4335"/>
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect width="16" height="16" rx="2" fill="#0A66C2"/>
      <path d="M3.5 6.5h2v6h-2v-6zm1-3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM7 6.5h1.9v.82h.03C9.22 6.82 9.98 6.3 11 6.3c2.02 0 2.5 1.33 2.5 3.06v3.14H11.6V9.7c0-.72 0-1.65-1-1.65s-1.15.78-1.15 1.6v2.85H7.5V6.5H7z" fill="white"/>
    </svg>
  )
}
