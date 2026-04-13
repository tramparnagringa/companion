'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { SidebarPanel } from '@/components/layout/sidebar-panel'

interface MentorSidebarProps {
  user: User | null
  role?: string
  isOpen?: boolean
  onClose?: () => void
}

export function MentorSidebar({ user, role = 'mentor', isOpen, onClose }: MentorSidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const initials    = user?.email?.slice(0, 2).toUpperCase() ?? 'MT'
  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'Mentor'

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    {
      id: 'overview', label: 'Overview', href: '/mentor',
      icon: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}>
          <rect x="1" y="1" width="6" height="6" rx="1" />
          <rect x="9" y="1" width="6" height="6" rx="1" />
          <rect x="1" y="9" width="6" height="6" rx="1" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
      ),
    },
    {
      id: 'students', label: 'Alunos', href: '/mentor/students',
      icon: (
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}>
          <circle cx="6" cy="5" r="2.5" />
          <path d="M1 13c0-2.8 2.2-5 5-5" />
          <circle cx="12" cy="5" r="2.5" />
          <path d="M10 13c0-2.8 2.2-5 5-5" />
        </svg>
      ),
    },
  ]

  return (
    <SidebarPanel isOpen={isOpen} className="mentor-sidebar-nav">
      {/* Top */}
      <div style={{ padding: '16px 14px 12px', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '.12em',
          textTransform: 'uppercase', color: 'var(--purple)',
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14,
        }}>
          <span style={{ width: 5, height: 5, background: 'var(--purple)', borderRadius: '50%', display: 'inline-block' }} />
          TNG Mentor
          {onClose && (
            <button
              onClick={onClose}
              className="sidebar-close-btn"
              style={{
                marginLeft: 'auto', background: 'none', border: 'none',
                cursor: 'pointer', color: 'var(--text3)', padding: 4,
                display: 'none', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="2" y1="2" x2="12" y2="12" /><line x1="12" y1="2" x2="2" y2="12" />
              </svg>
            </button>
          )}
        </div>

        {/* User pill */}
        <button
          onClick={signOut}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px',
            borderRadius: 'var(--rsm)', background: 'var(--bg3)', cursor: 'pointer',
            border: 'none', width: '100%', textAlign: 'left',
          }}
          title="Clique para sair"
        >
          <div style={{
            width: 24, height: 24, borderRadius: '50%', background: 'var(--purple-dim)',
            border: '1px solid rgba(167,139,250,.3)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'var(--purple)', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{displayName}</div>
            <div style={{ fontSize: 10, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{role}</div>
          </div>
        </button>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '10px 8px' }}>
        {navItems.map(item => {
          const isActive = item.href === '/mentor'
            ? pathname === '/mentor'
            : pathname.startsWith(item.href)

          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 8px', borderRadius: 'var(--rsm)',
                cursor: 'pointer', fontSize: 13, width: '100%',
                border: 'none', marginBottom: 2,
                background: isActive ? 'var(--purple-dim)' : 'none',
                color: isActive ? 'var(--purple)' : 'var(--text2)',
                transition: 'all .12s', textAlign: 'left',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--text)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'none'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--text2)'
                }
              }}
            >
              {item.icon}
              {item.label}
            </button>
          )
        })}
      </div>

      {/* Back to app */}
      <div style={{ padding: '0 8px 14px' }}>
        <button
          onClick={() => router.push('/today')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 8px', borderRadius: 'var(--rsm)',
            cursor: 'pointer', fontSize: 12, width: '100%',
            border: 'none', background: 'none',
            color: 'var(--text4)', transition: 'all .12s', textAlign: 'left',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text2)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text4)'
          }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 13, height: 13 }}>
            <polyline points="10,4 6,8 10,12" />
          </svg>
          Voltar ao app
        </button>
      </div>
    </SidebarPanel>
  )
}
