import type { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/service'
import { computeCostUsd, formatUsd } from '@/lib/anthropic/pricing'
import { getPeriodDates, formatTokens, MODEL_SHORT, INTERACTION_LABELS } from '../page'

export const metadata: Metadata = { title: 'Log de Tokens' }

// ── Types ─────────────────────────────────────────────────────────────────────

type Period = 'this_month' | 'last_month' | '30d' | 'all'

interface LogRow {
  id: string
  user_id: string
  tokens_consumed: number
  interaction_type: string
  model: string | null
  input_tokens: number | null
  output_tokens: number | null
  created_at: string
  metadata: Record<string, unknown> | null
}

interface Program { id: string; name: string; total_days: number }

const PAGE_SIZE = 50

const PERIODS: { key: Period; label: string }[] = [
  { key: 'this_month', label: 'Este mês'   },
  { key: 'last_month', label: 'Último mês' },
  { key: '30d',        label: '30 dias'    },
  { key: 'all',        label: 'Tudo'       },
]

// ── Data ──────────────────────────────────────────────────────────────────────

async function getLogData(params: {
  period: Period
  programId?: string
  userId?: string
  model?: string
  type?: string
  from?: string
  to?: string
  dayNumber?: number
  page: number
}) {
  const supabase = createServiceClient()
  const offset   = (params.page - 1) * PAGE_SIZE

  // If filtering by program: resolve user IDs
  let programUserIds: string[] | null = null
  if (params.programId) {
    const { data } = await supabase
      .from('user_programs')
      .select('user_id')
      .eq('program_id', params.programId)
    programUserIds = (data ?? []).map((e: { user_id: string }) => e.user_id)
    if (programUserIds.length === 0) {
      return { rows: [] as LogRow[], total: 0, pages: 0, nameMap: {} as Record<string, string | null> }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('token_usage')
    .select('id, user_id, tokens_consumed, interaction_type, model, input_tokens, output_tokens, created_at, metadata', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  // Period filter (unless custom from/to)
  if (!params.from && !params.to) {
    const { from, to } = getPeriodDates(params.period)
    query = query.gte('created_at', from).lte('created_at', to)
  }
  if (params.from) query = query.gte('created_at', params.from)
  if (params.to)   query = query.lte('created_at', params.to + 'T23:59:59Z')

  if (params.userId)      query = query.eq('user_id', params.userId)
  else if (programUserIds) query = query.in('user_id', programUserIds)
  if (params.model)       query = query.eq('model', params.model)
  if (params.type)        query = query.eq('interaction_type', params.type)
  if (params.dayNumber !== undefined) {
    query = query.filter('metadata->>day_number', 'eq', String(params.dayNumber))
  }

  const { data, count } = await query
  const rows = (data ?? []) as unknown as LogRow[]

  // Fetch names for user IDs in this page
  const userIds = [...new Set(rows.map(r => r.user_id))]
  const nameMap: Record<string, string | null> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)
    for (const p of (profiles ?? [])) nameMap[p.id] = p.full_name as string | null
  }

  return { rows, total: count ?? 0, pages: Math.ceil((count ?? 0) / PAGE_SIZE), nameMap }
}

async function getPrograms(): Promise<Program[]> {
  const supabase = createServiceClient()
  const { data } = await supabase.from('programs').select('id, name, total_days').order('name')
  return (data ?? []) as Program[]
}

async function getDistinctModels(): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any
  const { data } = await supabase.from('token_usage').select('model').not('model', 'is', null)
  const unique = [...new Set((data ?? []).map((r: { model: string }) => r.model).filter(Boolean))] as string[]
  return unique
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TokenLogPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string; program?: string; user?: string; model?: string
    type?: string; from?: string; to?: string; day?: string; page?: string
  }>
}) {
  const sp          = await searchParams
  const period      = (sp.period  ?? 'this_month') as Period
  const filterProg  = sp.program  ?? ''
  const filterUser  = sp.user     ?? ''
  const filterModel = sp.model    ?? ''
  const filterType  = sp.type     ?? ''
  const filterFrom  = sp.from     ?? ''
  const filterTo    = sp.to       ?? ''
  const filterDay   = sp.day && !isNaN(parseInt(sp.day, 10)) ? parseInt(sp.day, 10) : undefined
  const currentPage = Math.max(1, parseInt(sp.page ?? '1', 10))

  const [programs, models, { rows, total, pages, nameMap }] = await Promise.all([
    getPrograms(),
    getDistinctModels(),
    getLogData({
      period,
      programId:  filterProg  || undefined,
      userId:     filterUser  || undefined,
      model:      filterModel || undefined,
      type:       filterType  || undefined,
      from:       filterFrom  || undefined,
      to:         filterTo    || undefined,
      dayNumber:  filterDay,
      page:       currentPage,
    }),
  ])

  const selectedProgram = programs.find(p => p.id === filterProg)

  function buildLogUrl(overrides: Record<string, string | undefined>) {
    const q = new URLSearchParams()
    const base: Record<string, string | undefined> = {
      period,
      program: filterProg  || undefined,
      user:    filterUser  || undefined,
      model:   filterModel || undefined,
      type:    filterType  || undefined,
      from:    filterFrom  || undefined,
      to:      filterTo    || undefined,
      day:     filterDay !== undefined ? String(filterDay) : undefined,
    }
    const merged = { ...base, ...overrides }
    for (const [k, v] of Object.entries(merged)) {
      if (v) q.set(k, v)
    }
    return `/admin/tokens/log?${q.toString()}`
  }

  const hasFilter = filterProg || filterUser || filterModel || filterType || filterFrom || filterTo || filterDay !== undefined

  // ── Styles ──
  const card: React.CSSProperties = {
    background: 'var(--bg2)', border: '0.5px solid var(--border)',
    borderRadius: 'var(--r)', padding: '20px 24px',
  }
  const tbl: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' }
  const td:  React.CSSProperties = { padding: '8px 12px', fontSize: 12, color: 'var(--text2)', borderBottom: '0.5px solid var(--border)' }
  const th:  React.CSSProperties = { ...td, color: 'var(--text4)', fontWeight: 500, fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em' }
  const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, letterSpacing: '.10em', textTransform: 'uppercase', color: 'var(--text4)', marginBottom: 4 }
  const selectSt: React.CSSProperties = {
    height: 32, padding: '0 10px', borderRadius: 6,
    border: '0.5px solid var(--border2)', background: 'var(--bg3)',
    color: 'var(--text2)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
  }

  function formatDatetime(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px', background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <a href="/admin/tokens" style={{ fontSize: 12, color: 'var(--text4)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 12 }}>
          ← Tokens & Pricing
        </a>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Log de consumo
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', margin: '4px 0 0' }}>
          Todos os registros de uso de IA — {total.toLocaleString('pt-BR')} resultado{total !== 1 ? 's' : ''}{hasFilter ? ' (filtrado)' : ''}
        </p>
      </div>

      {/* ── Filters ── */}
      <div style={{ ...card, marginBottom: 24 }}>
        <form method="GET" action="/admin/tokens/log">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>

            {/* Period */}
            <div>
              <div style={{ ...lbl, marginBottom: 6 }}>Período</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {PERIODS.map(p => (
                  <a
                    key={p.key}
                    href={buildLogUrl({ period: p.key, page: '1' })}
                    style={{
                      padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, textDecoration: 'none',
                      background: p.key === period ? 'var(--bg4)' : 'transparent',
                      color:      p.key === period ? 'var(--text)' : 'var(--text4)',
                      border:     p.key === period ? '0.5px solid var(--border2)' : '0.5px solid transparent',
                    }}
                  >
                    {p.label}
                  </a>
                ))}
              </div>
            </div>

            <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch', margin: '0 4px' }} />

            {/* Program */}
            <div>
              <div style={{ ...lbl, marginBottom: 6 }}>Programa</div>
              <select name="program" style={{ ...selectSt, minWidth: 180 }} defaultValue={filterProg}>
                <option value="">Todos</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Day */}
            <div>
              <div style={{ ...lbl, marginBottom: 6 }}>Dia</div>
              <select name="day" style={{ ...selectSt, minWidth: 100 }} defaultValue={filterDay !== undefined ? String(filterDay) : ''}>
                <option value="">Todos</option>
                {Array.from({ length: selectedProgram?.total_days ?? 30 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={String(d)}>Dia {d}</option>
                ))}
              </select>
            </div>

            {/* Model */}
            <div>
              <div style={{ ...lbl, marginBottom: 6 }}>Modelo</div>
              <select name="model" style={selectSt} defaultValue={filterModel}>
                <option value="">Todos</option>
                {models.map(m => (
                  <option key={m} value={m}>{MODEL_SHORT[m] ?? m}</option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div>
              <div style={{ ...lbl, marginBottom: 6 }}>Tipo</div>
              <select name="type" style={selectSt} defaultValue={filterType}>
                <option value="">Todos</option>
                {Object.entries(INTERACTION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div>
              <div style={{ ...lbl, marginBottom: 6 }}>De</div>
              <input type="date" name="from" style={{ ...selectSt, minWidth: 130 }} defaultValue={filterFrom} />
            </div>
            <div>
              <div style={{ ...lbl, marginBottom: 6 }}>Até</div>
              <input type="date" name="to" style={{ ...selectSt, minWidth: 130 }} defaultValue={filterTo} />
            </div>

            <input type="hidden" name="period" value={period} />
            <input type="hidden" name="page" value="1" />

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <button type="submit" style={{
                height: 32, padding: '0 16px', borderRadius: 6,
                background: 'var(--bg4)', border: '0.5px solid var(--border2)',
                color: 'var(--text2)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Filtrar
              </button>
              {hasFilter && (
                <a href={`/admin/tokens/log?period=${period}`} style={{ fontSize: 12, color: 'var(--text4)', textDecoration: 'underline', lineHeight: '32px' }}>
                  Limpar
                </a>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* ── Table ── */}
      <div style={card}>
        <table style={tbl}>
          <thead>
            <tr>
              {['Data/hora', 'Aluno', 'Programa/Dia', 'Modelo', 'Tipo', 'Tokens', 'In / Out', 'Custo'].map((h, i) => (
                <th key={h} style={{ ...th, textAlign: i >= 6 ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const cost    = computeCostUsd(r.model, r.input_tokens, r.output_tokens, r.tokens_consumed)
              const name    = nameMap[r.user_id] ?? r.user_id.slice(0, 8) + '…'
              const dayNum  = r.metadata?.day_number as number | null | undefined
              const progId  = r.metadata?.program_id as string | null | undefined
              const prog    = progId ? programs.find(p => p.id === progId) : undefined
              return (
                <tr key={r.id}>
                  <td style={{ ...td, color: 'var(--text4)', fontFamily: 'var(--mono)', whiteSpace: 'nowrap', fontSize: 11 }}>
                    {formatDatetime(r.created_at)}
                  </td>
                  <td style={td}>
                    <a href={`/admin/students/${r.user_id}`} style={{ color: 'var(--text2)', textDecoration: 'none' }}>{name}</a>
                  </td>
                  <td style={{ ...td, fontSize: 11 }}>
                    {prog
                      ? <span style={{ color: 'var(--text3)' }}>{prog.name}{dayNum != null ? ` · Dia ${dayNum}` : ''}</span>
                      : dayNum != null
                        ? <span style={{ color: 'var(--text4)' }}>Dia {dayNum}</span>
                        : <span style={{ color: 'var(--text4)' }}>—</span>
                    }
                  </td>
                  <td style={{ ...td, fontFamily: 'var(--mono)', fontSize: 11 }}>
                    {r.model ? (MODEL_SHORT[r.model] ?? r.model) : <span style={{ color: 'var(--text4)' }}>—</span>}
                  </td>
                  <td style={{ ...td, color: 'var(--text3)' }}>{INTERACTION_LABELS[r.interaction_type] ?? r.interaction_type}</td>
                  <td style={{ ...td, fontFamily: 'var(--mono)', textAlign: 'right' }}>{formatTokens(r.tokens_consumed)}</td>
                  <td style={{ ...td, fontFamily: 'var(--mono)', fontSize: 11, textAlign: 'right', color: 'var(--text4)' }}>
                    {r.input_tokens != null
                      ? `${formatTokens(r.input_tokens)} / ${formatTokens(r.output_tokens ?? 0)}`
                      : '—'}
                  </td>
                  <td style={{ ...td, fontFamily: 'var(--mono)', textAlign: 'right', color: 'var(--accent)' }}>
                    {formatUsd(cost)}
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} style={{ ...td, color: 'var(--text4)', textAlign: 'center', padding: 32 }}>
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '0.5px solid var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text4)' }}>
              Página {currentPage} de {pages} · {total.toLocaleString('pt-BR')} registros
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {currentPage > 1 && (
                <a href={buildLogUrl({ page: String(currentPage - 1) })} style={{ height: 28, padding: '0 12px', display: 'inline-flex', alignItems: 'center', borderRadius: 6, border: '0.5px solid var(--border2)', background: 'var(--bg3)', fontSize: 12, color: 'var(--text2)', textDecoration: 'none' }}>
                  ← Anterior
                </a>
              )}
              {currentPage < pages && (
                <a href={buildLogUrl({ page: String(currentPage + 1) })} style={{ height: 28, padding: '0 12px', display: 'inline-flex', alignItems: 'center', borderRadius: 6, border: '0.5px solid var(--border2)', background: 'var(--bg3)', fontSize: 12, color: 'var(--text2)', textDecoration: 'none' }}>
                  Próxima →
                </a>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
