'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
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
  hasPlans?: boolean
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
  hasPlans = false,
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

  const usedPct    = tokenTotal > 0 ? Math.min((tokenUsed / tokenTotal) * 100, 100) : 0
  const fillClass  = usedPct > 90 ? 'danger' : usedPct > 70 ? 'warn' : ''
  const initials   = user?.email?.slice(0, 2).toUpperCase() ?? 'TN'
  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'Usuário'

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
          badge: undefined,
          icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}><rect x="2" y="2" width="12" height="12" rx="2" /><line x1="5" y1="6" x2="11" y2="6" /><line x1="5" y1="9" x2="8" y2="9" /></svg>,
        },
        {
          id: 'days', label: 'Programa', href: `/${slug}/days`,
          badge: undefined,
          icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}><rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" /><rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" /></svg>,
        },
        ...(hasPlans ? [{
          id: 'plans', label: 'Planos de Ação', href: '/plans',
          badge: undefined,
          icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}><rect x="2" y="2" width="12" height="12" rx="1.5" /><polyline points="5,8 7,10 11,6" /></svg>,
        }] : []),
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
    <SidebarPanel isOpen={isOpen}>
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

        {/* Program switcher — visible when enrolled in at least one program */}
        {enrollments.length >= 1 && (
          <div style={{ marginTop: 10 }}>
            <div style={{
              fontSize: 10, fontWeight: 500, letterSpacing: '.08em',
              textTransform: 'uppercase', color: 'var(--text4)', marginBottom: 4,
            }}>
              Programa
            </div>
            <div style={{ position: 'relative' }}>
              {enrollments.length === 1 ? (
                <div style={{
                  width: '100%', padding: '7px 10px',
                  borderRadius: 'var(--rsm)', fontSize: 12, fontWeight: 500,
                  background: 'var(--accent-dim)',
                  border: '0.5px solid rgba(228,253,139,.25)',
                  color: 'var(--accent)',
                }}>
                  {enrollments[0].name}
                </div>
              ) : (
                <>
                  <select
                    value={activeSlug ?? ''}
                    onChange={e => router.push(`/${e.target.value}/today`)}
                    style={{
                      width: '100%', padding: '7px 28px 7px 10px',
                      borderRadius: 'var(--rsm)', fontSize: 12, fontWeight: 500,
                      background: 'var(--accent-dim)',
                      border: '0.5px solid rgba(228,253,139,.25)',
                      color: 'var(--accent)', cursor: 'pointer', outline: 'none',
                      appearance: 'none', WebkitAppearance: 'none',
                      fontFamily: 'inherit',
                    }}
                  >
                    {enrollments.map(e => (
                      <option key={e.id} value={e.slug} style={{ background: 'var(--bg3)', color: 'var(--text)' }}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                  {/* Chevron */}
                  <svg
                    viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                    style={{
                      width: 11, height: 11, position: 'absolute', right: 8,
                      top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--accent)', pointerEvents: 'none',
                    }}
                  >
                    <polyline points="4,6 8,10 12,6" />
                  </svg>
                </>
              )}
            </div>
          </div>
        )}
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
              // Active if the pathname starts with the item's href (handles sub-routes)
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
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

                  {/* Sub-item: currently viewing a specific day */}
                  {item.id === 'days' && viewingDay !== null && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 8px 5px 28px', borderRadius: 'var(--rsm)',
                      fontSize: 12, color: 'var(--accent)', background: 'var(--accent-dim)',
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
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>Créditos</span>
        </div>
        <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{
            height: '100%', borderRadius: 2, transition: 'width .4s',
            width: `${100 - usedPct}%`,
            background: fillClass === 'danger' ? 'var(--red)' : fillClass === 'warn' ? 'var(--orange)' : 'var(--accent)',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
          <span>{(tokenTotal - tokenUsed).toLocaleString('pt-BR')} restantes</span>
          <span>{tokenTotal.toLocaleString('pt-BR')}</span>
        </div>
      </div>

    </SidebarPanel>
  )
}
