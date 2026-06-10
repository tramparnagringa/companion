import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'
import { ICICard, type ICIScores } from '@/components/ici-card'

export const metadata: Metadata = { title: 'Dossier' }

export default async function ProfilePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: candidate } = await supabase
    .from('candidate_profiles').select('*').eq('user_id', user!.id).single()

  /* TODO: restore full profile data fetching
  const [
    { data: keywords },
    { data: jobs },
    { data: userMeta },
    { data: days },
    { data: activeCV },
    { data: actionNotes },
    { data: enrollment },
  ] = await Promise.all([
    supabase.from('keywords').select('word, frequency').eq('user_id', user!.id).order('frequency', { ascending: false }).limit(40),
    supabase.from('jobs').select('status').eq('user_id', user!.id),
    supabase.from('profiles').select('full_name, avatar_url').eq('id', user!.id).single(),
    supabase.from('day_activities').select('day_number, status, completed_at').eq('user_id', user!.id).order('day_number'),
    supabase.from('cv_versions').select('content').eq('user_id', user!.id).eq('is_active', true).single(),
    (supabase as any).from('action_notes').select('id').eq('user_id', user!.id),
    supabase.from('user_programs').select('programs(name)').eq('user_id', user!.id).eq('status', 'active').limit(1).maybeSingle(),
  ])
  */

  const breadcrumb = (
    <div className="topbar-crumb">
      <strong>Profile</strong>
    </div>
  )

  return (
    <div className="page-col">
      <Topbar title={breadcrumb} streak={0} />

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
        ) : (
          <>
            {/* ICI Card */}
            {(candidate as any).ici_scores && (
              <div className="dossier-band" style={{ paddingTop: 40, paddingBottom: 40 }}>
                <ICICard scores={(candidate as any).ici_scores as ICIScores} />
              </div>
            )}

            {/* TODO: restore full profile bands
            <Band first>
              ... BAND 1 · HERO (avatar, name, value proposition, mini stats) ...
            </Band>

            <Band bg="var(--tng-bone)">
              ... BAND 2 · PROPOSTA DE VALOR ...
            </Band>

            {(candidate.tech_stack?.length || topKeywords.length > 0) && (
              <Band bg="var(--tng-paper)">
                ... BAND 3 · HABILIDADES + KEYWORDS ...
              </Band>
            )}

            {candidate.ai_fluency_statements?.length > 0 && (
              <Band bg="var(--tng-paper)">
                ... BAND 4 · COMO A IA TE VÊ ...
              </Band>
            )}

            {(candidate.linkedin_headline || candidate.linkedin_about) && (
              <Band>
                ... BAND 5 · LINKEDIN ...
              </Band>
            )}

            {(strengths.length > 0 || gaps.length > 0) && (
              <Band bg="var(--tng-bone)">
                ... BAND 6 · PROGRESSO (strengths + next steps) ...
              </Band>
            )}

            <Band bg="var(--tng-paper)">
              ... BAND 7 · ATALHOS (CV, Board, Mentor IA) ...
            </Band>

            {(candidate.salary_min || candidate.salary_max) && (
              <Band bg="var(--tng-night-2)">
                ... BAND 8 · ÂNCORA SALARIAL ...
              </Band>
            )}
            */}
          </>
        )}

      </div>
    </div>
  )
}
