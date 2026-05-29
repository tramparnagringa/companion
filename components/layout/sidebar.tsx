'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { SidebarPanel } from './sidebar-panel'

interface Enrollment {
  id: string
  slug: string
  name: string
  totalDays: number
}

interface SidebarProps {
  user: User | null
  role?: string
  enrollments?: Enrollment[]
  tokenUsed?: number
  tokenTotal?: number
  plan?: string
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({
  user,
  role: _role = 'student',
  enrollments = [],
  tokenUsed = 0,
  tokenTotal = 2_000_000,
  plan = 'Bootcamp',
  isOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()

  const STORAGE_KEY = 'tng_active_slug'

  const firstSegment = pathname.split('/')[1] ?? ''
  const slugFromUrl  = enrollments.find(e => e.slug === firstSegment)?.slug ?? null

  const [storedSlug, setStoredSlug] = useState<string | null>(null)

  // On mount: read localStorage. If URL has a slug, it wins and we persist it.
  useEffect(() => {
    if (slugFromUrl) {
      localStorage.setItem(STORAGE_KEY, slugFromUrl)
      setStoredSlug(slugFromUrl)
    } else {
      setStoredSlug(localStorage.getItem(STORAGE_KEY))
    }
  }, [slugFromUrl])

  const resolvedSlug     = slugFromUrl ?? storedSlug ?? enrollments[0]?.slug ?? null
  const activeEnrollment = enrollments.find(e => e.slug === resolvedSlug) ?? enrollments[0] ?? null
  const activeSlug       = activeEnrollment?.slug ?? null

  const remainingTokens = tokenTotal - tokenUsed
  const usedPct = tokenTotal > 0 ? Math.min((tokenUsed / tokenTotal) * 100, 100) : 0
  const barColor = usedPct > 90
    ? 'var(--tng-danger)'
    : usedPct > 70
    ? 'var(--tng-warn)'
    : 'var(--tng-purple-700)'

  const initials   = user?.email?.slice(0, 2).toUpperCase() ?? 'TN'
  const displayName = user?.user_metadata?.full_name?.split(' ')[0] ?? user?.email ?? 'Usuário'

  // Sub-page within a program (e.g. viewing day 5)
  const viewingDayMatch = pathname.match(/^\/[^/]+\/days\/(\d+)$/)
  const viewingDay      = viewingDayMatch ? parseInt(viewingDayMatch[1], 10) : null

  type NavItem = { id: string; label: string; href: string; badge?: string; icon: React.ReactNode }

  const slug = activeEnrollment?.slug ?? 'tng-bootcamp'

  const NAV_SECTIONS: { section: string; items: NavItem[] }[] = [
    {
      section: 'Jornada',
      items: [
        {
          id: 'today', label: 'Hoje', href: `/${slug}/today`,
          icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><circle cx="8" cy="8" r="6.5"/><path d="M8 5v3l2 2"/></svg>,
        },
        {
          id: 'days', label: 'Programa', href: `/${slug}/days`,
          icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>,
        },
      ],
    },
    {
      section: 'IA',
      items: [
        {
          id: 'chat', label: 'Mentor IA', href: '/chat',
          icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6l-3 3v-3H4a2 2 0 01-2-2z"/><circle cx="6" cy="7" r="0.6" fill="currentColor"/><circle cx="10" cy="7" r="0.6" fill="currentColor"/></svg>,
        },
        {
          id: 'profile', label: 'Profile', href: '/profile',
          icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><circle cx="8" cy="5.5" r="2.5"/><path d="M3 14a5 5 0 0110 0"/></svg>,
        },
        {
          id: 'plans', label: 'Planos de Ação', href: '/plans',
          icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M3 2h7l3 3v9H3z"/><path d="M5 8h6M5 11h6"/></svg>,
        },
      ],
    },
    {
      section: 'Carreira',
      items: [
        {
          id: 'cv', label: 'CV Editor', href: '/cv',
          icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><rect x="3" y="2" width="10" height="12" rx="1"/><path d="M5 5h6M5 8h6M5 11h4"/></svg>,
        },
        {
          id: 'board', label: 'Job Board', href: '/board',
          icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><rect x="2" y="5" width="12" height="9" rx="1"/><path d="M6 5V3a1 1 0 011-1h2a1 1 0 011 1v2"/></svg>,
        },

      ],
    },
  ]

  return (
    <SidebarPanel isOpen={isOpen}>
      {/* Brand header */}
      <div style={{
        padding: '20px 18px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        {/* Logo mark */}
        <img
          src="/logo-mark.svg"
          alt="TNG"
          width={30}
          height={30}
          style={{ flexShrink: 0 }}
        />
        {/* Brand text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.03em',
            color: 'var(--tng-purple-700)',
            lineHeight: 1.1,
            textTransform: 'uppercase',
          }}>
            Trampar na Gringa
          </div>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: 'var(--tng-coral)',
            marginTop: 3,
          }}>
            Companion
          </div>
        </div>

        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="sidebar-close-btn"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--tng-ink-3)', padding: 4,
              display: 'none', alignItems: 'center', justifyContent: 'center',
              borderRadius: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="2" y1="2" x2="12" y2="12" />
              <line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </button>
        )}
      </div>
      {/* Divider — stops 18px before the right edge, matching the prototype */}
      <div style={{ height: 1, background: 'var(--tng-rule)', marginLeft: 18, marginRight: 18 }} />

      {/* Program switcher */}
      {enrollments.length >= 1 && (
        <div style={{ padding: '26px 18px 0' }}>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: 'var(--tng-ink-3)',
            marginBottom: 6,
            paddingLeft: 2,
          }}>
            Programa
          </div>
          <div style={{ position: 'relative' }}>
            {enrollments.length === 1 ? (
              <div style={{
                width: '100%', padding: '9px 12px',
                borderRadius: 10, fontSize: 13, fontWeight: 500,
                background: 'var(--tng-cream)',
                border: '1px solid var(--tng-rule)',
                color: 'var(--tng-ink)',
              }}>
                {enrollments[0].name}
              </div>
            ) : (
              <>
                <select
                  value={activeSlug ?? ''}
                  onChange={e => router.push(`/${e.target.value}/today`)}
                  style={{
                    width: '100%', padding: '9px 28px 9px 12px',
                    borderRadius: 10, fontSize: 13, fontWeight: 500,
                    background: 'var(--tng-cream)',
                    border: '1px solid var(--tng-rule)',
                    color: 'var(--tng-ink)',
                    cursor: 'pointer', outline: 'none',
                    appearance: 'none', WebkitAppearance: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 120ms',
                  }}
                >
                  {enrollments.map(e => (
                    <option key={e.id} value={e.slug}>{e.name}</option>
                  ))}
                </select>
                <svg
                  viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"
                  style={{
                    width: 12, height: 12, position: 'absolute', right: 10,
                    top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--tng-ink-3)', pointerEvents: 'none',
                  }}
                >
                  <polyline points="4,6 8,10 12,6" />
                </svg>
              </>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 6 }}>
        {NAV_SECTIONS.map(({ section, items }) => (
          <div key={section} style={{ padding: '14px 10px 4px' }}>
            {/* Group label */}
            <div style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: 'var(--tng-ink-3)',
              padding: '0 10px 8px',
            }}>
              {section}
            </div>

            {/* Nav items */}
            {items.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <div key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => onClose?.()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 10px', borderRadius: 8, width: '100%',
                      fontSize: 14, fontWeight: 500,
                      textDecoration: 'none', transition: 'all 120ms',
                      background: isActive ? 'var(--tng-purple-700)' : 'none',
                      color: isActive ? 'var(--tng-cream)' : 'var(--tng-ink)',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.background = 'var(--tng-bone)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.background = 'none'
                      }
                    }}
                  >
                    {/* Icon */}
                    <span style={{
                      width: 18, height: 18,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      color: isActive ? 'var(--tng-lime)' : 'var(--tng-ink-3)',
                    }}>
                      {item.icon}
                    </span>
                    {item.label}
                    {item.badge && (
                      <span style={{
                        marginLeft: 'auto', fontSize: 10, fontWeight: 600,
                        background: isActive ? 'rgba(201,242,61,.18)' : 'var(--tng-bone)',
                        color: isActive ? 'var(--tng-lime)' : 'var(--tng-ink-3)',
                        padding: '1px 6px', borderRadius: 10,
                        fontFamily: 'var(--mono)', letterSpacing: '0.06em',
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>

                  {/* Sub-item: currently viewing a specific day */}
                  {item.id === 'days' && viewingDay !== null && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 10px 5px 38px', borderRadius: 8,
                      fontSize: 12, color: 'var(--tng-purple-700)',
                      background: 'var(--tng-purple-100)',
                      margin: '2px 0',
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

      {/* Token / Credits widget */}
      <div style={{
        margin: '0 14px 14px',
        background: 'var(--tng-cream)',
        border: '1px solid var(--tng-rule)',
        borderRadius: 12,
        padding: '13px 15px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <span style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: 'var(--tng-ink-3)',
          }}>
            Créditos de IA
          </span>
          <span style={{
            fontFamily: 'var(--mono)',
            fontSize: 11, fontWeight: 600,
            color: 'var(--tng-purple-700)',
          }}>
            {Math.round(100 - usedPct)}%
          </span>
        </div>
        <div style={{ height: 4, background: 'var(--tng-rule)', borderRadius: 2, overflow: 'hidden', marginBottom: 7 }}>
          <div style={{
            height: '100%', borderRadius: 2,
            width: `${100 - usedPct}%`,
            background: barColor,
            transition: 'width .4s, background .2s',
          }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--tng-ink-3)',
        }}>
          <span>
            <strong style={{ color: 'var(--tng-ink)', fontWeight: 600 }}>
              {remainingTokens.toLocaleString('pt-BR')}
            </strong>{' '}restantes
          </span>
          <span>de {tokenTotal.toLocaleString('pt-BR')}</span>
        </div>
      </div>
    </SidebarPanel>
  )
}
