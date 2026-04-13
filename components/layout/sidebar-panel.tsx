'use client'

interface SidebarPanelProps {
  children: React.ReactNode
  isOpen?: boolean
  className?: string
}

/**
 * Structural wrapper shared by all secondary sidebars (companion, admin, mentor).
 * Controls width, background, border, and the mobile open/close animation.
 * Inner content is fully owned by the consuming component.
 */
export function SidebarPanel({ children, isOpen, className }: SidebarPanelProps) {
  return (
    <nav
      className={`sidebar-nav${isOpen ? ' sidebar-open' : ''}${className ? ` ${className}` : ''}`}
      style={{
        width: 'var(--sidebar-w)',
        background: 'var(--bg2)',
        borderRight: '0.5px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
        zIndex: 50,
      }}
    >
      {children}
    </nav>
  )
}
