'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Program {
  id: string
  name: string
  description: string | null
  total_days: number
  is_published: boolean
  enrolled_count: number
  created_at: string
}

export default function ProgramsPage() {
  const router = useRouter()
  const [programs, setPrograms]     = useState<Program[]>([])
  const [loading, setLoading]       = useState(true)
  const [creating, setCreating]     = useState(false)
  const [showForm, setShowForm]     = useState(false)
  const [name, setName]             = useState('')
  const [description, setDescription] = useState('')
  const [totalDays, setTotalDays]   = useState('30')

  useEffect(() => {
    fetch('/api/admin/programs')
      .then(r => r.json())
      .then(setPrograms)
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, total_days: parseInt(totalDays) }),
      })
      const data = await res.json()
      if (data.id) router.push(`/admin/programs/${data.id}`)
    } finally {
      setCreating(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 11px', borderRadius: 'var(--rsm)',
    background: 'var(--bg3)', border: '0.5px solid var(--border2)',
    color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div className="mentor-sub-page" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Programas</h1>
          <p style={{ fontSize: 13, color: 'var(--text3)', margin: '4px 0 0' }}>
            Bootcamps, sprints e programas extras da plataforma
          </p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          style={{
            padding: '8px 16px', borderRadius: 'var(--rsm)', fontSize: 13, fontWeight: 500,
            background: showForm ? 'var(--bg3)' : 'var(--purple-dim)',
            color: showForm ? 'var(--text3)' : 'var(--purple)',
            border: `0.5px solid ${showForm ? 'var(--border)' : 'var(--purple)'}`,
            cursor: 'pointer',
          }}
        >
          {showForm ? 'Cancelar' : '+ Novo programa'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{
          background: 'var(--bg2)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--r)', padding: '20px 22px', marginBottom: 24,
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 16 }}>
            Novo programa
          </div>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  Nome
                </label>
                <input
                  required value={name} onChange={e => setName(e.target.value)}
                  placeholder="ex: Bootcamp 30 dias, Sprint Entrevistas…"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  Total de dias
                </label>
                <input
                  type="number" min="1" max="90" required
                  value={totalDays} onChange={e => setTotalDays(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Descrição (opcional)
              </label>
              <input
                value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Descrição breve do programa"
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="submit" disabled={creating || !name}
                style={{
                  padding: '8px 18px', borderRadius: 'var(--rsm)', fontSize: 13, fontWeight: 500,
                  background: creating || !name ? 'var(--bg4)' : 'var(--purple-dim)',
                  color: creating || !name ? 'var(--text4)' : 'var(--purple)',
                  border: `0.5px solid ${creating || !name ? 'var(--border)' : 'var(--purple)'}`,
                  cursor: creating || !name ? 'not-allowed' : 'pointer',
                }}
              >
                {creating ? 'Criando…' : 'Criar e editar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Programs list */}
      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text4)', fontSize: 13 }}>
          Carregando…
        </div>
      ) : programs.length === 0 ? (
        <div style={{
          background: 'var(--bg2)', border: '0.5px solid var(--border)',
          borderRadius: 'var(--r)', padding: '48px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 13, color: 'var(--text4)', marginBottom: 8 }}>Nenhum programa ainda</div>
          <div style={{ fontSize: 12, color: 'var(--text4)' }}>Crie o primeiro programa acima.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {programs.map(p => (
            <button
              key={p.id}
              onClick={() => router.push(`/admin/programs/${p.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '16px 18px', cursor: 'pointer', border: '0.5px solid var(--border)',
                borderRadius: 'var(--r)', background: 'var(--bg2)', textAlign: 'left',
                width: '100%', transition: 'background .1s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg3)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg2)' }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{p.name}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 8,
                    background: p.is_published ? 'var(--green-dim)' : 'var(--bg4)',
                    color: p.is_published ? 'var(--green)' : 'var(--text4)',
                    textTransform: 'uppercase', letterSpacing: '.06em',
                  }}>
                    {p.is_published ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
                {p.description && (
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.description}</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{p.total_days}</div>
                  <div style={{ fontSize: 10, color: 'var(--text4)' }}>dias</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent)' }}>{p.enrolled_count}</div>
                  <div style={{ fontSize: 10, color: 'var(--text4)' }}>ativos</div>
                </div>
              </div>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14, color: 'var(--text4)', flexShrink: 0 }}>
                <polyline points="6,4 10,8 6,12" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
