import type { User } from '@supabase/supabase-js'

const ROLE_COLOR: Record<string, { bg: string; border: string; text: string }> = {
  admin:   { bg: '#FFE4D9',               border: 'rgba(255,107,53,.4)',   text: 'var(--tng-coral)' },
  mentor:  { bg: 'var(--tng-purple-100)', border: 'var(--tng-purple-300)', text: 'var(--tng-purple-700)' },
  default: { bg: 'var(--tng-purple-100)',  border: 'var(--tng-purple-300)',  text: 'var(--tng-purple-700)' },
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
