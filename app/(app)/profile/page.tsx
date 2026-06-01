import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { getStreak } from '@/lib/days'

export const metadata: Metadata = { title: 'Dossier' }

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
    { data: actionNotes },
  ] = await Promise.all([
    supabase.from('candidate_profiles').select('*').eq('user_id', user!.id).single(),
    supabase.from('keywords').select('word, frequency').eq('user_id', user!.id).order('frequency', { ascending: false }).limit(40),
    supabase.from('jobs').select('status').eq('user_id', user!.id),
    supabase.from('profiles').select('full_name, avatar_url').eq('id', user!.id).single(),
    supabase.from('day_activities').select('day_number, status, completed_at').eq('user_id', user!.id).order('day_number'),
    supabase.from('cv_versions').select('content').eq('user_id', user!.id).eq('is_active', true).single(),
    (supabase as any).from('action_notes').select('id').eq('user_id', user!.id),
  ])

  const streak      = getStreak(days ?? [])
  const donedays    = days?.filter(d => d.status === 'done').length ?? 0
  const totalJobs   = jobs?.length ?? 0
  const appliedJobs = jobs?.filter(j => ['applied','interviewing','offer'].includes(j.status ?? '')).length ?? 0
  const plansCount  = (actionNotes as { id: string }[] | null)?.length ?? 0

  type CVPersonal = { full_name?: string; position?: string }
  const cvPersonal  = (activeCV?.content as { personal?: CVPersonal } | null)?.personal
  const cvName      = cvPersonal?.full_name
  const cvPosition  = cvPersonal?.position
  const displayName = cvName ?? userMeta?.full_name ?? user?.email?.split('@')[0] ?? '?'
  const avatarUrl = (userMeta as { avatar_url?: string } | null)?.avatar_url
    ?? (user?.user_metadata?.avatar_url as string | undefined)

  // ── Strengths & Gaps ──────────────────────────────────────────
  const strengths: string[] = []
  const gaps: { text: string; day: string }[] = []

  if (candidate) {
    if (candidate.value_proposition)
      strengths.push('Proposta de valor elaborada')
    if (candidate.linkedin_headline)
      strengths.push('Headline do LinkedIn pronta')
    if (candidate.linkedin_about)
      strengths.push('About do LinkedIn redigido')
    if ((keywords?.length ?? 0) >= 5)
      strengths.push(`${keywords!.length} keywords mapeadas`)
    if (candidate.target_regions?.length)
      strengths.push(`Mercado-alvo definido`)
    if (candidate.tech_stack?.length)
      strengths.push(`${candidate.tech_stack.length} habilidades documentadas`)
    if (appliedJobs > 0)
      strengths.push(`${appliedJobs} candidatura${appliedJobs !== 1 ? 's' : ''} ativa${appliedJobs !== 1 ? 's' : ''}`)
    if (candidate.salary_min || candidate.salary_max)
      strengths.push('Âncora salarial definida')
    if (candidate.value_proposition_alternatives?.length)
      strengths.push('Variações de pitch prontas')
    if (plansCount > 0)
      strengths.push(`${plansCount} plano${plansCount !== 1 ? 's' : ''} de ação`)

    if (!candidate.value_proposition)
      gaps.push({ text: 'Elaborar proposta de valor', day: 'Dia 6' })
    if (!candidate.linkedin_headline)
      gaps.push({ text: 'Criar headline do LinkedIn', day: 'Dia 8' })
    if (!candidate.linkedin_about)
      gaps.push({ text: 'Escrever About do LinkedIn', day: 'Dia 9' })
    if (!candidate.tech_stack?.length)
      gaps.push({ text: 'Mapear habilidades e stack', day: 'Dia 3' })
    if (!candidate.target_regions?.length)
      gaps.push({ text: 'Definir mercado-alvo e regiões', day: 'Dia 2' })
    if ((keywords?.length ?? 0) < 5)
      gaps.push({ text: 'Construir banco de keywords', day: 'Dias 4–5' })
    if (!candidate.salary_min && !candidate.salary_max)
      gaps.push({ text: 'Definir âncora salarial', day: 'Dia 27' })
  }

  // ── Progress metrics ─────────────────────────────────────────
  const coreTotal = 7   // number of possible gap items
  const coreDone  = coreTotal - gaps.length
  const corePct   = Math.round((coreDone / coreTotal) * 100)
  const progressSentiment =
    coreDone >= 7 ? 'Dossier completo — você está pronto 🎯'
    : coreDone >= 5 ? 'Ótimo progresso, falta pouco'
    : coreDone >= 3 ? 'Fundações no lugar — continue assim'
    : 'Primeiros passos dados'

  const workPrefLabel = candidate?.work_preference === 'remote'
    ? '🌐 Remoto global'
    : candidate?.work_preference === 'relocation'
    ? '✈️ Relocação'
    : candidate?.work_preference === 'both'
    ? '🌐 Remoto / Relocação'
    : null

  const identityParts = [
    candidate?.target_role,
    candidate?.seniority,
    candidate?.years_experience ? `${candidate.years_experience} anos` : null,
    workPrefLabel,
  ].filter(Boolean)

  const topKeywords = keywords?.slice(0, 28) ?? []
  const maxFreq = Math.max(...(topKeywords.map(k => k.frequency ?? 1)), 1)

  const breadcrumb = (
    <div className="topbar-crumb">
      <strong>Profile</strong>
    </div>
  )

  return (
    <div className="page-col">
      <Topbar title={breadcrumb} streak={streak} />

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>

        {!candidate ? (
          <div className="dossier-band" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: 300, gap: 12, paddingTop: 56,
          }}>
            <div style={{ fontSize: 36, opacity: 0.3 }}>◎</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tng-ink-2)' }}>Dossier ainda vazio</div>
            <div style={{ fontSize: 13, color: 'var(--tng-ink-3)', textAlign: 'center', maxWidth: 260, lineHeight: 1.7 }}>
              Complete o Dia 1 com o assistente — seu perfil será montado automaticamente a partir das suas conversas.
            </div>
          </div>
        ) : (<>

          {/* ── BAND 1 · HERO ───────────────────────────────── */}
          <Band first>
            {(() => {
              const introText = candidate.value_proposition_alternatives?.[0] ?? candidate.value_proposition ?? null
              return (
                <div>
                  {/* Avatar — only if exists */}
                  {avatarUrl && (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      width={94}
                      height={94}
                      style={{
                        width: 94, height: 94, borderRadius: 999,
                        objectFit: 'cover',
                        border: '2px solid var(--tng-rule)',
                        display: 'block',
                        marginBottom: 28,
                      }}
                    />
                  )}

                  {/* Name */}
                  <h1 style={{
                    fontSize: 40, fontFamily: 'var(--tng-font-display)',
                    fontWeight: 700, color: 'var(--tng-ink)', lineHeight: 1.1,
                    letterSpacing: '-0.025em', margin: '0 0 20px',
                  }}>
                    {displayName}
                  </h1>

                  {/* Intro tagline — best alternative or main VP */}
                  {introText && (
                    <div style={{
                      fontSize: 22, fontFamily: 'var(--tng-font-serif)', fontStyle: 'italic',
                      color: 'var(--tng-ink-2)', lineHeight: 1.6, marginBottom: 28,
                    }}>
                      {renderRichText(introText)}
                    </div>
                  )}

                  {/* Identity meta */}
                  {identityParts.length > 0 && (
                    <div style={{
                      fontSize: 13, color: 'var(--tng-ink-3)', marginBottom: 20,
                      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px 4px',
                    }}>
                      {identityParts.map((p, i) => (
                        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {i > 0 && <span style={{ color: 'var(--tng-mute)', fontSize: 13, lineHeight: 1 }}>·</span>}
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Region + sector pills */}
                  {((candidate.target_sectors?.length ?? 0) > 0 || (candidate.target_regions?.length ?? 0) > 0) && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
                      {candidate.target_regions?.map(r => (
                        <span key={r} style={{
                          fontSize: 11, padding: '6px 14px', borderRadius: 999,
                          background: 'var(--tng-purple-100)', color: 'var(--tng-purple-700)',
                          border: '1px solid var(--tng-purple-300)',
                          fontFamily: 'var(--tng-font-mono)', fontWeight: 700, letterSpacing: '0.08em',
                        }}>{r}</span>
                      ))}
                      {candidate.target_sectors?.map(s => (
                        <span key={s} style={{
                          fontSize: 11, padding: '6px 14px', borderRadius: 999,
                          background: 'var(--tng-bone)', color: 'var(--tng-ink-2)',
                          border: '1px solid var(--tng-rule)',
                          fontFamily: 'var(--tng-font-mono)', fontWeight: 700, letterSpacing: '0.08em',
                        }}>{s}</span>
                      ))}
                    </div>
                  )}

                  {/* Mini stats — design system class */}
                  <div className="today-mini-stats">
                    <span><strong>{donedays}</strong> dias</span>
                    {(keywords?.length ?? 0) > 0 && <><span className="today-mini-sep">·</span><span><strong>{keywords!.length}</strong> keywords</span></>}
                    {totalJobs > 0 && <><span className="today-mini-sep">·</span><span><strong>{totalJobs}</strong> vaga{totalJobs !== 1 ? 's' : ''}</span></>}
                    {plansCount > 0 && <><span className="today-mini-sep">·</span><span><strong>{plansCount}</strong> plano{plansCount !== 1 ? 's' : ''}</span></>}
                    {streak > 1 && <><span className="today-mini-sep">·</span><span>🔥 <strong>{streak}</strong> dias seguidos</span></>}
                  </div>
                </div>
              )
            })()}
          </Band>

          {/* ── BAND 2 · PROPOSTA DE VALOR ─── bone ─────────── */}
          <Band bg="var(--tng-bone)">
            <Section label="Proposta de Valor" labelColor="var(--tng-coral-text)" labelBg="rgba(255,107,53,0.11)">
              {candidate.value_proposition ? (<>
                <blockquote style={{
                  fontSize: 32, fontFamily: 'var(--tng-font-serif)', fontStyle: 'italic',
                  color: 'var(--tng-ink)', lineHeight: 1.45, margin: 0,
                  borderLeft: '3px solid var(--tng-coral)', paddingLeft: 28,
                }}>
                  &ldquo;{renderRichText(candidate.value_proposition)}&rdquo;
                </blockquote>
                {candidate.value_proposition_alternatives && candidate.value_proposition_alternatives.length > 0 && (
                  <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ fontSize: 11, color: 'var(--tng-ink-3)', fontFamily: 'var(--tng-font-mono)', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                      Variações
                    </div>
                    {candidate.value_proposition_alternatives.map((alt, i) => (
                      <div key={i} style={{
                        fontSize: 20, color: 'var(--tng-ink-2)', lineHeight: 1.6,
                        paddingLeft: 20, borderLeft: '2px solid var(--tng-rule)',
                        fontFamily: 'var(--tng-font-serif)', fontStyle: 'italic',
                      }}>{renderRichText(alt)}</div>
                    ))}
                  </div>
                )}
              </>) : (
                <div style={{ fontSize: 16, color: 'var(--tng-ink-3)', lineHeight: 1.7, fontStyle: 'italic', fontFamily: 'var(--tng-font-serif)' }}>
                  Ainda não elaborada — a peça mais importante do seu posicionamento. Será construída no Dia 6.
                </div>
              )}
            </Section>
          </Band>

          {/* ── BAND 3 · O QUE VOCÊ FAZ · habilidades + keywords ─── paper ── */}
          {(candidate.tech_stack?.length || topKeywords.length > 0) && (
            <Band bg="var(--tng-paper)">
              {candidate.tech_stack && candidate.tech_stack.length > 0 && (
                <Section label="Habilidades" labelBg="rgba(0,0,0,0.06)">
                  <div style={{ fontSize: 18, color: 'var(--tng-ink-2)', lineHeight: 1.9, letterSpacing: '-0.01em' }}>
                    {candidate.tech_stack.join(' · ')}
                  </div>
                </Section>
              )}
              {topKeywords.length > 0 && (
                <Section label={`Keywords · ${keywords?.length ?? 0}`} labelColor="#5E7A0F" labelBg="rgba(94,122,15,0.10)" style={{ marginTop: candidate.tech_stack?.length ? 48 : 0 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', alignItems: 'baseline' }}>
                    {topKeywords.map(kw => {
                      const freq   = kw.frequency ?? 1
                      const weight = freq / maxFreq
                      const size   = Math.round(14 + weight * 8)
                      const opacity = 0.45 + weight * 0.55
                      return (
                        <span key={kw.word} style={{ fontSize: size, color: 'var(--tng-ink-2)', opacity, fontWeight: freq > 1 ? 600 : 400, letterSpacing: '-0.01em' }}>
                          {kw.word}
                        </span>
                      )
                    })}
                  </div>
                </Section>
              )}
            </Band>
          )}

          {/* ── BAND 4 · COMO A IA TE VÊ ─── paper ─────────── */}
          {candidate.ai_fluency_statements && candidate.ai_fluency_statements.length > 0 && (
            <Band bg="var(--tng-paper)">
              <Section label="Como a IA te vê" labelColor="var(--tng-purple-700)" labelBg="var(--tng-purple-100)">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {candidate.ai_fluency_statements.map((s, i) => (
                    <div key={i} style={{
                      display: 'flex', gap: 18, padding: '20px 0',
                      borderBottom: i < candidate.ai_fluency_statements!.length - 1 ? '1px solid var(--tng-rule)' : 'none',
                    }}>
                      <div style={{ color: 'var(--tng-purple-300)', fontSize: 16, flexShrink: 0, marginTop: 5, lineHeight: 1 }}>✦</div>
                      <div style={{ fontSize: 24, fontFamily: 'var(--tng-font-serif)', fontStyle: 'italic', color: 'var(--tng-ink-2)', lineHeight: 1.55 }}>{s}</div>
                    </div>
                  ))}
                </div>
              </Section>
            </Band>
          )}

          {/* ── BAND 5 · LINKEDIN ─── cream ─────────────────── */}
          {(candidate.linkedin_headline || candidate.linkedin_about) && (
            <Band>
              <Section label="LinkedIn" labelColor="#0A66C2" labelBg="rgba(10,102,194,0.09)">
                {candidate.linkedin_headline && (
                  <div style={{
                    fontSize: 21, fontWeight: 700, color: 'var(--tng-ink)',
                    borderLeft: '3px solid #0A66C2', paddingLeft: 22, lineHeight: 1.4,
                    marginBottom: candidate.linkedin_about ? 28 : 0,
                  }}>
                    {candidate.linkedin_headline}
                  </div>
                )}
                {candidate.linkedin_about && (
                  <div style={{ fontSize: 15, color: 'var(--tng-ink-2)', lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>
                    {candidate.linkedin_about}
                  </div>
                )}
              </Section>
            </Band>
          )}

          {/* ── BAND 6 · PROGRESSO ─── bone ─────────────────── */}
          {(strengths.length > 0 || gaps.length > 0) && (
            <Band bg="var(--tng-bone)">
              {strengths.length > 0 && (
                <Section label="O que você construiu" labelColor="#5E7A0F" labelBg="rgba(94,122,15,0.10)">
                  {/* Progress bar */}
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ marginBottom: 10 }}>
                      <span style={{ fontSize: 19, color: 'var(--tng-ink-3)', fontStyle: 'italic', fontFamily: 'var(--tng-font-serif)' }}>
                        {progressSentiment}
                      </span>
                    </div>
                    <div style={{ height: 5, borderRadius: 999, background: 'rgba(94,122,15,0.15)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 999, background: '#5E7A0F', width: `${corePct}%` }} />
                    </div>
                  </div>
                  {/* Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {strengths.map((s, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '9px 16px 9px 12px',
                        background: 'rgba(94, 122, 15, 0.08)',
                        border: '1px solid rgba(94, 122, 15, 0.22)',
                        borderRadius: 999,
                      }}>
                        <span style={{ color: '#5E7A0F', fontSize: 13, fontWeight: 700 }}>✓</span>
                        <span style={{ fontSize: 15, color: 'var(--tng-ink-2)', fontWeight: 500 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {gaps.length > 0 && (
                <Section label="Próximos passos" labelColor="var(--tng-coral-text)" labelBg="rgba(255,107,53,0.09)" style={{ marginTop: strengths.length > 0 ? 48 : 0 }}>
                  {/* Sentiment header */}
                  <div style={{
                    fontSize: 19, color: 'var(--tng-ink-3)', fontStyle: 'italic',
                    fontFamily: 'var(--tng-font-serif)', lineHeight: 1.6,
                    marginBottom: 24,
                  }}>
                    {gaps.length === 1
                      ? 'Falta só uma peça — você está quase completo.'
                      : gaps.length <= 3
                      ? `${gaps.length} passos para fechar o ciclo. Cada um abre a porta do próximo.`
                      : 'Cada passo aqui amplifica tudo que você já construiu.'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {gaps.map((g, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                        padding: '16px 0',
                        borderBottom: i < gaps.length - 1 ? '1px solid var(--tng-rule)' : 'none',
                        gap: 16,
                      }}>
                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                          <span style={{ color: 'var(--tng-coral)', fontSize: 15, marginTop: 3, flexShrink: 0, fontWeight: 700 }}>→</span>
                          <div>
                            <div style={{ fontSize: 17, color: 'var(--tng-ink-2)', fontWeight: 600, lineHeight: 1.4 }}>{g.text}</div>
                            <div style={{ fontSize: 13, color: 'var(--tng-ink-3)', marginTop: 4, lineHeight: 1.5, fontStyle: 'italic' }}>
                              {GAP_WHY[g.text]}
                            </div>
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--tng-ink-3)', fontFamily: 'var(--tng-font-mono)', fontWeight: 600, letterSpacing: '0.06em', flexShrink: 0, paddingTop: 3 }}>{g.day}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </Band>
          )}

          {/* ── BAND 7 · ATALHOS ─── paper ──────────────────── */}
          <Band bg="var(--tng-paper)">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>

              {/* CV */}
              <a href="/cv" style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 20px', borderRadius: 12, textDecoration: 'none',
                background: 'var(--tng-cream)', border: '1px solid var(--tng-rule)',
                borderLeft: '3px solid var(--tng-coral)',
                transition: 'box-shadow .15s, border-color .15s',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#FFE4D9', border: '1px solid var(--tng-coral)',
                  color: 'var(--tng-coral)',
                }}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
                    <rect x="3" y="2" width="10" height="12" rx="1"/><path d="M5 5h6M5 8h6M5 11h4"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--tng-font-mono)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--tng-coral-text)', marginBottom: 3 }}>Currículo</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tng-ink)', letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 2 }}>Editar CV</div>
                  <div style={{ fontSize: 12, color: 'var(--tng-ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeCV ? [cvName, cvPosition].filter(Boolean).join(' · ') || 'Versão ativa' : 'Criar primeira versão'}
                  </div>
                </div>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14, color: 'var(--tng-ink-3)', flexShrink: 0 }}>
                  <polyline points="6,3 10,8 6,13" />
                </svg>
              </a>

              {/* Board */}
              <a href="/board" style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 20px', borderRadius: 12, textDecoration: 'none',
                background: 'var(--tng-cream)', border: '1px solid var(--tng-rule)',
                borderLeft: '3px solid var(--tng-purple-500)',
                transition: 'box-shadow .15s, border-color .15s',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'var(--tng-purple-100)', border: '1px solid var(--tng-purple-300)',
                  color: 'var(--tng-purple-700)',
                }}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
                    <rect x="2" y="5" width="12" height="9" rx="1"/><path d="M6 5V3a1 1 0 011-1h2a1 1 0 011 1v2"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--tng-font-mono)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--tng-purple-700)', marginBottom: 3 }}>Candidaturas</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tng-ink)', letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 2 }}>Job Board</div>
                  <div style={{ fontSize: 12, color: 'var(--tng-ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {totalJobs > 0 ? `${totalJobs} vaga${totalJobs !== 1 ? 's' : ''} salva${totalJobs !== 1 ? 's' : ''}${appliedJobs > 0 ? ` · ${appliedJobs} em andamento` : ''}` : 'Nenhuma vaga adicionada ainda'}
                  </div>
                </div>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14, color: 'var(--tng-ink-3)', flexShrink: 0 }}>
                  <polyline points="6,3 10,8 6,13" />
                </svg>
              </a>

              {/* Mentor IA */}
              <a href="/chat" style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 20px', borderRadius: 12, textDecoration: 'none',
                background: 'var(--tng-cream)', border: '1px solid var(--tng-rule)',
                borderLeft: '3px solid #B4DD3A',
                transition: 'box-shadow .15s, border-color .15s',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#F2FAD5', border: '1px solid #B4DD3A',
                  color: '#5E7A0F',
                }}>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
                    <path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6l-3 3v-3H4a2 2 0 01-2-2z"/>
                    <circle cx="6" cy="7" r="0.6" fill="currentColor" stroke="none"/>
                    <circle cx="10" cy="7" r="0.6" fill="currentColor" stroke="none"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontFamily: 'var(--tng-font-mono)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5E7A0F', marginBottom: 3 }}>Mentor IA</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tng-ink)', letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: 2 }}>Falar com mentor</div>
                  <div style={{ fontSize: 12, color: 'var(--tng-ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Tire dúvidas, analise vagas, refine seu pitch
                  </div>
                </div>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14, color: 'var(--tng-ink-3)', flexShrink: 0 }}>
                  <polyline points="6,3 10,8 6,13" />
                </svg>
              </a>

            </div>
          </Band>

          {/* ── BAND 8 · SALÁRIO ─── night (dark) ───────────── */}
          {(candidate.salary_min || candidate.salary_max) && (
            <Band bg="var(--tng-night-2)">
              <Section label="Âncora Salarial" labelColor="rgba(242,238,220,0.50)" labelBg="rgba(242,238,220,0.10)">
                <div style={{ display: 'flex', gap: 64, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  {candidate.salary_min && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--tng-night-ink2)', marginBottom: 8, fontFamily: 'var(--tng-font-mono)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Mínimo</div>
                      <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--tng-lime)', fontFamily: 'var(--tng-font-display)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                        {fmt(candidate.salary_min, candidate.salary_currency)}
                      </div>
                    </div>
                  )}
                  {candidate.salary_max && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--tng-night-ink2)', marginBottom: 8, fontFamily: 'var(--tng-font-mono)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Target</div>
                      <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--tng-coral)', fontFamily: 'var(--tng-font-display)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                        {fmt(candidate.salary_max, candidate.salary_currency)}
                      </div>
                    </div>
                  )}
                </div>
              </Section>
            </Band>
          )}

        </>)}

      </div>
    </div>
  )
}

// ── Gap impact descriptions ──────────────────────────────────────────────────

const GAP_WHY: Record<string, string> = {
  'Elaborar proposta de valor':      'Sua âncora de posicionamento — o que torna você único para um recrutador.',
  'Criar headline do LinkedIn':      'Primeira impressão em todo resultado de busca e visita ao perfil.',
  'Escrever About do LinkedIn':      'Onde recrutadores decidem se leem mais ou clicam em outro candidato.',
  'Mapear habilidades e stack':      'O vocabulário da sua candidatura técnica — sem isso, você não passa pelos filtros.',
  'Definir mercado-alvo e regiões':  'Foco transforma esforço genérico em resultados concretos.',
  'Construir banco de keywords':     'Aumenta visibilidade nos sistemas ATS e chama atenção nos títulos certos.',
  'Definir âncora salarial':         'Quem não sabe o que quer aceita qualquer coisa. A negociação começa aqui.',
}

// ── Layout primitives ────────────────────────────────────────────────────────

/**
 * Parses simple inline markers in the value proposition text:
 *   **word**  → coral, heavy weight, upright (stands out from italic base)
 *   *word*    → lime highlight background (marca-texto)
 *
 * The AI should use these when saving value_proposition / alternatives.
 */
function renderRichText(text: string) {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const raw = match[0]
    if (raw.startsWith('**')) {
      parts.push(
        <strong key={match.index} style={{
          color: 'var(--tng-coral)', fontWeight: 800, fontStyle: 'normal',
        }}>
          {raw.slice(2, -2)}
        </strong>
      )
    } else {
      parts.push(
        <mark key={match.index} style={{
          background: 'rgba(201, 242, 61, 0.38)',
          color: 'inherit', borderRadius: 3,
          padding: '1px 4px', fontStyle: 'italic',
        }}>
          {raw.slice(1, -1)}
        </mark>
      )
    }
    lastIndex = match.index + raw.length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return <>{parts}</>
}

function Band({ first, bg, children }: { first?: boolean; bg?: string; children: React.ReactNode }) {
  return (
    <div className="dossier-band" style={{
      paddingTop:    first ? 56 : 64,
      paddingBottom: 64,
      ...(bg ? { background: bg } : {}),
    }}>
      <div style={{ maxWidth: 860, width: '100%' }}>
        {children}
      </div>
    </div>
  )
}

function Section({
  label, labelColor, labelBg, children, style,
}: {
  label?: string
  labelColor?: string
  labelBg?: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={style}>
      {label && (
        <div style={{ marginBottom: 22 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '4px 12px', borderRadius: 999,
            background: labelBg ?? 'rgba(0,0,0,0.05)',
            border: `1px solid ${labelColor ?? 'var(--tng-rule)'}`,
            fontSize: 10, fontWeight: 700, letterSpacing: '0.13em',
            textTransform: 'uppercase', color: labelColor ?? 'var(--tng-ink-3)',
            fontFamily: 'var(--tng-font-mono)',
          }}>
            {label}
          </span>
        </div>
      )}
      {children}
    </div>
  )
}

function fmt(n: number, currency?: string | null) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: currency ?? 'USD', maximumFractionDigits: 0,
  }).format(n)
}
