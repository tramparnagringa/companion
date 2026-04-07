import { createServerClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'

export default async function ProfilePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: candidate },
    { data: keywords },
    { data: jobs },
    { data: userMeta },
    { data: days },
    { data: activeCV },
  ] = await Promise.all([
    supabase.from('candidate_profiles').select('*').eq('user_id', user!.id).single(),
    supabase.from('keywords').select('word, frequency').eq('user_id', user!.id).order('frequency', { ascending: false }).limit(40),
    supabase.from('jobs').select('status').eq('user_id', user!.id),
    supabase.from('profiles').select('full_name').eq('id', user!.id).single(),
    supabase.from('day_activities').select('day_number, status').eq('user_id', user!.id).order('day_number'),
    supabase.from('cv_versions').select('content').eq('user_id', user!.id).eq('is_active', true).single(),
  ])

  const completionFields = candidate ? [
    candidate.target_role, candidate.seniority, candidate.tech_stack?.length,
    candidate.target_regions?.length, candidate.value_proposition,
    candidate.linkedin_headline, candidate.linkedin_about,
    candidate.ai_fluency_statements?.length,
  ] : []
  const completion = completionFields.length
    ? Math.round(completionFields.filter(Boolean).length / completionFields.length * 100)
    : 0

  const donedays   = days?.filter(d => d.status === 'done').length ?? 0
  const totalJobs  = jobs?.length ?? 0
  const appliedJobs = jobs?.filter(j => ['applied','interviewing','offer'].includes(j.status)).length ?? 0
  const topKeywords = keywords?.slice(0, 20) ?? []

  const cvName = (activeCV?.content as { personal?: { full_name?: string } } | null)?.personal?.full_name
  const displayName = cvName ?? userMeta?.full_name ?? user?.email?.split('@')[0] ?? '?'
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title="AI Profile" subtitle="Seu dossier de candidato" />

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {!candidate ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: 300, gap: 10, color: 'var(--text3)',
          }}>
            <div style={{ fontSize: 32 }}>◎</div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Dossier vazio</div>
            <div style={{ fontSize: 12, color: 'var(--text4)', textAlign: 'center', maxWidth: 240 }}>
              Complete o Dia 1 com o assistente para criar seu perfil.
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 860, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* ── HERO CARD ── */}
            <div style={{
              background: 'var(--bg2)', border: '0.5px solid var(--border)',
              borderRadius: 'var(--r)', padding: '22px 24px',
              display: 'grid', gridTemplateColumns: '1fr auto', gap: 20,
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--accent-dim)', border: '1.5px solid rgba(228,253,139,.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 700, color: 'var(--accent)',
                }}>
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                    {displayName}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {candidate.target_role && (
                      <Pill text={candidate.target_role} color="var(--accent)" bg="var(--accent-dim)" />
                    )}
                    {candidate.seniority && (
                      <Pill text={candidate.seniority} color="var(--text2)" bg="var(--bg3)" />
                    )}
                    {candidate.work_preference && (
                      <Pill
                        text={candidate.work_preference === 'remote' ? '🌍 Remoto global' : candidate.work_preference === 'relocation' ? '✈️ Relocação' : '🌍 Remoto / Relocação'}
                        color="var(--purple)"
                        bg="var(--bg3)"
                        border="rgba(168,85,247,.25)"
                      />
                    )}
                    {candidate.years_experience && (
                      <Pill text={`${candidate.years_experience} anos exp.`} color="var(--text3)" bg="var(--bg3)" />
                    )}
                  </div>
                </div>
              </div>

              {/* Completion */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <svg width={64} height={64} viewBox="0 0 64 64">
                  <circle cx={32} cy={32} r={26} fill="none" stroke="var(--bg3)" strokeWidth={4} />
                  <circle
                    cx={32} cy={32} r={26} fill="none"
                    stroke={completion >= 80 ? '#4ade80' : completion >= 40 ? 'var(--accent)' : 'var(--border2)'}
                    strokeWidth={4}
                    strokeDasharray={`${(completion / 100) * 2 * Math.PI * 26} ${2 * Math.PI * 26}`}
                    strokeLinecap="round"
                    transform="rotate(-90 32 32)"
                    style={{ transition: 'stroke-dasharray .6s ease' }}
                  />
                  <text x={32} y={36} textAnchor="middle" fontSize={13} fontWeight={700}
                    fill={completion >= 80 ? '#4ade80' : completion >= 40 ? 'var(--accent)' : 'var(--text3)'}>
                    {completion}%
                  </text>
                </svg>
                <span style={{ fontSize: 10, color: 'var(--text4)', letterSpacing: '.05em' }}>DOSSIER</span>
              </div>
            </div>

            {/* ── STATS ROW ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              <StatCard
                value={donedays}
                total={30}
                label="Dias concluídos"
                color="#4ade80"
                showBar
              />
              <StatCard
                value={keywords?.length ?? 0}
                label="Keywords no banco"
                color="var(--accent)"
              />
              <StatCard
                value={totalJobs}
                label="Vagas no board"
                color="var(--purple)"
              />
              <StatCard
                value={appliedJobs}
                label="Candidaturas"
                color="var(--teal, #2dd4bf)"
              />
            </div>

            {/* ── 2-COL GRID ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

              {/* Target Market */}
              <Card title="Mercado-Alvo">
                {candidate.target_regions?.length ? (
                  <FieldBlock label="Regiões">
                    <TagRow tags={candidate.target_regions} color="#2dd4bf" />
                  </FieldBlock>
                ) : null}
                {candidate.target_sectors?.length ? (
                  <FieldBlock label="Setores">
                    <TagRow tags={candidate.target_sectors} color="var(--text2)" />
                  </FieldBlock>
                ) : null}
                {!candidate.target_regions?.length && !candidate.target_sectors?.length && (
                  <Empty text="Definir no Dia 2" />
                )}
              </Card>

              {/* Tech Stack */}
              <Card title="Tech Stack">
                {candidate.tech_stack?.length ? (
                  <TagRow tags={candidate.tech_stack} color="var(--accent)" />
                ) : (
                  <Empty text="Definir no Dia 3" />
                )}
              </Card>
            </div>

            {/* ── VALUE PROPOSITION ── */}
            {candidate.value_proposition ? (
              <Card title="Proposta de Valor">
                <div style={{
                  fontSize: 14, lineHeight: 1.7, color: 'var(--text)',
                  borderLeft: '2px solid var(--accent)', paddingLeft: 16,
                  fontStyle: 'italic',
                }}>
                  "{candidate.value_proposition}"
                </div>
                {candidate.value_proposition_alternatives?.length ? (
                  <div style={{ marginTop: 14 }}>
                    <FieldLabel>Variações</FieldLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {candidate.value_proposition_alternatives.map((alt, i) => (
                        <div key={i} style={{
                          fontSize: 12, color: 'var(--text3)', lineHeight: 1.6,
                          paddingLeft: 14, borderLeft: '0.5px solid var(--border2)',
                        }}>
                          {alt}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </Card>
            ) : (
              <Card title="Proposta de Valor">
                <Empty text="Construir no Dia 6" />
              </Card>
            )}

            {/* ── LINKEDIN ── */}
            {(candidate.linkedin_headline || candidate.linkedin_about) && (
              <Card title="LinkedIn">
                {candidate.linkedin_headline && (
                  <div style={{ marginBottom: 14 }}>
                    <FieldLabel>Headline</FieldLabel>
                    <div style={{
                      fontSize: 13, fontWeight: 500, color: 'var(--text)', lineHeight: 1.5,
                      padding: '10px 13px', background: 'var(--bg3)', borderRadius: 6,
                      border: '0.5px solid var(--border2)', marginTop: 5,
                    }}>
                      {candidate.linkedin_headline}
                    </div>
                  </div>
                )}
                {candidate.linkedin_about && (
                  <>
                    <FieldLabel>About</FieldLabel>
                    <div style={{
                      fontSize: 12, color: 'var(--text2)', lineHeight: 1.8, marginTop: 5,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {candidate.linkedin_about}
                    </div>
                  </>
                )}
              </Card>
            )}

            {/* ── AI FLUENCY + KEYWORDS side by side ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

              <Card title="AI Fluency">
                {candidate.ai_fluency_statements?.length ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {candidate.ai_fluency_statements.map((s, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: 9, padding: '8px 11px',
                        background: 'var(--bg3)', borderRadius: 6,
                        border: '0.5px solid rgba(168,85,247,.2)',
                      }}>
                        <span style={{ color: 'var(--purple)', fontSize: 11, flexShrink: 0, marginTop: 1 }}>✦</span>
                        <span style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.6 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty text="Construir no Dia 8" />
                )}
              </Card>

              <Card title={`Keywords (${keywords?.length ?? 0})`}>
                {topKeywords.length ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {topKeywords.map(kw => (
                      <div key={kw.word} style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '3px 9px', borderRadius: 20,
                        background: 'var(--bg3)', border: '0.5px solid var(--border2)',
                      }}>
                        <span style={{ fontSize: 11, color: 'var(--text2)' }}>{kw.word}</span>
                        {(kw.frequency ?? 1) > 1 && (
                          <span style={{
                            fontSize: 9, color: 'var(--accent)', fontWeight: 700,
                            background: 'var(--accent-dim)', padding: '0 4px',
                            borderRadius: 8, lineHeight: '14px',
                          }}>
                            {kw.frequency}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty text="Coletar no Dia 4–5" />
                )}
              </Card>
            </div>

            {/* ── SALARY ── */}
            {(candidate.salary_min || candidate.salary_max) && (
              <Card title="Faixa Salarial">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {candidate.salary_min && (
                    <div style={{
                      padding: '14px 16px', background: 'var(--bg3)',
                      borderRadius: 6, border: '0.5px solid var(--border2)',
                    }}>
                      <div style={{ fontSize: 10, color: 'var(--text4)', marginBottom: 5 }}>MÍNIMO</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#4ade80' }}>
                        {fmt(candidate.salary_min, candidate.salary_currency)}
                      </div>
                    </div>
                  )}
                  {candidate.salary_max && (
                    <div style={{
                      padding: '14px 16px', background: 'var(--bg3)',
                      borderRadius: 6, border: '0.5px solid var(--border2)',
                    }}>
                      <div style={{ fontSize: 10, color: 'var(--text4)', marginBottom: 5 }}>TARGET</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
                        {fmt(candidate.salary_max, candidate.salary_currency)}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

// ── Primitives ──────────────────────────────────────────────────────────────

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '0.5px solid var(--border)',
      borderRadius: 'var(--r)', overflow: 'hidden',
    }}>
      <div style={{
        padding: '9px 14px', borderBottom: '0.5px solid var(--border)',
        fontSize: 10, fontWeight: 600, letterSpacing: '.1em',
        textTransform: 'uppercase', color: 'var(--text3)',
      }}>
        {title}
      </div>
      <div style={{ padding: '14px 16px' }}>{children}</div>
    </div>
  )
}

function StatCard({ value, total, label, color, showBar }: {
  value: number; total?: number; label: string; color: string; showBar?: boolean
}) {
  const pct = total ? Math.min((value / total) * 100, 100) : 0
  return (
    <div style={{
      background: 'var(--bg2)', border: '0.5px solid var(--border)',
      borderRadius: 'var(--rsm)', padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {total && (
        <div style={{ fontSize: 10, color: 'var(--text4)' }}>de {total}</div>
      )}
      {showBar && (
        <div style={{ height: 3, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
        </div>
      )}
      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{label}</div>
    </div>
  )
}

function Pill({ text, color, bg, border }: { text: string; color: string; bg: string; border?: string }) {
  return (
    <span style={{
      fontSize: 12, color, background: bg, padding: '3px 10px',
      borderRadius: 20, border: `0.5px solid ${border ?? color + '33'}`,
    }}>
      {text}
    </span>
  )
}

function TagRow({ tags, color }: { tags: string[]; color: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {tags.map(t => (
        <span key={t} style={{
          fontSize: 11, color, background: color + '18',
          padding: '3px 9px', borderRadius: 20,
          border: `0.5px solid ${color}33`,
        }}>
          {t}
        </span>
      ))}
    </div>
  )
}

function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, color: 'var(--text4)', marginBottom: 6, letterSpacing: '.06em', textTransform: 'uppercase' }}>
      {children}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{ fontSize: 12, color: 'var(--text4)', fontStyle: 'italic' }}>{text}</div>
  )
}

function fmt(n: number, currency?: string | null) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: currency ?? 'USD', maximumFractionDigits: 0,
  }).format(n)
}
