'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { SidebarContext } from './sidebar-context'
import { Sidebar } from './sidebar'
import { ProgramTracker } from './program-tracker'
import { ContextRail } from './context-rail'

interface AppShellProps {
  children: React.ReactNode
  user: User | null
  role?: string
  enrollments?: { id: string; slug: string; name: string; totalDays: number }[]
  enrollmentIdsWithPlans?: string[]
  tokenUsed?: number
  tokenTotal?: number
  plan?: string
}

export function AppShell({ children, user, role, enrollments, enrollmentIdsWithPlans, tokenUsed, tokenTotal, plan }: AppShellProps) {
  const [open, setOpen] = useState(false)

  return (
    <SidebarContext.Provider value={{ open, toggle: () => setOpen(o => !o), close: () => setOpen(false) }}>
      <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>

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
          enrollmentIdsWithPlans={enrollmentIdsWithPlans}
          tokenUsed={tokenUsed}
          tokenTotal={tokenTotal}
          plan={plan}
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
