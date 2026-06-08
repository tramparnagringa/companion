'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { SidebarPanel } from './sidebar-panel'
import { ProgramsPanel } from './programs-panel'
import { LogoMark } from '@/components/ui/logo-mark'
import type { EnrollmentWithProgress, RecommendedProgram } from './app-shell'

interface SidebarProps {
  user: User | null
  role?: string
  enrollments?: EnrollmentWithProgress[]
  tokenUsed?: number
  tokenTotal?: number
  plan?: string
  recommendedProgram?: RecommendedProgram | null
  isOpen?: boolean
  onClose?: () => void
}

/* ── SVG icons ─────────────────────────────────────────────────── */
function IcoHome() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M2 7L8 2l6 5v7a1 1 0 01-1 1H3a1 1 0 01-1-1z"/><path d="M6 15v-5h4v5"/></svg>
}
function IcoSun() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4"/></svg>
}
function IcoMap() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><polygon points="1,3 6,1 10,3 15,1 15,13 10,15 6,13 1,15"/><line x1="6" y1="1" x2="6" y2="13"/><line x1="10" y1="3" x2="10" y2="15"/></svg>
}
function IcoChat() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6l-3 3v-3H4a2 2 0 01-2-2z"/><circle cx="6" cy="7" r="0.6" fill="currentColor"/><circle cx="10" cy="7" r="0.6" fill="currentColor"/></svg>
}

function IcoCv() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><rect x="3" y="2" width="10" height="12" rx="1"/><path d="M5 5h6M5 8h6M5 11h4"/></svg>
}
function IcoBoard() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><rect x="2" y="5" width="12" height="9" rx="1"/><path d="M6 5V3a1 1 0 011-1h2a1 1 0 011 1v2"/></svg>
}
function IcoPlans() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M3 2h7l3 3v9H3z"/><path d="M5 8h6M5 11h6"/></svg>
}
function IcoLayers() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><polygon points="8,1 15,5 8,9 1,5"/><path d="M1 9l7 4 7-4"/><path d="M1 12l7 4 7-4"/></svg>
}
function IcoPlay() {
  return <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14"><path d="M5 3l9 5-9 5z"/></svg>
}
function IcoCredits() {
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><circle cx="8" cy="8" r="6.5"/><path d="M8 5v3.5l2 1.5"/></svg>
}

/* ── Nav item ───────────────────────────────────────────────────── */
function NavItem({
  href, label, icon, tail, isActive, onClick,
}: {
  href: string; label: string; icon: React.ReactNode
  tail?: string; isActive: boolean; onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`sb-item${isActive ? ' active' : ''}`}
      style={{
        background: isActive ? 'var(--tng-purple-700)' : hovered ? 'var(--tng-bone)' : 'transparent',
        color: isActive ? 'var(--tng-cream)' : 'var(--tng-ink)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="ic" style={{ color: isActive ? 'var(--tng-lime)' : 'var(--tng-ink-3)' }}>
        {icon}
      </span>
      <span className="lbl">{label}</span>
      {tail && (
        <span className="tail" style={{ color: isActive ? 'var(--tng-lime)' : 'var(--tng-ink-3)' }}>
          {tail}
        </span>
      )}
    </Link>
  )
}

/* ── Sidebar block nav item (white bg within pblock) ───────────── */
function BlockNavItem({
  href, label, icon, tail, isActive, onClick,
}: {
  href: string; label: string; icon: React.ReactNode
  tail?: string; isActive: boolean; onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`sb-item${isActive ? ' active' : ''}`}
      style={{
        background: isActive ? 'var(--tng-purple-700)' : hovered ? '#fff' : 'var(--tng-paper)',
        color: isActive ? 'var(--tng-cream)' : 'var(--tng-ink)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="ic" style={{ color: isActive ? 'var(--tng-lime)' : 'var(--tng-ink-3)' }}>
        {icon}
      </span>
      <span className="lbl">{label}</span>
      {tail && (
        <span className="tail" style={{ color: isActive ? 'var(--tng-lime)' : 'var(--tng-ink-3)' }}>
          {tail}
        </span>
      )}
    </Link>
  )
}

/* ── Main component ─────────────────────────────────────────────── */
export function Sidebar({
  user: _user,
  role: _role = 'student',
  enrollments = [],
  tokenUsed = 0,
  tokenTotal = 2_000_000,
  recommendedProgram,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname()
  const [popoverOpen, setPopoverOpen] = useState(false)

  const STORAGE_KEY = 'tng_active_slug'
  const firstSegment = pathname.split('/')[1] ?? ''
  const slugFromUrl  = enrollments.find(e => e.slug === firstSegment)?.slug ?? null
  const [storedSlug, setStoredSlug] = useState<string | null>(null)

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

  // Progress for active enrollment
  const completedDays = activeEnrollment?.completedDays ?? 0
  const totalDays     = activeEnrollment?.totalDays ?? 30
  const currentDay    = activeEnrollment?.currentDay ?? 1
  const progressPct   = totalDays > 0 ? Math.min((completedDays / totalDays) * 100, 100) : 0

  const slug = activeSlug ?? ''

  // Only show sub-nav (Agora / O programa) when already inside this program's routes
  const isOnProgramPages = slug ? pathname.startsWith(`/${slug}/`) : false

  // Detect if user is on a specific day page or its chat: /{slug}/days/[day] or /{slug}/days/[day]/chat
  const dayPageMatch = slug ? pathname.match(new RegExp(`^\\/${slug}\\/days\\/(\\d+)(?:\\/chat)?$`)) : null
  const selectedDay = dayPageMatch ? parseInt(dayPageMatch[1]) : null

  // Active state helpers
  const isActiveHref = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      <style>{`
        .sb *, .sb *::before, .sb *::after { box-sizing: border-box; }
        .sb {
          width: 252px; background: var(--tng-paper);
          border-right: 1px solid var(--tng-rule);
          height: 100%; display: flex; flex-direction: column;
          gap: 20px; padding: 20px 14px 14px;
          font-family: var(--tng-font-body); color: var(--tng-ink);
        }
        .sb-brand { display: flex; align-items: center; gap: 10px; padding: 2px 6px 16px; border-bottom: 1px solid var(--tng-rule); }
        .sb-brand img { width: 30px; height: 30px; }
        .sb-brand .bs { display: flex; flex-direction: column; line-height: 1; }
        .sb-brand .wm { font-family: var(--tng-font-display); font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--tng-purple-700); }
        .sb-brand .pr { font-family: var(--tng-font-mono); font-size: 9px; text-transform: uppercase; letter-spacing: 0.2em; color: var(--tng-coral); margin-top: 4px; }
        .sb-group { display: flex; flex-direction: column; gap: 2px; }
        .sb-gl { font-family: var(--tng-font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.16em; color: var(--tng-ink-3); padding: 0 12px 7px; }
        .sb-item { display: flex; align-items: center; gap: 11px; padding: 9px 12px; border-radius: 8px; color: var(--tng-ink); text-decoration: none; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 120ms; }
        .sb-item .ic { width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .sb-item .lbl { flex: 1; min-width: 0; }
        .sb-item .tail { font-family: var(--tng-font-mono); font-size: 10px; font-weight: 700; flex-shrink: 0; }

        /* ── program block ───────────────────────────────── */
        .sb-pblock { border: 1px solid var(--tng-purple-300); background: var(--tng-purple-100); border-radius: 12px; padding: 7px; display: flex; flex-direction: column; gap: 2px; }
        .sb-pblock-h { display: flex; align-items: flex-start; gap: 9px; padding: 7px 9px 8px; }
        .sb-pblock-h .ic { width: 16px; height: 16px; color: var(--tng-purple-700); flex-shrink: 0; display: inline-flex; margin-top: 18px; }
        .sb-pblock-h .pl { flex: 1; min-width: 0; }
        .sb-pblock-h .pk { display: block; font-family: var(--tng-font-mono); font-size: 8.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--tng-purple-700); }
        .sb-pblock-h .pn { display: block; font-size: 13.5px; font-weight: 700; color: var(--tng-purple-900); line-height: 1.15; margin-top: 1px; }

        /* progress + CTA */
        .pblk-prog { padding: 2px 9px 9px; }
        .pblk-meta { display: flex; align-items: center; justify-content: space-between; font-family: var(--tng-font-mono); font-size: 10px; color: var(--tng-ink-3); margin-bottom: 7px; }
        .pblk-bar { height: 5px; border-radius: 3px; background: rgba(67,0,73,0.12); overflow: hidden; margin-bottom: 9px; }
        .pblk-bar i { display: block; height: 100%; border-radius: 3px; background: var(--tng-purple-700); }
        .pblk-resume { display: flex; align-items: center; justify-content: center; gap: 7px; width: 100%; padding: 9px; border-radius: 9px; border: 1.5px solid var(--tng-ink); background: var(--tng-lime); color: var(--tng-purple-900); font-family: var(--tng-font-body); font-weight: 700; font-size: 12.5px; cursor: pointer; text-decoration: none; transition: transform 120ms, box-shadow 120ms; }
        .pblk-resume:hover { transform: translate(-1px,-1px); box-shadow: 3px 3px 0 var(--tng-ink); }

        /* switcher button */
        .sbc-switchbtn { width: 24px; height: 24px; border-radius: 7px; border: 1px solid var(--tng-rule); background: var(--tng-paper); color: var(--tng-purple-700); display: grid; place-items: center; cursor: pointer; flex-shrink: 0; transition: border-color 120ms, background 120ms; margin-top: 18px; }
        .sbc-switchbtn:hover { border-color: var(--tng-purple-700); background: var(--tng-purple-100); }
        .sbc-switchbtn svg { width: 14px; height: 14px; }

        /* credits widget */
        .sb-foot { margin-top: auto; display: flex; flex-direction: column; gap: 12px; }
        .sb-credits { background: var(--tng-cream); border: 1px solid var(--tng-rule); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }
        .sb-credits-h { display: flex; align-items: center; justify-content: space-between; }
        .sb-credits-l { font-family: var(--tng-font-mono); font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--tng-ink-3); display: inline-flex; align-items: center; gap: 6px; }
        .sb-credits-pct { font-family: var(--tng-font-mono); font-size: 11px; font-weight: 700; color: var(--tng-purple-700); }
        .sb-credits-bar { height: 5px; background: var(--tng-rule); border-radius: 3px; overflow: hidden; }
        .sb-credits-bar i { display: block; height: 100%; border-radius: 3px; }
        .sb-credits-meta { font-size: 10.5px; color: var(--tng-ink-3); display: flex; justify-content: space-between; font-family: var(--tng-font-mono); }
        .sb-credits-meta strong { color: var(--tng-ink); font-weight: 600; }

        /* mobile close */
        .sidebar-close-btn { display: none; }
        @media (max-width: 768px) { .sidebar-close-btn { display: flex !important; } }
      `}</style>

      <SidebarPanel isOpen={isOpen}>
      <div style={{ padding: '20px 14px 14px', display: 'flex', flexDirection: 'column', flex: 1, gap: 20, overflow: 'hidden', fontFamily: 'var(--tng-font-body)', color: 'var(--tng-ink)' }}>
        {/* Brand */}
        <div className="sb-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <LogoMark size={30} />
          <div className="bs">
            <span className="wm">Trampar na Gringa</span>
            <span className="pr">Companion</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="sidebar-close-btn"
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tng-ink-3)', padding: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="2" y1="2" x2="12" y2="12" /><line x1="12" y1="2" x2="2" y2="12" />
              </svg>
            </button>
          )}
        </div>

        {/* Scrollable nav area */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── JORNADA ──────────────────────────────── */}
          <div className="sb-group">
            <div className="sb-gl">Jornada</div>

            {/* Início */}
            <NavItem
              href="/today"
              label="Início"
              icon={<IcoHome />}
              isActive={pathname === '/today'}
              onClick={onClose}
            />

            {/* Program block — only when enrolled */}
            {activeEnrollment && slug && (
              <div className="sb-pblock">
                {/* Header: icon + name + switcher */}
                <div className="sb-pblock-h">
                  <span className="ic"><IcoLayers /></span>
                  <div className="pl">
                    <span className="pk">Programa</span>
                    <span className="pn" title={activeEnrollment.name}>{activeEnrollment.name}</span>
                  </div>
                  <button
                    className="sbc-switchbtn"
                    onClick={() => setPopoverOpen(v => !v)}
                    title="Meus programas"
                    aria-label="Trocar programa"
                  >
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                      <rect x="1" y="1" width="6" height="6" rx="1.2" />
                      <rect x="9" y="1" width="6" height="6" rx="1.2" />
                      <rect x="1" y="9" width="6" height="6" rx="1.2" />
                      <rect x="9" y="9" width="6" height="6" rx="1.2" />
                    </svg>
                  </button>
                </div>

                {/* Progress + CTA */}
                <div className="pblk-prog">
                  <div className="pblk-meta">
                    <span>Dia {currentDay} de {totalDays}</span>
                    <span>{Math.round(progressPct)}%</span>
                  </div>
                  <div className="pblk-bar">
                    <i style={{ width: `${progressPct}%` }} />
                  </div>
                  {!isOnProgramPages && (
                    <Link
                      href={`/${slug}/today`}
                      className="pblk-resume"
                      onClick={onClose}
                    >
                      <IcoPlay />
                      Continuar
                    </Link>
                  )}
                </div>

                {/* Sub-nav items — only when navigating within this program */}
                {isOnProgramPages && (
                  <>
                    <BlockNavItem
                      href={`/${slug}/today`}
                      label="Agora"
                      icon={<IcoSun />}
                      tail={completedDays >= totalDays ? '✓ Concluído' : `Dia ${currentDay}/${totalDays}`}
                      isActive={isActiveHref(`/${slug}/today`)}
                      onClick={onClose}
                    />
                    <BlockNavItem
                      href={`/${slug}/days`}
                      label="O programa"
                      icon={<IcoMap />}
                      isActive={pathname === `/${slug}/days`}
                      onClick={onClose}
                    />
                    {selectedDay && (
                      <div style={{ paddingLeft: 14, position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 20, top: 0, bottom: '50%', width: 1, background: 'var(--tng-purple-300)' }} />
                        <div style={{ position: 'absolute', left: 20, top: '50%', width: 8, height: 1, background: 'var(--tng-purple-300)' }} />
                        <BlockNavItem
                          href={`/${slug}/days/${selectedDay}`}
                          label={`Dia ${selectedDay}/${totalDays}`}
                          icon={<IcoSun />}
                          isActive={true}
                          onClick={onClose}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── IA ───────────────────────────────────── */}
          <div className="sb-group">
            <div className="sb-gl">IA</div>
            <NavItem href="/chat" label="Mentor IA" icon={<IcoChat />} isActive={isActiveHref('/chat')} onClick={onClose} />
          </div>

          {/* ── CARREIRA ─────────────────────────────── */}
          <div className="sb-group">
            <div className="sb-gl">Carreira</div>
            <NavItem href="/cv"     label="CV+ Editor"    icon={<IcoCv />}    isActive={isActiveHref('/cv')}    onClick={onClose} />
            <NavItem href="/board"  label="Job Board"     icon={<IcoBoard />} isActive={isActiveHref('/board')} onClick={onClose} />
            <NavItem href="/plans"  label="Planos de ação" icon={<IcoPlans />} isActive={isActiveHref('/plans')} onClick={onClose} />
          </div>
        </div>

        {/* ── Credits widget ───────────────────────── */}
        <div className="sb-foot">
          <div className="sb-credits">
            <div className="sb-credits-h">
              <span className="sb-credits-l">
                <IcoCredits />
                Créditos de IA
              </span>
              <span className="sb-credits-pct" style={{ color: barColor }}>
                {Math.round(100 - usedPct)}%
              </span>
            </div>
            <div className="sb-credits-bar">
              <i style={{ width: `${100 - usedPct}%`, background: barColor, transition: 'width .4s' }} />
            </div>
            <div className="sb-credits-meta">
              <span><strong>{remainingTokens.toLocaleString('pt-BR')}</strong> restantes</span>
              <span>de {tokenTotal.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>
      </SidebarPanel>

      {/* Programs panel — rendered outside SidebarPanel so it can overlay main content */}
      {popoverOpen && (
        <ProgramsPanel
          enrollments={enrollments}
          activeSlug={activeSlug}
          recommendedProgram={recommendedProgram ?? null}
          onClose={() => setPopoverOpen(false)}
        />
      )}
    </>
  )
}
