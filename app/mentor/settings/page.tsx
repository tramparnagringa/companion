export default function MentorSettingsPage() {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: 'var(--bg)' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', margin: 0 }}>Configurações</h1>
        <p style={{ fontSize: 13, color: 'var(--text3)', margin: '4px 0 0' }}>
          Configurações da plataforma
        </p>
      </div>

      <div style={{
        background: 'var(--bg2)', border: '0.5px solid var(--border)',
        borderRadius: 'var(--r)', padding: '40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 12, textAlign: 'center',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'var(--bg3)', border: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"
            style={{ width: 18, height: 18, color: 'var(--text4)' }}>
            <circle cx="8" cy="8" r="2" />
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4" />
          </svg>
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text3)' }}>Em breve</div>
        <div style={{ fontSize: 13, color: 'var(--text4)', maxWidth: 320 }}>
          Configurações de programa, notificações e integrações serão disponibilizadas aqui.
        </div>
      </div>
    </div>
  )
}
