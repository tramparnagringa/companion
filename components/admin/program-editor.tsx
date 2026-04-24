'use client'

import { useState, useCallback, useMemo } from 'react'
import { ProgramAIAssistant } from './program-ai-assistant'

function detectPhase(days: { ai_instructions?: string | null; cards?: unknown[] }[]): 'outline' | 'week' | 'refine' {
  if (days.length === 0) return 'outline'
  const hasFullContent = days.some(d => d.ai_instructions && Array.isArray(d.cards) && d.cards.length > 0)
  return hasFullContent ? 'refine' : 'week'
}

interface Card {
  type: 'learn' | 'ai' | 'action' | 'reflect'
  title: string
  description: string
}

interface ProgramDay {
  day_number: number
  week_number: number
  name: string
  description: string | null
  ai_instructions: string | null
  ai_model: string
  ai_max_tokens: number
  cards?: Card[]
}

interface Program {
  id: string
  name: string
  slug: string
  description: string | null
  total_days: number
  is_published: boolean
  token_allocation: number | null
  credit_ratio: number | null
  price_brl: number | null
  duration_days: number | null
  validity_days: number | null
  abacatepay_product_id: string | null
  store_visible: boolean
  display_order: number
  features: string[]
  days: ProgramDay[]
}

interface DayForm {
  name: string
  description: string
  ai_instructions: string
  ai_model: string
  ai_max_tokens: number
  cards: Card[]
}

const CARD_TYPE_META = {
  learn:   { label: 'Conceito', color: 'var(--blue)',   dim: 'var(--blue-dim)'   },
  ai:      { label: 'Sessão IA', color: 'var(--purple)', dim: 'var(--purple-dim)' },
  action:  { label: 'Ação',     color: 'var(--green)',  dim: 'var(--green-dim)'  },
  reflect: { label: 'Reflexão', color: 'var(--purple)', dim: 'var(--purple-dim)' },
}

export function ProgramEditor({ program: initial }: { program: Program }) {
  const [program, setProgram]       = useState(initial)
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [dayForm, setDayForm]       = useState<DayForm>({
    name: '', description: '', ai_instructions: '',
    ai_model: 'claude-sonnet-4-6', ai_max_tokens: 1024, cards: [],
  })
  const [savingDay, setSavingDay]     = useState(false)
  const [savingHeader, setSavingHeader] = useState(false)
  const [toggling, setToggling]       = useState(false)
  const [headerForm, setHeaderForm]   = useState({
    name: program.name,
    slug: program.slug,
    description: program.description ?? '',
    token_allocation: program.token_allocation ?? '',
    credit_ratio: program.credit_ratio ?? 10,
    price_brl: program.price_brl ?? '',
    duration_days: program.duration_days ?? '',
    validity_days: program.validity_days ?? '',
    abacatepay_product_id: program.abacatepay_product_id ?? '',
    store_visible: program.store_visible,
    display_order: program.display_order,
    features_text: (program.features ?? []).join('\n'),
  })

  const currentPhase = useMemo(() => detectPhase(program.days), [program.days])

  const reloadDays = useCallback(async () => {
    const res = await fetch(`/api/admin/programs/${program.id}`)
    if (res.ok) {
      const data = await res.json()
      setProgram(p => ({ ...p, days: data.days ?? [] }))
    }
  }, [program.id])

  const weeks: Record<number, ProgramDay[]> = {}
  for (const d of program.days) {
    if (!weeks[d.week_number]) weeks[d.week_number] = []
    weeks[d.week_number].push(d)
  }

  function openDay(d: ProgramDay) {
    setEditingDay(d.day_number)
    setDayForm({
      name: d.name,
      description: d.description ?? '',
      ai_instructions: d.ai_instructions ?? '',
      ai_model: d.ai_model,
      ai_max_tokens: d.ai_max_tokens,
      cards: (d.cards ?? []).map(c => ({ ...c })),
    })
  }

  function addCard() {
    setDayForm(f => ({
      ...f,
      cards: [...f.cards, { type: 'ai', title: '', description: '' }],
    }))
  }

  function updateCard(i: number, field: keyof Card, value: string) {
    setDayForm(f => ({
      ...f,
      cards: f.cards.map((c, idx) => idx === i ? { ...c, [field]: value } : c),
    }))
  }

  function removeCard(i: number) {
    setDayForm(f => ({ ...f, cards: f.cards.filter((_, idx) => idx !== i) }))
  }

  function moveCard(i: number, dir: -1 | 1) {
    setDayForm(f => {
      const cards = [...f.cards]
      const j = i + dir
      if (j < 0 || j >= cards.length) return f
      ;[cards[i], cards[j]] = [cards[j], cards[i]]
      return { ...f, cards }
    })
  }

  async function saveDay() {
    if (!editingDay) return
    setSavingDay(true)
    try {
      const res = await fetch(`/api/admin/programs/${program.id}/days`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_number: editingDay, ...dayForm }),
      })
      if (res.ok) {
        setProgram(p => ({
          ...p,
          days: p.days.map(d => d.day_number === editingDay ? { ...d, ...dayForm } : d),
        }))
        setEditingDay(null)
      }
    } finally {
      setSavingDay(false)
    }
  }

  async function saveHeader() {
    setSavingHeader(true)
    try {
      const res = await fetch(`/api/admin/programs/${program.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: headerForm.name,
          slug: headerForm.slug || undefined,
          description: headerForm.description || null,
          token_allocation: headerForm.token_allocation !== '' ? Number(headerForm.token_allocation) : null,
          credit_ratio: Number(headerForm.credit_ratio) || 10,
          price_brl: headerForm.price_brl !== '' ? Number(headerForm.price_brl) : null,
          duration_days: headerForm.duration_days !== '' ? Number(headerForm.duration_days) : null,
          validity_days: headerForm.validity_days !== '' ? Number(headerForm.validity_days) : null,
          abacatepay_product_id: headerForm.abacatepay_product_id || null,
          store_visible: headerForm.store_visible,
          display_order: Number(headerForm.display_order) || 0,
          features: headerForm.features_text.split('\n').map(s => s.trim()).filter(Boolean),
        }),
      })
      if (res.ok) setProgram(p => ({
        ...p,
        name: headerForm.name,
        slug: headerForm.slug,
        description: headerForm.description || null,
        token_allocation: headerForm.token_allocation !== '' ? Number(headerForm.token_allocation) : null,
        credit_ratio: Number(headerForm.credit_ratio) || 10,
        price_brl: headerForm.price_brl !== '' ? Number(headerForm.price_brl) : null,
        duration_days: headerForm.duration_days !== '' ? Number(headerForm.duration_days) : null,
        validity_days: headerForm.validity_days !== '' ? Number(headerForm.validity_days) : null,
        abacatepay_product_id: headerForm.abacatepay_product_id || null,
        store_visible: headerForm.store_visible,
        display_order: Number(headerForm.display_order) || 0,
        features: headerForm.features_text.split('\n').map(s => s.trim()).filter(Boolean),
      }))
    } finally {
      setSavingHeader(false)
    }
  }

  async function togglePublish() {
    setToggling(true)
    try {
      const res = await fetch(`/api/admin/programs/${program.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !program.is_published }),
      })
      if (res.ok) setProgram(p => ({ ...p, is_published: !p.is_published }))
    } finally {
      setToggling(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 11px', borderRadius: 'var(--rsm)',
    background: 'var(--bg3)', border: '0.5px solid var(--border2)',
    color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }
  const textareaStyle: React.CSSProperties = {
    ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.55,
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: 'var(--text3)', display: 'block', marginBottom: 4,
    textTransform: 'uppercase', letterSpacing: '.06em',
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: 'var(--bg)' }}>

    {/* Left — editor */}
    <div className="mentor-sub-page" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: 'var(--text4)', marginBottom: 16 }}>
        <a href="/admin/programs" style={{ color: 'var(--text4)', textDecoration: 'none' }}>Programas</a>
        {' / '}
        <span style={{ color: 'var(--text3)' }}>{program.name}</span>
      </div>

      {/* Header card */}
      <div style={{
        background: 'var(--bg2)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--r)', padding: '20px 22px', marginBottom: 24,
      }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Nome do programa</label>
            <input
              value={headerForm.name}
              onChange={e => setHeaderForm(f => ({ ...f, name: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div style={{ flexShrink: 0, paddingTop: 18 }}>
            <button onClick={saveHeader} disabled={savingHeader} style={{
              padding: '8px 16px', borderRadius: 'var(--rsm)', fontSize: 12,
              background: 'var(--purple-dim)', color: 'var(--purple)',
              border: '0.5px solid var(--purple)', cursor: 'pointer',
              opacity: savingHeader ? .6 : 1,
            }}>
              {savingHeader ? '…' : 'Salvar'}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Slug (URL)</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                fontSize: 12, color: 'var(--text4)', pointerEvents: 'none',
              }}>/</span>
              <input
                value={headerForm.slug}
                onChange={e => setHeaderForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="meu-programa"
                style={{ ...inputStyle, paddingLeft: 20 }}
              />
            </div>
          </div>
          <div style={{ flex: 2 }}>
            <label style={labelStyle}>Descrição</label>
            <input
              value={headerForm.description}
              onChange={e => setHeaderForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descrição breve"
              style={inputStyle}
            />
          </div>
        </div>
        {/* Token config */}
        <div style={{
          borderTop: '0.5px solid var(--border)', marginTop: 4, paddingTop: 14, marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text4)', marginBottom: 10 }}>
            Configuração de Tokens
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>Alocação (tokens reais)</label>
              <input
                type="number" min="0" step="10000"
                value={headerForm.token_allocation}
                onChange={e => setHeaderForm(f => ({ ...f, token_allocation: e.target.value }))}
                placeholder="ex: 250000"
                style={inputStyle}
              />
              {headerForm.token_allocation !== '' && (
                <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 3 }}>
                  = {Math.floor(Number(headerForm.token_allocation) / (Number(headerForm.credit_ratio) || 10)).toLocaleString('pt-BR')} créditos
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Razão de créditos (display)</label>
              <input
                type="number" min="1" step="1"
                value={headerForm.credit_ratio}
                onChange={e => setHeaderForm(f => ({ ...f, credit_ratio: Number(e.target.value) || 10 }))}
                placeholder="10"
                style={inputStyle}
              />
              <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 3 }}>tokens ÷ ratio = créditos exibidos</div>
            </div>
            <div>
              <label style={labelStyle}>Preço (R$)</label>
              <input
                type="number" min="0" step="0.01"
                value={headerForm.price_brl}
                onChange={e => setHeaderForm(f => ({ ...f, price_brl: e.target.value }))}
                placeholder="ex: 97.00"
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Duração real (dias)</label>
              <input
                type="number" min="1" step="1"
                value={headerForm.duration_days}
                onChange={e => {
                  const d = Number(e.target.value)
                  const suggested = d <= 7 ? 30 : 365
                  setHeaderForm(f => ({
                    ...f,
                    duration_days: e.target.value,
                    validity_days: f.validity_days === '' ? suggested : f.validity_days,
                  }))
                }}
                placeholder="ex: 7"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Validade do token (dias)</label>
              <input
                type="number" min="1" step="1"
                value={headerForm.validity_days}
                onChange={e => setHeaderForm(f => ({ ...f, validity_days: e.target.value }))}
                placeholder="ex: 30"
                style={inputStyle}
              />
              <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 3 }}>
                Sugerido: ≤7d → 30 dias · ≤30d → 365 dias
              </div>
            </div>
          </div>
        </div>

        {/* Store config */}
        <div style={{
          borderTop: '0.5px solid var(--border)', marginTop: 14, paddingTop: 14, marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text4)', marginBottom: 10 }}>
            Loja
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>ID do produto no AbacatePay</label>
              <input
                value={headerForm.abacatepay_product_id}
                onChange={e => setHeaderForm(f => ({ ...f, abacatepay_product_id: e.target.value }))}
                placeholder="prod_xxxxxxxxxxxxxxxx"
                style={{ ...inputStyle, fontFamily: 'var(--mono)', fontSize: 12 }}
              />
            </div>
            <div>
              <label style={labelStyle}>Ordem na loja</label>
              <input
                type="number" min="0" step="1"
                value={headerForm.display_order}
                onChange={e => setHeaderForm(f => ({ ...f, display_order: Number(e.target.value) || 0 }))}
                placeholder="0"
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Features (uma por linha — aparece como ✓ na loja)</label>
            <textarea
              value={headerForm.features_text}
              onChange={e => setHeaderForm(f => ({ ...f, features_text: e.target.value }))}
              placeholder={'30 dias guiados por IA\nCV e LinkedIn em inglês\nSimulação de entrevista'}
              style={{ ...textareaStyle, minHeight: 96, fontFamily: 'var(--mono)', fontSize: 12 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setHeaderForm(f => ({ ...f, store_visible: !f.store_visible }))}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 'var(--rsm)', fontSize: 12, fontWeight: 500,
                cursor: 'pointer',
                background: headerForm.store_visible ? 'var(--accent-dim)' : 'var(--bg4)',
                color: headerForm.store_visible ? 'var(--accent)' : 'var(--text3)',
                border: `0.5px solid ${headerForm.store_visible ? 'var(--accent)' : 'var(--border2)'}`,
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: headerForm.store_visible ? 'var(--accent)' : 'var(--text4)',
                display: 'inline-block',
              }} />
              {headerForm.store_visible ? 'Visível na loja' : 'Oculto da loja'}
            </button>
            <span style={{ fontSize: 11, color: 'var(--text4)' }}>
              {headerForm.store_visible
                ? 'Aparece na página de compra para novos usuários'
                : 'Não aparece na página de compra'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>{program.total_days} dias</div>
          <button onClick={togglePublish} disabled={toggling} style={{
            padding: '6px 14px', borderRadius: 'var(--rsm)', fontSize: 12, fontWeight: 500,
            cursor: toggling ? 'not-allowed' : 'pointer', opacity: toggling ? .6 : 1,
            background: program.is_published ? 'var(--red-dim)' : 'var(--green-dim)',
            color: program.is_published ? 'var(--red)' : 'var(--green)',
            border: `0.5px solid ${program.is_published ? 'var(--red)' : 'var(--green)'}`,
          }}>
            {program.is_published ? 'Despublicar' : 'Publicar'}
          </button>
          <span style={{
            fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 8,
            background: program.is_published ? 'var(--green-dim)' : 'var(--bg4)',
            color: program.is_published ? 'var(--green)' : 'var(--text4)',
            textTransform: 'uppercase', letterSpacing: '.06em',
          }}>
            {program.is_published ? 'Publicado' : 'Rascunho'}
          </span>
        </div>
      </div>

      {/* Days grouped by week */}
      {Object.entries(weeks).map(([weekNum, days]) => (
        <div key={weekNum} style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '.08em',
            textTransform: 'uppercase', color: 'var(--text4)', marginBottom: 8,
          }}>
            Semana {weekNum}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {days.map(d => {
              const isOpen = editingDay === d.day_number
              const cardCount = d.cards?.length ?? 0
              return (
                <div key={d.day_number} style={{
                  background: 'var(--bg2)',
                  border: `0.5px solid ${isOpen ? 'var(--purple)' : 'var(--border)'}`,
                  borderRadius: 'var(--rsm)', overflow: 'hidden', transition: 'border-color .12s',
                }}>
                  {/* Day row */}
                  <button
                    onClick={() => isOpen ? setEditingDay(null) : openDay(d)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', width: '100%', textAlign: 'left',
                      background: 'none', border: 'none', cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text4)', width: 36, flexShrink: 0 }}>
                      D{d.day_number}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--text)', fontWeight: 400 }}>
                      {d.name}
                    </span>
                    {/* Card type badges */}
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {d.ai_instructions && (
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: 'var(--purple-dim)', color: 'var(--purple)', border: '0.5px solid rgba(167,139,250,.2)' }}>
                          IA
                        </span>
                      )}
                      {cardCount > 0 && (
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: 'var(--bg4)', color: 'var(--text4)' }}>
                          {cardCount} {cardCount === 1 ? 'card' : 'cards'}
                        </span>
                      )}
                    </div>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
                      style={{ width: 12, height: 12, color: 'var(--text4)', transition: 'transform .15s', transform: isOpen ? 'rotate(90deg)' : 'none', flexShrink: 0 }}>
                      <polyline points="6,4 10,8 6,12" />
                    </svg>
                  </button>

                  {/* Edit form */}
                  {isOpen && (
                    <div style={{ padding: '0 14px 16px', borderTop: '0.5px solid var(--border)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 14 }}>

                        {/* Name + description */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div>
                            <label style={labelStyle}>Nome do dia</label>
                            <input value={dayForm.name} onChange={e => setDayForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
                          </div>
                          <div>
                            <label style={labelStyle}>Descrição</label>
                            <input value={dayForm.description} onChange={e => setDayForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição breve" style={inputStyle} />
                          </div>
                        </div>

                        {/* AI instructions */}
                        <div>
                          <label style={labelStyle}>Instruções para a IA</label>
                          <textarea
                            value={dayForm.ai_instructions}
                            onChange={e => setDayForm(f => ({ ...f, ai_instructions: e.target.value }))}
                            placeholder="Descreva o que a IA deve fazer — objetivo, perguntas, outputs esperados…"
                            style={{ ...textareaStyle, minHeight: 100 }}
                          />
                        </div>

                        {/* Cards */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <label style={{ ...labelStyle, marginBottom: 0 }}>Cards ({dayForm.cards.length})</label>
                            <button
                              onClick={addCard}
                              style={{
                                fontSize: 11, padding: '3px 10px', borderRadius: 'var(--rsm)',
                                background: 'var(--bg4)', color: 'var(--text3)',
                                border: '0.5px solid var(--border)', cursor: 'pointer',
                              }}
                            >
                              + Adicionar card
                            </button>
                          </div>

                          {/* Card type reference */}
                          <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
                            marginBottom: 10,
                          }}>
                            {([
                              { type: 'learn',   hint: 'Texto + botão "Aprofundar com IA" (opcional)' },
                              { type: 'ai',      hint: 'Legado — use "action" no lugar' },
                              { type: 'action',  hint: 'Texto + botão "Executar com IA" (sessão principal)' },
                              { type: 'reflect', hint: 'Texto + botão "Reflexão do dia" (só retros/fins de semana)' },
                            ] as const).map(({ type, hint }) => {
                              const m = CARD_TYPE_META[type]
                              return (
                                <div key={type} style={{
                                  padding: '6px 8px', borderRadius: 'var(--rsm)',
                                  background: m.dim, border: `0.5px solid ${m.color}30`,
                                }}>
                                  <div style={{ fontSize: 10, fontWeight: 600, color: m.color, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '.06em' }}>{m.label}</div>
                                  <div style={{ fontSize: 10, color: 'var(--text4)', lineHeight: 1.4 }}>{hint}</div>
                                </div>
                              )
                            })}
                          </div>

                          {dayForm.cards.length === 0 && (
                            <div style={{ fontSize: 12, color: 'var(--text4)', padding: '10px 0' }}>
                              Nenhum card. Adicione ao menos um card de IA.
                            </div>
                          )}

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {dayForm.cards.map((card, i) => {
                              const meta = CARD_TYPE_META[card.type]
                              return (
                                <div key={i} style={{
                                  background: 'var(--bg3)', borderRadius: 'var(--rsm)',
                                  border: `0.5px solid ${meta.dim}`,
                                  padding: '10px 12px',
                                  display: 'flex', flexDirection: 'column', gap: 8,
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {/* Type selector */}
                                    <select
                                      value={card.type}
                                      onChange={e => updateCard(i, 'type', e.target.value)}
                                      style={{
                                        ...inputStyle, width: 'auto', padding: '4px 8px', fontSize: 11,
                                        fontWeight: 600, color: meta.color, background: meta.dim,
                                        border: `0.5px solid ${meta.color}40`,
                                      }}
                                    >
                                      <option value="learn">Conceito</option>
                                      <option value="ai">IA</option>
                                      <option value="action">Ação</option>
                                      <option value="reflect">Reflexão</option>
                                    </select>
                                    <input
                                      value={card.title}
                                      onChange={e => updateCard(i, 'title', e.target.value)}
                                      placeholder="Título do card"
                                      style={{ ...inputStyle, flex: 1, padding: '5px 9px', fontSize: 13 }}
                                    />
                                    {/* Move up/down */}
                                    <button onClick={() => moveCard(i, -1)} disabled={i === 0}
                                      style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', color: 'var(--text4)', padding: '0 2px', opacity: i === 0 ? 0.3 : 1 }}>
                                      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 11, height: 11 }}><polyline points="2,8 6,4 10,8" /></svg>
                                    </button>
                                    <button onClick={() => moveCard(i, 1)} disabled={i === dayForm.cards.length - 1}
                                      style={{ background: 'none', border: 'none', cursor: i === dayForm.cards.length - 1 ? 'default' : 'pointer', color: 'var(--text4)', padding: '0 2px', opacity: i === dayForm.cards.length - 1 ? 0.3 : 1 }}>
                                      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 11, height: 11 }}><polyline points="2,4 6,8 10,4" /></svg>
                                    </button>
                                    <button onClick={() => removeCard(i)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text4)', padding: '0 2px' }}>
                                      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 11, height: 11 }}><line x1="2" y1="2" x2="10" y2="10" /><line x1="10" y1="2" x2="2" y2="10" /></svg>
                                    </button>
                                  </div>
                                  <textarea
                                    value={card.description}
                                    onChange={e => updateCard(i, 'description', e.target.value)}
                                    placeholder="Descrição do card — suporta markdown (parágrafos, **negrito**, listas…)"
                                    style={{ ...inputStyle, padding: '5px 9px', fontSize: 13, resize: 'vertical', minHeight: 72, lineHeight: 1.55 }}
                                  />
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Model + tokens */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10 }}>
                          <div>
                            <label style={labelStyle}>Modelo</label>
                            <select value={dayForm.ai_model} onChange={e => setDayForm(f => ({ ...f, ai_model: e.target.value }))} style={inputStyle}>
                              <option value="claude-sonnet-4-6">claude-sonnet-4-6</option>
                              <option value="claude-haiku-4-5-20251001">claude-haiku-4-5 (rápido)</option>
                              <option value="claude-opus-4-6">claude-opus-4-6 (avançado)</option>
                            </select>
                          </div>
                          <div>
                            <label style={labelStyle}>Max tokens</label>
                            <input
                              type="number" min="256" max="4096" step="256"
                              value={dayForm.ai_max_tokens}
                              onChange={e => setDayForm(f => ({ ...f, ai_max_tokens: parseInt(e.target.value) }))}
                              style={inputStyle}
                            />
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={saveDay} disabled={savingDay} style={{
                            padding: '7px 16px', borderRadius: 'var(--rsm)', fontSize: 12, fontWeight: 500,
                            background: 'var(--purple-dim)', color: 'var(--purple)',
                            border: '0.5px solid var(--purple)', cursor: savingDay ? 'not-allowed' : 'pointer',
                            opacity: savingDay ? .6 : 1,
                          }}>
                            {savingDay ? 'Salvando…' : 'Salvar dia'}
                          </button>
                          <button onClick={() => setEditingDay(null)} style={{
                            padding: '7px 14px', borderRadius: 'var(--rsm)', fontSize: 12,
                            background: 'none', color: 'var(--text4)',
                            border: '0.5px solid var(--border)', cursor: 'pointer',
                          }}>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>

    {/* Right — AI assistant */}
    <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <ProgramAIAssistant programId={program.id} initialPhase={currentPhase} onDaysSaved={reloadDays} />
    </div>

    </div>
  )
}
