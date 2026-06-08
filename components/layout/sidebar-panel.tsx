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
        background: 'var(--tng-paper)',
        borderRight: '1px solid var(--tng-rule)',
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
