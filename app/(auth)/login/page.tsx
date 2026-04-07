'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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
      position: 'fixed', inset: 0, background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 380, padding: 40, background: 'var(--bg2)',
        border: '0.5px solid var(--border2)', borderRadius: 'var(--rxl)',
      }}>
        {/* Logo */}
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '.12em',
          textTransform: 'uppercase', color: 'var(--accent)',
          marginBottom: 28, display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <span style={{ width: 5, height: 5, background: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }} />
          TNG Companion
        </div>

        <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 6 }}>
          Bem-vindo de volta.
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 28, lineHeight: 1.65 }}>
          Acesse com sua conta Google ou LinkedIn. O acesso é liberado manualmente após a confirmação da sua vaga no bootcamp.
        </div>

        {error && (
          <div style={{
            background: 'var(--red-dim)', border: '0.5px solid rgba(248,113,113,.2)',
            borderRadius: 'var(--rsm)', padding: '10px 12px',
            fontSize: 12, color: 'var(--red)', marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Google */}
        <button
          onClick={() => signIn('google')}
          disabled={loading !== null}
          style={{
            width: '100%', padding: '11px 14px', fontSize: 14, fontWeight: 500,
            background: loading === 'google' ? 'var(--bg4)' : 'var(--bg3)',
            color: loading !== null ? 'var(--text3)' : 'var(--text)',
            border: '0.5px solid var(--border2)', borderRadius: 'var(--rsm)',
            cursor: loading !== null ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 10, marginBottom: 10,
            transition: 'all .15s',
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
            width: '100%', padding: '11px 14px', fontSize: 14, fontWeight: 500,
            background: loading === 'linkedin' ? 'var(--bg4)' : 'var(--bg3)',
            color: loading !== null ? 'var(--text3)' : 'var(--text)',
            border: '0.5px solid var(--border2)', borderRadius: 'var(--rsm)',
            cursor: loading !== null ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 10,
            transition: 'all .15s',
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

        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text4)', marginTop: 20, lineHeight: 1.6 }}>
          Ainda não tem acesso?{' '}
          <a
            href="https://tng.dev"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}
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
