'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

interface Program {
  id: string
  name: string
  is_published: boolean
  total_days: number
  enrolled_count: number
}

interface AdminSidebarProps {
  user?: User | null
  isOpen?: boolean
  onClose?: () => void
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()

  const [programs, setPrograms] = useState<Program[]>([])
  const [search, setSearch]     = useState('')

  useEffect(() => {
    fetch('/api/admin/programs')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPrograms(data) })
  }, [])

  const filtered = programs.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  function navigate(href: string) {
    router.push(href)
    onClose?.()
  }

  return (
    <nav className={`admin-sidebar-nav${isOpen ? ' sidebar-open' : ''}`} style={{
      width: 'var(--sidebar-w)', background: 'var(--bg2)',
      borderRight: '0.5px solid var(--border)',
      display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 14px 12px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '.12em',
          textTransform: 'uppercase', color: 'var(--orange)',
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10,
        }}>
          <span style={{ width: 5, height: 5, background: 'var(--orange)', borderRadius: '50%', display: 'inline-block' }} />
          TNG Admin
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
                <line x1="2" y1="2" x2="12" y2="12" /><line x1="12" y1="2" x2="2" y2="12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search */}
        <div style={{
          background: 'var(--bg3)', border: '0.5px solid var(--border2)',
          borderRadius: 'var(--rsm)', padding: '6px 10px',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 12, height: 12, color: 'var(--text4)', flexShrink: 0 }}>
            <circle cx="7" cy="7" r="4.5" /><line x1="10.5" y1="10.5" x2="14" y2="14" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar programa…"
            style={{
              background: 'none', border: 'none', outline: 'none',
              fontSize: 12, color: 'var(--text)', width: '100%',
            }}
          />
        </div>
      </div>

      {/* Program list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {/* New program button */}
        <button
          onClick={() => navigate('/admin/programs')}
          style={{
            width: '100%', padding: '7px 8px', marginBottom: 6,
            borderRadius: 'var(--rsm)', fontSize: 12, fontWeight: 500,
            background: pathname === '/admin/programs' ? 'var(--orange-dim)' : 'none',
            color: pathname === '/admin/programs' ? 'var(--orange)' : 'var(--text3)',
            border: pathname === '/admin/programs' ? '0.5px solid rgba(251,146,60,.2)' : '0.5px dashed var(--border2)',
            cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
          Novo programa
        </button>

        {filtered.map(p => {
          const isActive = pathname.startsWith(`/admin/programs/${p.id}`)
          return (
            <button
              key={p.id}
              onClick={() => navigate(`/admin/programs/${p.id}`)}
              style={{
                width: '100%', textAlign: 'left', padding: '8px 10px', cursor: 'pointer',
                background: isActive ? 'var(--bg3)' : 'none',
                border: 'none',
                borderLeft: isActive ? '2px solid var(--orange)' : '2px solid transparent',
                borderRadius: isActive ? '0 var(--rsm) var(--rsm) 0' : 'var(--rsm)',
                display: 'flex', flexDirection: 'column', gap: 2,
                marginBottom: 2,
              }}
            >
              <div style={{
                fontSize: 12, fontWeight: 500,
                color: isActive ? 'var(--text)' : 'var(--text2)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {p.name}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{
                  fontSize: 9, padding: '1px 5px', borderRadius: 4,
                  background: p.is_published ? 'var(--green-dim)' : 'var(--bg4)',
                  color: p.is_published ? 'var(--green)' : 'var(--text4)',
                }}>
                  {p.is_published ? 'publicado' : 'rascunho'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text4)' }}>
                  {p.total_days}d · {p.enrolled_count} ativos
                </span>
              </div>
            </button>
          )
        })}

        {filtered.length === 0 && search && (
          <div style={{ fontSize: 11, color: 'var(--text4)', padding: '12px 10px' }}>
            Nenhum resultado
          </div>
        )}
      </div>
    </nav>
  )
}
