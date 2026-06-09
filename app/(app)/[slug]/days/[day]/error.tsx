'use client'

import { useEffect } from 'react'

export default function DayError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[day] page error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
      <p className="text-[var(--fg2)] text-sm">Erro ao carregar o dia.</p>
      <button
        onClick={reset}
        className="text-xs px-4 py-2 rounded-md border border-[var(--bg5)] text-[var(--fg2)] hover:text-[var(--fg)] hover:border-[var(--bg3)] transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  )
}
