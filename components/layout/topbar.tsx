'use client'

import { useSidebar } from './sidebar-context'

interface TopbarProps {
  title: string
  subtitle?: string
  streak?: number
  actions?: React.ReactNode
}

export function Topbar({ title, subtitle, streak, actions }: TopbarProps) {
  const { toggle } = useSidebar()

  return (
    <div style={{
      height: 'var(--topbar-h)', padding: '0 20px',
      borderBottom: '0.5px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={toggle}
          className="sidebar-mobile-trigger"
          style={{
            width: 30, height: 30, borderRadius: 'var(--rsm)', background: 'none',
            border: 'none', cursor: 'pointer', color: 'var(--text2)',
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
          <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{subtitle}</div>}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {streak !== undefined && streak > 0 && (
          <div className="topbar-streak" style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 20,
            background: 'var(--bg3)', border: '0.5px solid var(--border2)',
            fontSize: 12, fontWeight: 500, color: 'var(--text)',
          }}>
            <span style={{ color: 'var(--orange)' }}>🔥</span>
            {streak} dias
          </div>
        )}
        {actions}
      </div>
    </div>
  )
}
