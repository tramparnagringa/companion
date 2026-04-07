'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface SidebarProps {
  user: User | null
  tokenUsed?: number
  tokenTotal?: number
  plan?: string
  currentDay?: number
  completedCount?: number
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({
  user,
  tokenUsed = 0,
  tokenTotal = 2_000_000,
  plan = 'Bootcamp',
  currentDay = 1,
  completedCount = 0,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const usedPct = tokenTotal > 0 ? Math.min((tokenUsed / tokenTotal) * 100, 100) : 0
  const viewingDayMatch = pathname.match(/^\/days\/(\d+)$/)
  const viewingDay = viewingDayMatch ? parseInt(viewingDayMatch[1], 10) : null
  const fillClass = usedPct > 90 ? 'danger' : usedPct > 70 ? 'warn' : ''

  const initials    = user?.email?.slice(0, 2).toUpperCase() ?? 'TN'
  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'Usuário'

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  type NavItem = {
    id: string
    label: string
    href: string
    badge?: string
    icon: React.ReactNode
  }

  const NAV_SECTIONS: { section: string; items: NavItem[] }[] = [
    {
      section: 'Jornada',
      items: [
        {
          id: 'today', label: 'Hoje', href: '/today',
          badge: `Dia ${currentDay}`,
          icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}><rect x="2" y="2" width="12" height="12" rx="2" /><line x1="5" y1="6" x2="11" y2="6" /><line x1="5" y1="9" x2="8" y2="9" /></svg>,
        },
        {
          id: 'days', label: 'Programa', href: '/days',
          badge: `${completedCount}/30`,
          icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}><rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" /><rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" /></svg>,
        },
        {
          id: 'plans', label: 'Planos de Ação', href: '/plans',
          badge: undefined,
          icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}><rect x="2" y="2" width="12" height="12" rx="1.5" /><polyline points="5,8 7,10 11,6" /></svg>,
        },
      ],
    },
    {
      section: 'IA',
      items: [
        {
          id: 'chat', label: 'Mentor IA', href: '/chat',
          badge: undefined,
          icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}><path d="M2 3h12v8H9l-3 3V11H2z" /></svg>,
        },
      ],
    },
    {
      section: 'Carreira',
      items: [
        {
          id: 'cv', label: 'CV Editor', href: '/cv',
          badge: undefined,
          icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}><rect x="3" y="1" width="10" height="14" rx="1.5" /><line x1="6" y1="5" x2="10" y2="5" /><line x1="6" y1="8" x2="10" y2="8" /><line x1="6" y1="11" x2="8" y2="11" /></svg>,
        },
        {
          id: 'board', label: 'Job Board', href: '/board',
          badge: undefined,
          icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}><rect x="1" y="3" width="4" height="11" rx="1" /><rect x="6" y="3" width="4" height="8" rx="1" /><rect x="11" y="3" width="4" height="5" rx="1" /></svg>,
        },
        {
          id: 'profile', label: 'Dossier', href: '/profile',
          badge: undefined,
          icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}><circle cx="8" cy="5" r="3" /><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" /></svg>,
        },
      ],
    },
  ]

  return (
    <nav className={`sidebar-nav${isOpen ? ' sidebar-open' : ''}`} style={{
      width: 'var(--sidebar-w)', background: 'var(--bg2)',
      borderRight: '0.5px solid var(--border)', display: 'flex',
      flexDirection: 'column', flexShrink: 0, zIndex: 50,
    }}>
      {/* Top */}
      <div style={{ padding: '16px 14px 12px', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '.12em',
          textTransform: 'uppercase', color: 'var(--accent)',
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14,
        }}>
          <span style={{ width: 5, height: 5, background: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }} />
          TNG Companion
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
                <line x1="2" y1="2" x2="12" y2="12" />
                <line x1="12" y1="2" x2="2" y2="12" />
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
            width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-dim)',
            border: '1px solid rgba(228,253,139,.3)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'var(--accent)', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{displayName}</div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>{user?.email}</div>
          </div>
        </button>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {NAV_SECTIONS.map(({ section, items }) => (
          <div key={section} style={{ padding: '10px 8px 4px' }}>
            <div style={{
              fontSize: 10, fontWeight: 500, letterSpacing: '.08em',
              textTransform: 'uppercase', color: 'var(--text4)',
              padding: '0 6px', marginBottom: 3,
            }}>
              {section}
            </div>
            {items.map(item => {
              const isActive = pathname === item.href
              return (
                <div key={item.id}>
                  <button
                    onClick={() => router.push(item.href)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 8px', borderRadius: 'var(--rsm)',
                      cursor: 'pointer', fontSize: 13, width: '100%',
                      border: 'none', background: isActive ? 'var(--accent-dim)' : 'none',
                      color: isActive ? 'var(--accent)' : 'var(--text2)',
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
                    {item.badge && (
                      <span style={{
                        marginLeft: 'auto', fontSize: 10, fontWeight: 500,
                        background: isActive ? 'rgba(228,253,139,.18)' : 'var(--bg4)',
                        color: isActive ? 'var(--accent)' : 'var(--text3)',
                        padding: '1px 6px', borderRadius: 10,
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {item.id === 'days' && viewingDay !== null && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 8px 5px 28px', borderRadius: 'var(--rsm)',
                      fontSize: 12, color: 'var(--accent)',
                      background: 'var(--accent-dim)',
                    }}>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 11, height: 11, opacity: 0.5 }}>
                        <polyline points="4,8 8,12 12,8" />
                        <line x1="4" y1="4" x2="4" y2="12" />
                      </svg>
                      Dia {viewingDay}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Token widget */}
      <div style={{
        margin: 'auto 14px 14px', background: 'var(--bg3)',
        border: '0.5px solid var(--border)', borderRadius: 'var(--r)',
        padding: '12px 13px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>Tokens</span>
          <span style={{
            fontSize: 10, fontWeight: 500, color: 'var(--accent)',
            background: 'var(--accent-dim)', padding: '2px 7px', borderRadius: 8, cursor: 'pointer',
          }}>
            {plan}
          </span>
        </div>
        <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{
            height: '100%', borderRadius: 2, transition: 'width .4s',
            width: `${100 - usedPct}%`,
            background: fillClass === 'danger' ? 'var(--red)' : fillClass === 'warn' ? 'var(--orange)' : 'var(--accent)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
          <span>{(tokenTotal - tokenUsed).toLocaleString()} restantes</span>
          <span>{tokenTotal.toLocaleString()}</span>
        </div>
      </div>
    </nav>
  )
}
