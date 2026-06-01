import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Programas' }

export default function AdminProgramsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
