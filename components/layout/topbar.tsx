'use client'

import { useSidebar } from './sidebar-context'

interface TopbarProps {
  title: React.ReactNode
  subtitle?: string
  streak?: number
  actions?: React.ReactNode
}

export function Topbar({ title, subtitle, streak, actions }: TopbarProps) {
  const { toggle } = useSidebar()

  return (
    <div className="topbar" style={{
      height: 'var(--topbar-h)',
      padding: '0 36px',
      borderBottom: '1px solid var(--tng-rule)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0,
      background: 'rgba(245, 239, 226, 0.8)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Mobile hamburger */}
        <button
          onClick={toggle}
          className="sidebar-mobile-trigger"
          style={{
            width: 30, height: 30, borderRadius: 'var(--rsm)', background: 'none',
            border: 'none', cursor: 'pointer', color: 'var(--tng-ink-3)',
            alignItems: 'center', justifyContent: 'center', display: 'none',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="2" y1="4" x2="14" y2="4" />
            <line x1="2" y1="8" x2="14" y2="8" />
            <line x1="2" y1="12" x2="14" y2="12" />
          </svg>
        </button>

        <div>
          {typeof title === 'string' ? (
            <div style={{
              fontSize: 22, fontWeight: 700,
              fontFamily: 'var(--tng-font-display)',
              color: 'var(--tng-purple-900)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}>
              {title}
            </div>
          ) : (
            title
          )}
          {subtitle && (
            <div style={{ fontSize: 12, color: 'var(--tng-ink-3)', marginTop: 3, fontFamily: 'var(--tng-font-mono)', letterSpacing: '0.04em' }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {streak !== undefined && streak > 0 && (
          <div className="topbar-streak" style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '6px 14px', borderRadius: 999,
            background: 'rgba(255, 107, 53, 0.12)',
            border: '1px solid rgba(255, 107, 53, 0.40)',
            fontSize: 12, fontWeight: 700,
            color: 'var(--tng-coral)',
            fontFamily: 'var(--tng-font-mono)',
            letterSpacing: '0.04em',
          }}>
            <span>🔥</span>
            <span style={{ color: 'var(--tng-purple-900)' }}>{streak}</span>
            <span>dias seguidos</span>
          </div>
        )}
        {actions}
      </div>
    </div>
  )
}
