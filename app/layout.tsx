import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TNG Companion',
  description: 'Seu guia de IA para vagas internacionais',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
