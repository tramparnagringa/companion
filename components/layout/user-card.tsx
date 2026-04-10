import type { User } from '@supabase/supabase-js'

const ROLE_COLOR: Record<string, { bg: string; border: string; text: string }> = {
  admin:   { bg: 'rgba(251,146,60,.2)',  border: 'rgba(251,146,60,.35)',  text: 'var(--orange)' },
  mentor:  { bg: 'rgba(167,139,250,.2)', border: 'rgba(167,139,250,.35)', text: 'var(--purple)' },
  default: { bg: 'rgba(228,253,139,.15)',border: 'rgba(228,253,139,.35)', text: 'var(--accent)' },
}

interface UserCardProps {
  user: User | null
  role?: string
}

export function UserCard({ user, role = 'student' }: UserCardProps) {
  const colors      = ROLE_COLOR[role] ?? ROLE_COLOR.default
  const initials    = (user?.user_metadata?.full_name ?? user?.email ?? '?').slice(0, 2).toUpperCase()
  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'Usuário'
  const showRole    = ['mentor', 'admin'].includes(role)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px',
      borderRadius: 'var(--rsm)', background: 'var(--bg3)',
    }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: colors.bg, border: `1px solid ${colors.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 600, color: colors.text, flexShrink: 0,
      }}>
        {initials}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayName}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {showRole ? role : user?.email}
        </div>
      </div>
    </div>
  )
}
