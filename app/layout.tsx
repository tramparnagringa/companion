import type { Metadata } from 'next'
import {
  Bricolage_Grotesque,
  Instrument_Serif,
  Geist,
  JetBrains_Mono,
} from 'next/font/google'
import './globals.css'

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--tng-font-display',
  display: 'swap',
})

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--tng-font-serif',
  display: 'swap',
})

const body = Geist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--tng-font-body',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--tng-font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TNG Companion',
  description: 'Seu guia de IA para vagas internacionais',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${serif.variable} ${body.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
