import { createServiceClient } from '@/lib/supabase/service'
import { computeCostUsd, formatUsd, ANTHROPIC_PRICING } from '@/lib/anthropic/pricing'

// ── Types ─────────────────────────────────────────────────────────────────────

type Period = 'this_month' | 'last_month' | '30d' | 'all'

interface UsageRow {
  user_id: string
  tokens_consumed: number
  interaction_type: string
  model: string | null
  input_tokens: number | null
  output_tokens: number | null
  created_at: string
}

interface ProgramStat {
  programId:           string
  programName:         string
  programSlug:         string
  enrolledUsers:       number
  activeUsersInPeriod: number
  totalTokens:         number
  totalCostUsd:        number
  avgTokensPerUser:    number
  avgCostPerUser:      number
  priceBrl:            number | null
  totalDays:           number
}

interface Program {
  id: string
  name: string
  total_days: number
  price_brl: number | null
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PERIODS: { key: Period; label: string }[] = [
  { key: 'this_month', label: 'Este mês'   },
  { key: 'last_month', label: 'Último mês' },
  { key: '30d',        label: '30 dias'    },
  { key: 'all',        label: 'Tudo'       },
]

export const MODEL_SHORT: Record<string, string> = {
  'claude-sonnet-4-6':         'Sonnet 4.6',
  'claude-haiku-4-5-20251001': 'Haiku 4.5',
  'claude-opus-4-6':           'Opus 4.6',
  'claude-opus-4-7':           'Opus 4.7',
}

export const INTERACTION_LABELS: Record<string, string> = {
  chat:                'Chat livre',
  mentor:              'Mentor IA',
  day_activity:        'Atividade de dia',
  cv_rewrite:          'Reescrita de CV',
  day_init:            'Início de dia',
  mentor_chat:         'Chat mentor (dossier)',
  mentor_student_chat: 'Chat mentor (ações)',
  job_analysis:        'Análise de vaga',
  interview_prep:      'Prep de entrevista',
  program_generation:  'Geração de programa',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getPeriodDates(period: Period): { from: string; to: string; days: number } {
  const now = new Date()
  if (period === 'this_month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: from.toISOString(), to: now.toISOString(), days: now.getDate() }
  }
  if (period === 'last_month') {
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const to   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    return { from: from.toISOString(), to: to.toISOString(), days: to.getDate() }
  }
  if (period === '30d') {
    return { from: new Date(now.getTime() - 30 * 86_400_000).toISOString(), to: now.toISOString(), days: 30 }
  }
  return { from: '2020-01-01T00:00:00Z', to: now.toISOString(), days: 365 }
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

// Fetch all user IDs enrolled in a program (no row limit)
async function buildFilteredUserIds(programId?: string): Promise<string[] | null> {
  if (!programId) return null
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('user_programs')
    .select('user_id')
    .eq('program_id', programId)
    .limit(10000)
  return (data ?? []).map((e: { user_id: string }) => e.user_id)
}

// ── Data functions ─────────────────────────────────────────────────────────────

async function getPrograms(): Promise<Program[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('programs')
    .select('id, name, total_days, price_brl')
    .order('name')
  return (data ?? []) as Program[]
}

async function getHeroData(period: Period, programId?: string, dayNumber?: number) {
  const supabase = createServiceClient()
  const { from, to, days } = getPeriodDates(period)

  // Resolve user IDs for program filter
  const programUserIds = await buildFilteredUserIds(programId)
  if (programUserIds !== null && programUserIds.length === 0) {
    return { totalCost: 0, costPerUser: 0, activeUsers: 0, projected: null,
             dailyRate: 0, byModel: {} as Record<string, { count: number; tokens: number; cost: number }>,
             byType: {} as Record<string, { count: number; tokens: number; cost: number }>,
             students: [] as Array<{ id: string; name: string; tokens: number; cost: number; lastAt: string }>,
             nameMap: {} as Record<string, string | null>, totalRows: 0,
             dailyTrend: [] as Array<{ date: string; cost: number }> }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let usageQ: any = supabase
    .from('token_usage')
    .select('user_id, tokens_consumed, interaction_type, model, input_tokens, output_tokens, created_at')
    .gte('created_at', from)
    .lte('created_at', to)
    .order('created_at', { ascending: false })
    .limit(50000)
  if (programUserIds) usageQ = usageQ.in('user_id', programUserIds)
  if (dayNumber !== undefined) usageQ = usageQ.filter('metadata->>day_number', 'eq', String(dayNumber))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let trendQ: any = supabase
    .from('token_usage')
    .select('tokens_consumed, model, input_tokens, output_tokens, created_at')
    .gte('created_at', new Date(Date.now() - 14 * 86_400_000).toISOString())
    .limit(50000)
  if (programUserIds) trendQ = trendQ.in('user_id', programUserIds)
  if (dayNumber !== undefined) trendQ = trendQ.filter('metadata->>day_number', 'eq', String(dayNumber))

  const [usageRes, profilesRes, trendRes] = await Promise.all([
    usageQ,
    supabase.from('profiles').select('id, full_name'),
    trendQ,
  ])

  const usage   = (usageRes.data ?? []) as unknown as UsageRow[]
  const nameMap = Object.fromEntries(
    (profilesRes.data ?? []).map((p: { id: string; full_name: string | null }) => [p.id, p.full_name])
  )

  const totalCost   = usage.reduce((s, r) => s + computeCostUsd(r.model, r.input_tokens, r.output_tokens, r.tokens_consumed), 0)
  const activeUsers = new Set(usage.map(r => r.user_id)).size
  const costPerUser = activeUsers > 0 ? totalCost / activeUsers : 0
  const dailyRate   = days > 0 ? totalCost / days : 0
  const projected   = period !== 'all' ? dailyRate * 30 : null

  const byModel: Record<string, { count: number; tokens: number; cost: number }> = {}
  const byType:  Record<string, { count: number; tokens: number; cost: number }> = {}
  const byUser:  Record<string, { name: string; tokens: number; cost: number; lastAt: string }> = {}

  for (const r of usage) {
    const mk = r.model ?? 'unknown'
    if (!byModel[mk]) byModel[mk] = { count: 0, tokens: 0, cost: 0 }
    byModel[mk].count++
    byModel[mk].tokens += r.tokens_consumed
    byModel[mk].cost   += computeCostUsd(r.model, r.input_tokens, r.output_tokens, r.tokens_consumed)

    const tk = r.interaction_type
    if (!byType[tk]) byType[tk] = { count: 0, tokens: 0, cost: 0 }
    byType[tk].count++
    byType[tk].tokens += r.tokens_consumed
    byType[tk].cost   += computeCostUsd(r.model, r.input_tokens, r.output_tokens, r.tokens_consumed)

    if (!byUser[r.user_id]) byUser[r.user_id] = { name: nameMap[r.user_id] ?? r.user_id.slice(0, 8) + '…', tokens: 0, cost: 0, lastAt: r.created_at }
    byUser[r.user_id].tokens += r.tokens_consumed
    byUser[r.user_id].cost   += computeCostUsd(r.model, r.input_tokens, r.output_tokens, r.tokens_consumed)
    if (r.created_at > byUser[r.user_id].lastAt) byUser[r.user_id].lastAt = r.created_at
  }

  const students = Object.entries(byUser).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.cost - a.cost)

  // Daily trend — 14 days, same filters
  const trendData = (trendRes.data ?? []) as unknown as UsageRow[]
  const trendMap:  Record<string, number> = {}
  for (const r of trendData) {
    const d = r.created_at.slice(0, 10)
    trendMap[d] = (trendMap[d] ?? 0) + computeCostUsd(r.model, r.input_tokens, r.output_tokens, r.tokens_consumed)
  }
  const dailyTrend: Array<{ date: string; cost: number }> = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10)
    dailyTrend.push({ date: d, cost: trendMap[d] ?? 0 })
  }

  return { totalCost, costPerUser, activeUsers, projected, dailyRate, byModel, byType, students, nameMap, totalRows: usage.length, dailyTrend }
}

async function getProgramStats(period: Period, programId?: string, dayNumber?: number): Promise<ProgramStat[]> {
  const supabase = createServiceClient()
  const { from, to } = getPeriodDates(period)

  // Step 1: fetch enrollments (with program metadata), scoped to specific program if given
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let enrollmentsQ: any = supabase
    .from('user_programs')
    .select('user_id, program_id, started_at, programs(id, name, slug, total_days, price_brl)')
    .limit(10000)
  if (programId) enrollmentsQ = enrollmentsQ.eq('program_id', programId)

  const { data: enrollmentsData } = await enrollmentsQ
  const enrollments = (enrollmentsData ?? []) as Array<{
    user_id: string; program_id: string; started_at: string
    programs: { id: string; name: string; slug: string; total_days: number; price_brl: number | null } | null
  }>

  if (enrollments.length === 0) return []

  // Step 2: collect all relevant user IDs so the usage query is scoped at DB level
  const relevantUserIds = [...new Set(enrollments.map(e => e.user_id))]

  // Step 3: fetch usage scoped to those users + filters
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let usageQ: any = supabase
    .from('token_usage')
    .select('user_id, tokens_consumed, model, input_tokens, output_tokens, created_at')
    .gte('created_at', from)
    .lte('created_at', to)
    .in('user_id', relevantUserIds)
    .limit(50000)
  if (dayNumber !== undefined) usageQ = usageQ.filter('metadata->>day_number', 'eq', String(dayNumber))

  const { data: usageData } = await usageQ
  const usage = (usageData ?? []) as unknown as UsageRow[]

  // Step 4: build lookup maps from enrollment data
  const userProgram: Record<string, string> = {}
  const programMeta: Record<string, { name: string; slug: string; total_days: number; price_brl: number | null }> = {}
  const enrolledCount: Record<string, Set<string>> = {}

  // Sort desc by started_at so first match = most recent enrollment
  const sorted = [...enrollments].sort((a, b) => b.started_at.localeCompare(a.started_at))
  for (const e of sorted) {
    if (!userProgram[e.user_id]) userProgram[e.user_id] = e.program_id
    if (e.programs && !programMeta[e.program_id]) {
      programMeta[e.program_id] = {
        name:      e.programs.name,
        slug:      e.programs.slug,
        total_days:e.programs.total_days,
        price_brl: e.programs.price_brl,
      }
    }
    if (!enrolledCount[e.program_id]) enrolledCount[e.program_id] = new Set()
    enrolledCount[e.program_id].add(e.user_id)
  }

  // Step 5: aggregate usage per program
  const stats: Record<string, { users: Set<string>; tokens: number; cost: number }> = {}
  for (const r of usage) {
    const pId = userProgram[r.user_id]
    if (!pId) continue
    if (!stats[pId]) stats[pId] = { users: new Set(), tokens: 0, cost: 0 }
    stats[pId].users.add(r.user_id)
    stats[pId].tokens += r.tokens_consumed
    stats[pId].cost   += computeCostUsd(r.model, r.input_tokens, r.output_tokens, r.tokens_consumed)
  }

  return Object.entries(stats).map(([pId, v]) => {
    const meta    = programMeta[pId]
    const activeN = v.users.size
    return {
      programId:           pId,
      programName:         meta?.name ?? pId,
      programSlug:         meta?.slug ?? '',
      enrolledUsers:       enrolledCount[pId]?.size ?? 0,
      activeUsersInPeriod: activeN,
      totalTokens:         v.tokens,
      totalCostUsd:        v.cost,
      avgTokensPerUser:    activeN > 0 ? v.tokens / activeN : 0,
      avgCostPerUser:      activeN > 0 ? v.cost   / activeN : 0,
      priceBrl:            meta?.price_brl ?? null,
      totalDays:           meta?.total_days ?? 0,
    }
  }).sort((a, b) => b.totalCostUsd - a.totalCostUsd)
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminTokensPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string
    program?: string
    day?: string
  }>
}) {
  const sp         = await searchParams
  const period     = (sp.period ?? 'this_month') as Period
  const filterProg = sp.program ?? ''
  const filterDay  = sp.day && !isNaN(parseInt(sp.day, 10)) ? parseInt(sp.day, 10) : undefined

  const [programs, heroData, programStats] = await Promise.all([
    getPrograms(),
    getHeroData(period, filterProg || undefined, filterDay),
    getProgramStats(period, filterProg || undefined, filterDay),
  ])

  const { totalCost, costPerUser, activeUsers, projected, byModel, byType, dailyTrend, totalRows } = heroData

  // Helpers for URL building (preserve all active filters)
  function buildUrl(overrides: Record<string, string | undefined>) {
    const q = new URLSearchParams()
    const base = { period, program: filterProg || undefined, day: filterDay !== undefined ? String(filterDay) : undefined }
    const merged = { ...base, ...overrides }
    for (const [k, v] of Object.entries(merged)) {
      if (v) q.set(k, v)
    }
    return `/admin/tokens?${q.toString()}`
  }

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

  const periodLabel = PERIODS.find(p => p.key === period)?.label ?? 'Este mês'
  const maxTrend    = Math.max(...dailyTrend.map(d => d.cost), 0.001)
  const selectedProgram = programs.find(p => p.id === filterProg)
  const hasFilter = !!filterProg || filterDay !== undefined

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px', background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
          Tokens & Pricing
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', margin: '4px 0 0' }}>
          Custo real de IA — para decisões de pricing
        </p>
      </div>

      {/* ── Period tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {PERIODS.map(p => (
          <a
            key={p.key}
            href={buildUrl({ period: p.key })}
            style={{
              padding: '7px 18px', borderRadius: 8,
              fontSize: 13, fontWeight: 500, textDecoration: 'none',
              background: p.key === period ? 'var(--bg4)' : 'transparent',
              color:      p.key === period ? 'var(--text)' : 'var(--text4)',
              border:     p.key === period ? '0.5px solid var(--border2)' : '0.5px solid transparent',
              transition: 'all .12s',
            }}
          >
            {p.label}
          </a>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <form method="GET" action="/admin/tokens" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
        <input type="hidden" name="period" value={period} />

        {/* Program select */}
        <select name="program" style={{ ...selectSt, minWidth: 180 }} defaultValue={filterProg}>
          <option value="">Todos os programas</option>
          {programs.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Day select */}
        <select name="day" style={{ ...selectSt, minWidth: 130 }} defaultValue={filterDay !== undefined ? String(filterDay) : ''}>
          <option value="">Todos os dias</option>
          {Array.from({ length: selectedProgram?.total_days ?? 30 }, (_, i) => i + 1).map(d => (
            <option key={d} value={String(d)}>Dia {d}</option>
          ))}
        </select>

        <button type="submit" style={{
          height: 32, padding: '0 16px', borderRadius: 6,
          background: 'var(--bg4)', border: '0.5px solid var(--border2)',
          color: 'var(--text2)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Aplicar
        </button>

        {hasFilter && (
          <a href={buildUrl({ program: undefined, day: undefined })} style={{ fontSize: 12, color: 'var(--text4)', textDecoration: 'underline', marginLeft: 4 }}>
            Limpar
          </a>
        )}

        {hasFilter && (
          <span style={{ fontSize: 11, color: 'var(--text4)', marginLeft: 4 }}>
            {selectedProgram ? `${selectedProgram.name}` : ''}{filterDay !== undefined ? ` · Dia ${filterDay}` : ''}
          </span>
        )}
      </form>

      {/* ── Hero KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
        {[
          {
            label: 'Custo total',
            value: formatUsd(totalCost),
            sub:   `${totalRows.toLocaleString('pt-BR')} interações · ${periodLabel}`,
            color: 'var(--accent)',
          },
          {
            label: 'Custo / usuário',
            value: formatUsd(costPerUser),
            sub:   `média — ${activeUsers} usuários ativos`,
            color: 'var(--accent)',
          },
          {
            label: 'Usuários ativos',
            value: String(activeUsers),
            sub:   `com pelo menos 1 interação`,
            color: 'var(--text)',
          },
          {
            label: 'Projeção mensal',
            value: projected != null ? `~${formatUsd(projected)}` : '—',
            sub:   projected != null ? 'extrapolado para 30 dias' : 'período completo selecionado',
            color: 'var(--text)',
          },
        ].map(kpi => (
          <div key={kpi.label} style={card}>
            <div style={lbl}>{kpi.label}</div>
            <div style={{ fontSize: 40, fontWeight: 700, color: kpi.color, fontFamily: 'var(--mono)', letterSpacing: '-0.03em', lineHeight: 1.1, margin: '6px 0 4px' }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text4)' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Por programa — sempre visível, mostra todos ou só o filtrado ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={lbl}>
            {filterProg ? `Programa: ${selectedProgram?.name ?? filterProg}` : 'Por programa — custo de IA por usuário'}
          </div>
          {filterProg && (
            <a href={buildUrl({ program: undefined })} style={{ fontSize: 11, color: 'var(--text4)', textDecoration: 'underline' }}>
              ver todos
            </a>
          )}
        </div>
        {programStats.length === 0 ? (
          <div style={{ ...card, color: 'var(--text4)', fontSize: 13 }}>
            Sem dados de uso no período{filterProg ? ' para este programa' : ''}.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
            {programStats.map(ps => {
              const priceUsd    = ps.priceBrl != null ? ps.priceBrl / 5.5 : null
              const aiPct       = priceUsd != null && priceUsd > 0 ? (ps.avgCostPerUser / priceUsd) * 100 : null
              const comfortable = aiPct != null && aiPct < 10
              const warning     = aiPct != null && aiPct >= 10 && aiPct < 25
              const isActive    = ps.programId === filterProg
              return (
                <div key={ps.programId} style={{
                  ...card, display: 'flex', flexDirection: 'column', gap: 14,
                  ...(isActive ? { border: '0.5px solid var(--accent)', boxShadow: '0 0 0 1px var(--accent)' } : {}),
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{ps.programName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 2 }}>
                        {ps.enrolledUsers} alunos · {ps.totalDays} dias
                      </div>
                    </div>
                    {!isActive && (
                      <a href={buildUrl({ program: ps.programId })} style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>
                        filtrar →
                      </a>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text4)', marginBottom: 4 }}>Custo de IA / usuário</div>
                    <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--mono)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                      {formatUsd(ps.avgCostPerUser)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 4 }}>
                      {formatTokens(ps.avgTokensPerUser)} tokens/usuário · {ps.activeUsersInPeriod} ativos no período
                    </div>
                  </div>

                  {aiPct != null && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text4)' }}>
                          IA = {aiPct.toFixed(1)}% do preço
                          {ps.priceBrl != null && ` (R$${ps.priceBrl.toLocaleString('pt-BR')})`}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: '.06em',
                          padding: '2px 8px', borderRadius: 4,
                          background: comfortable ? 'rgba(201,242,61,0.15)' : warning ? 'rgba(255,180,0,0.15)' : 'rgba(255,80,80,0.15)',
                          color:      comfortable ? 'var(--accent)' : warning ? '#e6a800' : '#ff4444',
                        }}>
                          {comfortable ? 'OK' : warning ? 'ATENÇÃO' : 'ALTO'}
                        </span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${Math.min(aiPct, 100)}%`,
                          background: comfortable ? 'var(--accent)' : warning ? '#e6a800' : '#ff4444',
                          borderRadius: 3, transition: 'width .3s',
                        }} />
                      </div>
                    </div>
                  )}

                  <div style={{ paddingTop: 10, borderTop: '0.5px solid var(--border)', display: 'flex', gap: 24 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text4)', marginBottom: 2 }}>Custo total período</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--text)' }}>{formatUsd(ps.totalCostUsd)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text4)', marginBottom: 2 }}>Tokens totais</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--text)' }}>{formatTokens(ps.totalTokens)}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div style={{ fontSize: 11, color: 'var(--text4)', marginTop: 8 }}>
          * Atribuição via matrícula mais recente do usuário. Taxa: R$5,50/USD.
        </div>
      </div>

      {/* ── Tendência diária ── */}
      <div style={{ ...card, marginBottom: 32 }}>
        <div style={{ ...lbl, marginBottom: 16 }}>Tendência — últimos 14 dias</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
          {dailyTrend.map(d => {
            const pct     = maxTrend > 0 ? (d.cost / maxTrend) * 100 : 0
            const isToday = d.date === new Date().toISOString().slice(0, 10)
            return (
              <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div
                  title={`${d.date}: ${formatUsd(d.cost)}`}
                  style={{
                    width: '100%', height: `${Math.max(pct, 3)}%`, minHeight: 3,
                    background: isToday ? 'var(--accent)' : d.cost > 0 ? 'var(--bg4)' : 'var(--bg3)',
                    borderRadius: '3px 3px 0 0', transition: 'height .2s',
                  }}
                />
                <div style={{ fontSize: 9, color: 'var(--text4)', whiteSpace: 'nowrap', transform: 'rotate(-45deg)', transformOrigin: 'top center', marginTop: 4 }}>
                  {d.date.slice(5)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Por modelo + tipo ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <div style={card}>
          <div style={{ ...lbl, marginBottom: 12 }}>Por modelo</div>
          <table style={tbl}>
            <thead><tr>
              {['Modelo', 'Interações', 'Tokens', 'Custo'].map((h, i) => (
                <th key={h} style={{ ...th, textAlign: i === 3 ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {Object.entries(byModel).sort((a, b) => b[1].cost - a[1].cost).map(([m, v]) => (
                <tr key={m}>
                  <td style={td}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{MODEL_SHORT[m] ?? m}</div>
                    {ANTHROPIC_PRICING[m] && (
                      <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 1 }}>
                        ${ANTHROPIC_PRICING[m].input}/M in · ${ANTHROPIC_PRICING[m].output}/M out
                      </div>
                    )}
                  </td>
                  <td style={{ ...td, fontFamily: 'var(--mono)' }}>{v.count.toLocaleString('pt-BR')}</td>
                  <td style={{ ...td, fontFamily: 'var(--mono)' }}>{formatTokens(v.tokens)}</td>
                  <td style={{ ...td, textAlign: 'right', fontFamily: 'var(--mono)', color: 'var(--accent)' }}>{formatUsd(v.cost)}</td>
                </tr>
              ))}
              {Object.keys(byModel).length === 0 && (
                <tr><td colSpan={4} style={{ ...td, color: 'var(--text4)', textAlign: 'center', padding: '20px 0' }}>Sem dados</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={card}>
          <div style={{ ...lbl, marginBottom: 12 }}>Por tipo de interação</div>
          <table style={tbl}>
            <thead><tr>
              {['Tipo', 'Interações', 'Tokens', 'Custo'].map((h, i) => (
                <th key={h} style={{ ...th, textAlign: i === 3 ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {Object.entries(byType).sort((a, b) => b[1].cost - a[1].cost).map(([t, v]) => (
                <tr key={t}>
                  <td style={td}>{INTERACTION_LABELS[t] ?? t}</td>
                  <td style={{ ...td, fontFamily: 'var(--mono)' }}>{v.count.toLocaleString('pt-BR')}</td>
                  <td style={{ ...td, fontFamily: 'var(--mono)' }}>{formatTokens(v.tokens)}</td>
                  <td style={{ ...td, textAlign: 'right', fontFamily: 'var(--mono)', color: 'var(--accent)' }}>{formatUsd(v.cost)}</td>
                </tr>
              ))}
              {Object.keys(byType).length === 0 && (
                <tr><td colSpan={4} style={{ ...td, color: 'var(--text4)', textAlign: 'center', padding: '20px 0' }}>Sem dados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Link para log ── */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Log detalhado</div>
          <div style={{ fontSize: 12, color: 'var(--text4)', marginTop: 2 }}>
            Todos os registros de consumo com filtros por usuário, modelo, tipo e data
          </div>
        </div>
        <a
          href={`/admin/tokens/log?period=${period}${filterProg ? `&program=${filterProg}` : ''}${filterDay !== undefined ? `&day=${filterDay}` : ''}`}
          style={{
            height: 36, padding: '0 20px', borderRadius: 6, display: 'inline-flex', alignItems: 'center',
            background: 'var(--bg4)', border: '0.5px solid var(--border2)',
            color: 'var(--text2)', fontSize: 13, fontWeight: 500, textDecoration: 'none',
          }}
        >
          Ver log →
        </a>
      </div>

    </div>
  )
}
