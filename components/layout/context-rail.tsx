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

  // Active area color token names for the current context
  const areaColor = isAdmin ? 'purple' : 'app'

  // Color sets for each area
  const COLOR_MAP: Record<string, { color: string; bg: string; border: string }> = {
    app:    { color: 'var(--tng-purple-700)', bg: 'var(--tng-purple-100)', border: 'var(--tng-purple-300)' },
    purple: { color: 'var(--tng-purple-500)', bg: 'var(--tng-purple-100)', border: 'var(--tng-purple-300)' },
    coral:  { color: 'var(--tng-coral)',      bg: '#FFE4D9',               border: 'rgba(255,107,53,.4)'   },
  }
  const colors   = COLOR_MAP[areaColor]
  const initials = user ? (user.user_metadata?.full_name ?? user.email ?? '?').slice(0, 2).toUpperCase() : '?'

  const btn = (active: boolean, onClick: () => void, title: string, colorKey: string, icon: React.ReactNode) => {
    const c = COLOR_MAP[colorKey] ?? COLOR_MAP.app
    return (
      <button
        onClick={onClick}
        title={title}
        style={{
          width: 36, height: 36, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', border: 'none', transition: 'all 120ms',
          background: active ? c.bg : 'none',
          color: active ? c.color : 'var(--tng-mute)',
        }}
        onMouseEnter={e => {
          if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--tng-bone)'
        }}
        onMouseLeave={e => {
          if (!active) (e.currentTarget as HTMLElement).style.background = 'none'
        }}
      >
        {icon}
      </button>
    )
  }

  return (
    <div className="context-rail" style={{
      width: 52, flexShrink: 0,
      background: 'var(--tng-paper)',
      borderRight: '1px solid var(--tng-rule)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 14, gap: 4,
    }}>
      {/* Active area indicator dot */}
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        background: colors.color,
        marginBottom: 10, marginTop: 4,
        transition: 'background .2s',
      }} />

      {/* App */}
      {btn(isApp, () => router.push('/today'), 'App', 'app',
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 16, height: 16 }}>
          <rect x="2" y="2" width="5" height="5" rx="1" />
          <rect x="9" y="2" width="5" height="5" rx="1" />
          <rect x="2" y="9" width="5" height="5" rx="1" />
          <rect x="9" y="9" width="5" height="5" rx="1" />
        </svg>
      )}

      {/* Admin/Mentor backstage */}
      {isMentorOrAdmin && btn(isAdmin, () => router.push(role === 'mentor' ? '/admin/students' : '/admin'), 'Admin', 'purple',
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 16, height: 16 }}>
          <circle cx="8" cy="8" r="2.5" />
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" />
        </svg>
      )}

      {/* Bottom: avatar + logout */}
      <div style={{ marginTop: 'auto', paddingBottom: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {/* Avatar */}
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 700, color: colors.color,
          transition: 'background .2s, border-color .2s, color .2s',
          fontFamily: 'var(--mono)',
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
            color: 'var(--tng-mute)', transition: 'all 120ms',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--tng-bone)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--tng-danger)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'none'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--tng-mute)'
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
