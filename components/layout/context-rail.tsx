'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface ContextRailProps {
  role: string
  user?: User | null
}

export function ContextRail({ role, user }: ContextRailProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const isMentorOrAdmin = ['mentor', 'admin'].includes(role)

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isApp   = !pathname.startsWith('/admin')
  const isAdmin = pathname.startsWith('/admin')

  // Active area color
  const backstageColor = 'purple';
  const areaColor = isAdmin ? backstageColor : 'accent'

  const btn = (active: boolean, onClick: () => void, title: string, color: string, icon: React.ReactNode) => (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 36, height: 36, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', border: 'none', transition: 'all .12s',
        background: active ? `var(--${color}-dim, var(--bg3))` : 'none',
        color: active ? `var(--${color})` : 'var(--text4)',
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = 'none'
      }}
    >
      {icon}
    </button>
  )

  // Color vars for the current area
  const COLOR_MAP: Record<string, { color: string; bg: string; border: string }> = {
    accent:  { color: 'var(--accent)',  bg: 'rgba(228,253,139,.2)', border: 'rgba(228,253,139,.35)' },
    purple:  { color: 'var(--purple)',  bg: 'rgba(167,139,250,.2)', border: 'rgba(167,139,250,.35)' },
    orange:  { color: 'var(--orange)',  bg: 'rgba(251,146,60,.2)',  border: 'rgba(251,146,60,.35)'  },
  }
  const colors  = COLOR_MAP[areaColor]
  const initials = user ? (user.user_metadata?.full_name ?? user.email ?? '?').slice(0, 2).toUpperCase() : '?'

  return (
    <div className="context-rail" style={{
      width: 52, flexShrink: 0,
      background: 'var(--bg)',
      borderRight: '0.5px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 12, gap: 4,
    }}>
      {/* Logo dot — reflects active area */}
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: colors.color,
        marginBottom: 12, marginTop: 8,
        transition: 'background .2s',
      }} />

      {/* App — always visible */}
      {btn(isApp, () => router.push('/today'), 'App', 'accent',
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 16, height: 16 }}>
          <rect x="2" y="2" width="5" height="5" rx="1" />
          <rect x="9" y="2" width="5" height="5" rx="1" />
          <rect x="2" y="9" width="5" height="5" rx="1" />
          <rect x="9" y="9" width="5" height="5" rx="1" />
        </svg>
      )}

      {/* Admin/Mentor backstage — for mentor + admin */}
      {isMentorOrAdmin && btn(isAdmin, () => router.push(role === 'mentor' ? '/admin/students' : '/admin'), 'Admin', backstageColor,
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 16, height: 16 }}>
          <circle cx="8" cy="8" r="2.5" />
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" />
        </svg>
      )}

      {/* Bottom: avatar + logout */}
      <div style={{ marginTop: 'auto', paddingBottom: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {/* Avatar — color reflects active area */}
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: colors.bg, border: `1px solid ${colors.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 600, color: colors.color,
          transition: 'background .2s, border-color .2s, color .2s',
        }}>
          {initials}
        </div>

        {/* Logout */}
        <button
          onClick={signOut}
          title="Sair"
          style={{
            width: 36, height: 36, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', border: 'none', background: 'none',
            color: 'var(--text4)', transition: 'all .12s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--red, #f87171)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'none'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--text4)'
          }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 15, height: 15 }}>
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" />
            <polyline points="10,5 13,8 10,11" />
            <line x1="13" y1="8" x2="5" y2="8" />
          </svg>
        </button>
      </div>
    </div>
  )
}
