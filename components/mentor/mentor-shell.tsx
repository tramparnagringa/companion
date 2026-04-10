'use client'

import { usePathname, useRouter } from 'next/navigation'

export function MentorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  // Workspace (/mentor) has its own full-screen mobile navigation
  const isWorkspace = pathname === '/mentor'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Mobile topbar — only on sub-pages */}
      {!isWorkspace && (
        <div className="mentor-sub-topbar" style={{
          display: 'none',
          height: 'var(--topbar-h)', padding: '0 16px',
          borderBottom: '0.5px solid var(--border)',
          alignItems: 'center', gap: 10, flexShrink: 0,
          background: 'var(--bg)',
        }}>
          <button
            onClick={() => router.push('/mentor')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 'var(--rsm)',
              background: 'none', border: '0.5px solid var(--border2)',
              cursor: 'pointer', color: 'var(--text3)', fontSize: 12,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="10,4 6,8 10,12" />
            </svg>
            Mentor
          </button>
          <span style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '.12em',
            textTransform: 'uppercase', color: 'var(--purple)',
          }}>
            TNG Mentor
          </span>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}
