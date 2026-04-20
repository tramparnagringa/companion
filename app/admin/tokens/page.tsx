import { createServiceClient } from '@/lib/supabase/service'
import { computeCostUsd, formatUsd, ANTHROPIC_PRICING } from '@/lib/anthropic/pricing'

// ── Types ────────────────────────────────────────────────────────────────────

interface UsageRow {
  user_id: string
  tokens_consumed: number
  interaction_type: string
  model: string | null
  input_tokens: number | null
  output_tokens: number | null
  created_at: string
}

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getData() {
  const supabase = createServiceClient()

  // token_usage.user_id → auth.users (not profiles), so we join profiles separately
  const [usageRes, profilesRes] = await Promise.all([
    supabase
      .from('token_usage')
      .select('user_id, tokens_consumed, interaction_type, model, input_tokens, output_tokens, created_at')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name'),
  ])

  const usage    = (usageRes.data ?? []) as unknown as UsageRow[]
  const nameMap  = Object.fromEntries((profilesRes.data ?? []).map(p => [p.id, p.full_name as string | null]))

  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const thisMonth  = usage.filter(r => r.created_at >= monthStart)

  const totalCost  = usage.reduce((s, r) => s + computeCostUsd(r.model, r.input_tokens, r.output_tokens, r.tokens_consumed), 0)
  const monthCost  = thisMonth.reduce((s, r) => s + computeCostUsd(r.model, r.input_tokens, r.output_tokens, r.tokens_consumed), 0)
  const monthUsers = new Set(thisMonth.map(r => r.user_id)).size
  const monthCount = thisMonth.length

  // By model
  const byModel: Record<string, { count: number; tokens: number; cost: number }> = {}
  for (const r of usage) {
    const key = r.model ?? 'unknown'
    if (!byModel[key]) byModel[key] = { count: 0, tokens: 0, cost: 0 }
    byModel[key].count  += 1
    byModel[key].tokens += r.tokens_consumed
    byModel[key].cost   += computeCostUsd(r.model, r.input_tokens, r.output_tokens, r.tokens_consumed)
  }

  // By interaction type
  const byType: Record<string, { count: number; tokens: number; cost: number }> = {}
  for (const r of usage) {
    const key = r.interaction_type
    if (!byType[key]) byType[key] = { count: 0, tokens: 0, cost: 0 }
    byType[key].count  += 1
    byType[key].tokens += r.tokens_consumed
    byType[key].cost   += computeCostUsd(r.model, r.input_tokens, r.output_tokens, r.tokens_consumed)
  }

  // By student
  const byUser: Record<string, { name: string; tokens: number; cost: number; lastAt: string }> = {}
  for (const r of usage) {
    if (!byUser[r.user_id]) {
      byUser[r.user_id] = {
        name:   nameMap[r.user_id] ?? r.user_id.slice(0, 8) + '…',
        tokens: 0, cost: 0, lastAt: r.created_at,
      }
    }
    byUser[r.user_id].tokens += r.tokens_consumed
    byUser[r.user_id].cost   += computeCostUsd(r.model, r.input_tokens, r.output_tokens, r.tokens_consumed)
    if (r.created_at > byUser[r.user_id].lastAt) byUser[r.user_id].lastAt = r.created_at
  }

  const students = Object.entries(byUser)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.cost - a.cost)

  return { totalCost, monthCost, monthUsers, monthCount, byModel, byType, students, totalRows: usage.length }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const INTERACTION_LABELS: Record<string, string> = {
  chat:                'Chat livre',
  mentor:              'Mentor IA (aluno)',
  day_activity:        'Atividade de dia',
  cv_rewrite:          'Reescrita de CV',
  day_init:            'Início de dia',
  mentor_chat:         'Chat do mentor (dossier)',
  mentor_student_chat: 'Chat do mentor (ações)',
  job_analysis:        'Análise de vaga',
  interview_prep:      'Prep de entrevista',
  program_generation:  'Geração de programa (admin)',
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminTokensPage() {
  const { totalCost, monthCost, monthUsers, monthCount, byModel, byType, students, totalRows } = await getData()

  const sectionLabel: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, letterSpacing: '.08em',
    textTransform: 'uppercase', color: 'var(--text4)', marginBottom: 10,
  }
  const card: React.CSSProperties = {
    background: 'var(--bg2)', border: '0.5px solid var(--border)',
    borderRadius: 'var(--r)', padding: '16px 20px',
  }
  const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' }
  const cellStyle: React.CSSProperties  = {
    padding: '8px 12px', fontSize: 12, color: 'var(--text2)',
    borderBottom: '0.5px solid var(--border)',
  }
  const headerCell: React.CSSProperties = {
    ...cellStyle, color: 'var(--text4)', fontWeight: 500,
    fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em',
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: 'var(--bg)' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Tokens & Custos</h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', margin: '4px 0 0' }}>
          Consumo real e custo estimado baseado nos preços da Anthropic
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 28 }}>
        {[
          { label: 'Custo este mês',  value: formatUsd(monthCost),  sub: `${monthCount} interações` },
          { label: 'Custo total',     value: formatUsd(totalCost),  sub: `${totalRows} interações` },
          { label: 'Usuários ativos', value: String(monthUsers),    sub: 'este mês' },
          { label: 'Custo médio',     value: totalRows > 0 ? formatUsd(totalCost / totalRows) : '$0', sub: 'por interação' },
        ].map(kpi => (
          <div key={kpi.label} style={card}>
            <div style={{ fontSize: 11, color: 'var(--text4)', marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--mono)', marginBottom: 2 }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text4)' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* By model + by type */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={card}>
          <div style={sectionLabel}>Por modelo</div>
          <table style={tableStyle}>
            <thead>
              <tr>
                {['Modelo', 'Interações', 'Tokens', 'Custo'].map((h, i) => (
                  <th key={h} style={{ ...headerCell, textAlign: i === 3 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(byModel)
                .sort((a, b) => b[1].cost - a[1].cost)
                .map(([model, v]) => {
                  const pricing = ANTHROPIC_PRICING[model]
                  return (
                    <tr key={model}>
                      <td style={cellStyle}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{model}</div>
                        {pricing && (
                          <div style={{ fontSize: 10, color: 'var(--text4)', marginTop: 1 }}>
                            ${pricing.input}/M in · ${pricing.output}/M out
                          </div>
                        )}
                      </td>
                      <td style={{ ...cellStyle, fontFamily: 'var(--mono)' }}>{v.count.toLocaleString('pt-BR')}</td>
                      <td style={{ ...cellStyle, fontFamily: 'var(--mono)' }}>{formatTokens(v.tokens)}</td>
                      <td style={{ ...cellStyle, textAlign: 'right', fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
                        {formatUsd(v.cost)}
                      </td>
                    </tr>
                  )
                })}
              {Object.keys(byModel).length === 0 && (
                <tr><td colSpan={4} style={{ ...cellStyle, color: 'var(--text4)', textAlign: 'center', padding: '20px 0' }}>Sem dados</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={card}>
          <div style={sectionLabel}>Por tipo de interação</div>
          <table style={tableStyle}>
            <thead>
              <tr>
                {['Tipo', 'Interações', 'Tokens', 'Custo'].map((h, i) => (
                  <th key={h} style={{ ...headerCell, textAlign: i === 3 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(byType)
                .sort((a, b) => b[1].cost - a[1].cost)
                .map(([type, v]) => (
                  <tr key={type}>
                    <td style={cellStyle}>{INTERACTION_LABELS[type] ?? type}</td>
                    <td style={{ ...cellStyle, fontFamily: 'var(--mono)' }}>{v.count.toLocaleString('pt-BR')}</td>
                    <td style={{ ...cellStyle, fontFamily: 'var(--mono)' }}>{formatTokens(v.tokens)}</td>
                    <td style={{ ...cellStyle, textAlign: 'right', fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
                      {formatUsd(v.cost)}
                    </td>
                  </tr>
                ))}
              {Object.keys(byType).length === 0 && (
                <tr><td colSpan={4} style={{ ...cellStyle, color: 'var(--text4)', textAlign: 'center', padding: '20px 0' }}>Sem dados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* By student */}
      <div style={{ ...card, marginBottom: 32 }}>
        <div style={sectionLabel}>Por aluno</div>
        <table style={tableStyle}>
          <thead>
            <tr>
              {['Aluno', 'Tokens', 'Custo estimado', 'Última interação'].map((h, i) => (
                <th key={h} style={{ ...headerCell, textAlign: i === 2 ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td style={cellStyle}>
                  <a href={`/admin/students/${s.id}`} style={{ color: 'var(--text2)', textDecoration: 'none' }}>
                    {s.name}
                  </a>
                </td>
                <td style={{ ...cellStyle, fontFamily: 'var(--mono)' }}>{formatTokens(s.tokens)}</td>
                <td style={{ ...cellStyle, textAlign: 'right', fontFamily: 'var(--mono)', color: 'var(--accent)' }}>
                  {formatUsd(s.cost)}
                </td>
                <td style={{ ...cellStyle, color: 'var(--text4)' }}>{formatDate(s.lastAt)}</td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...cellStyle, color: 'var(--text4)', textAlign: 'center', padding: 20 }}>
                  Nenhum uso registrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}
