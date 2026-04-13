import { createServerClient } from '@/lib/supabase/server'
import { Topbar } from '@/components/layout/topbar'

export default async function CVPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: versions } = await supabase
    .from('cv_versions')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const activeVersion = versions?.find(v => v.is_active) ?? versions?.[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar
        title="CV Editor"
        subtitle={activeVersion ? activeVersion.name : 'Nenhuma versão ainda'}
        actions={
          <button style={{
            fontSize: 12, fontWeight: 500, padding: '7px 13px',
            borderRadius: 'var(--rsm)', cursor: 'pointer', border: 'none',
            background: 'var(--accent)', color: 'var(--accent-text)',
            fontFamily: 'var(--font)',
          }}>
            + Nova versão
          </button>
        }
      />
      <div style={{ flex: 1, overflow: 'hidden', padding: '20px 24px' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '220px 1fr', gap: 12,
          height: 'calc(100dvh - var(--topbar-h) - 40px)',
        }}>
          {/* Version list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              background: 'var(--bg2)', border: '0.5px solid var(--border)',
              borderRadius: 'var(--r)', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{
                padding: '10px 12px', borderBottom: '0.5px solid var(--border)',
                fontSize: 11, fontWeight: 500, color: 'var(--text2)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                Versões
                <span style={{ fontSize: 10, color: 'var(--text3)' }}>{versions?.length ?? 0}</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
                {versions?.length === 0 && (
                  <div style={{ padding: '16px 10px', fontSize: 12, color: 'var(--text4)', textAlign: 'center' }}>
                    Nenhuma versão
                  </div>
                )}
                {versions?.map(v => (
                  <div key={v.id} style={{
                    padding: '8px 10px', borderRadius: 'var(--rsm)', cursor: 'pointer',
                    background: v.is_active ? 'var(--accent-dim)' : 'transparent',
                    border: v.is_active ? '0.5px solid rgba(228,253,139,.2)' : '0.5px solid transparent',
                    marginBottom: 2,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: v.is_active ? 'var(--accent)' : 'var(--text)' }}>
                      {v.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>
                      {v.created_at ? new Date(v.created_at).toLocaleDateString('pt-BR') : '—'}
                    </div>
                    <span style={{
                      fontSize: 9, padding: '1px 6px', borderRadius: 8, marginTop: 4, display: 'inline-block',
                      background: v.generated_by === 'ai' ? 'var(--purple-dim)' : 'var(--bg4)',
                      color: v.generated_by === 'ai' ? 'var(--purple)' : 'var(--text3)',
                    }}>
                      {v.generated_by}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CV content */}
          <div style={{
            background: 'var(--bg2)', border: '0.5px solid var(--border)',
            borderRadius: 'var(--r)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {activeVersion ? (
              <>
                <div style={{
                  padding: '10px 14px', borderBottom: '0.5px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{activeVersion.name}</span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', fontSize: 13, color: 'var(--text2)' }}>
                  <p>CV carregado. Editor completo em breve.</p>
                </div>
              </>
            ) : (
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: 'var(--text3)',
              }}>
                Nenhuma versão selecionada. Crie uma nova para começar.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
