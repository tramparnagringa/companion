'use client'

import { usePathname, useRouter } from 'next/navigation'
import { SidebarPanel } from '@/components/layout/sidebar-panel'

interface AdminSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

type NavItem = { id: string; label: string; href: string; icon: React.ReactNode }

const NAV_ITEMS: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    href: '/admin',
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
    id: 'programs',
    label: 'Programas',
    href: '/admin/programs',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}>
        <rect x="2" y="2" width="12" height="12" rx="1.5" />
        <line x1="5" y1="6" x2="11" y2="6" />
        <line x1="5" y1="9" x2="8" y2="9" />
      </svg>
    ),
  },
  {
    id: 'students',
    label: 'Alunos',
    href: '/admin/students',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}>
        <circle cx="6" cy="5" r="2.5" />
        <path d="M1 13c0-2.8 2.2-5 5-5" />
        <circle cx="12" cy="5" r="2.5" />
        <path d="M10 13c0-2.8 2.2-5 5-5" />
      </svg>
    ),
  },
  {
    id: 'tokens',
    label: 'Tokens',
    href: '/admin/tokens',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}>
        <circle cx="8" cy="8" r="6" />
        <path d="M8 5v6M6 7h3.5a1.5 1.5 0 010 3H6" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Configurações',
    href: '/admin/settings',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}>
        <circle cx="8" cy="8" r="2" />
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" />
      </svg>
    ),
  },
]

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()

  function navigate(href: string) {
    router.push(href)
    onClose?.()
  }

  return (
    <SidebarPanel isOpen={isOpen} className="admin-sidebar-nav">
      {/* Header */}
      <div style={{ padding: '16px 14px 12px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '.12em',
          textTransform: 'uppercase', color: 'var(--orange)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ width: 5, height: 5, background: 'var(--orange)', borderRadius: '50%', display: 'inline-block' }} />
          TNG Admin
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
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '10px 8px' }}>
          {NAV_ITEMS.map(item => {
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(item.href)

            return (
              <div key={item.id}>
                <button
                  onClick={() => navigate(item.href)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 8px', borderRadius: 'var(--rsm)',
                    cursor: 'pointer', fontSize: 13, width: '100%',
                    border: 'none', marginBottom: 2,
                    background: isActive ? 'var(--orange-dim)' : 'none',
                    color: isActive ? 'var(--orange)' : 'var(--text2)',
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

              </div>
            )
          })}
        </div>
      </div>
    </SidebarPanel>
  )
}
