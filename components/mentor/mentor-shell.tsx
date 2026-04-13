'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { MentorSidebar } from './mentor-sidebar'

interface MentorShellProps {
  children: React.ReactNode
  user: User | null
  role?: string
}

export function MentorShell({ children, user, role }: MentorShellProps) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Mobile backdrop */}
      <div
        className={`sidebar-backdrop${open ? ' sidebar-open' : ''}`}
        onClick={() => setOpen(false)}
      />

      <MentorSidebar
        user={user}
        role={role}
        isOpen={open}
        onClose={() => setOpen(false)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Mobile topbar */}
        <div className="mentor-mobile-topbar" style={{
          display: 'none',
          height: 'var(--topbar-h)', padding: '0 16px',
          borderBottom: '0.5px solid var(--border)',
          alignItems: 'center', gap: 10, flexShrink: 0,
          background: 'var(--bg)',
        }}>
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              width: 30, height: 30, borderRadius: 'var(--rsm)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text2)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="2" y1="4" x2="14" y2="4" />
              <line x1="2" y1="8" x2="14" y2="8" />
              <line x1="2" y1="12" x2="14" y2="12" />
            </svg>
          </button>
          <span style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '.12em',
            textTransform: 'uppercase', color: 'var(--purple)',
          }}>
            TNG Mentor
          </span>
        </div>

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
