'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { SidebarContext } from './sidebar-context'
import { Sidebar } from './sidebar'
import { ProgramTracker } from './program-tracker'
import { ContextRail } from './context-rail'

export interface EnrollmentWithProgress {
  id: string
  slug: string
  name: string
  totalDays: number
  completedDays: number
  currentDay: number
  status: string
}

export interface RecommendedProgram {
  id: string
  slug: string
  name: string
  description: string | null
  price_brl: number | null
  duration_days: number | null
}

interface AppShellProps {
  children: React.ReactNode
  user: User | null
  role?: string
  enrollments?: EnrollmentWithProgress[]
  tokenUsed?: number
  tokenTotal?: number
  plan?: string
  recommendedProgram?: RecommendedProgram | null
}

export function AppShell({ children, user, role, enrollments, tokenUsed, tokenTotal, plan, recommendedProgram }: AppShellProps) {
  const [open, setOpen] = useState(false)

  return (
    <SidebarContext.Provider value={{ open, toggle: () => setOpen(o => !o), close: () => setOpen(false) }}>
      <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', position: 'relative' }}>

        {/* Mobile backdrop */}
        <div
          className={`sidebar-backdrop${open ? ' sidebar-open' : ''}`}
          onClick={() => setOpen(false)}
        />

        {/* Context rail — mentor/admin only */}
        <ContextRail role={role ?? 'student'} user={user} />

        {/* Sidebar */}
        <Sidebar
          user={user}
          role={role}
          enrollments={enrollments}
          tokenUsed={tokenUsed}
          tokenTotal={tokenTotal}
          plan={plan}
          recommendedProgram={recommendedProgram}
          isOpen={open}
          onClose={() => setOpen(false)}
        />

        <ProgramTracker enrollmentSlugs={(enrollments ?? []).map(e => e.slug)} />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  )
}
