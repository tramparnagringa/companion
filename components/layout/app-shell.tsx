'use client'

import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { SidebarContext } from './sidebar-context'
import { Sidebar } from './sidebar'

interface AppShellProps {
  children: React.ReactNode
  user: User | null
  tokenUsed?: number
  tokenTotal?: number
  plan?: string
  currentDay?: number
  completedCount?: number
}

export function AppShell({ children, user, tokenUsed, tokenTotal, plan, currentDay, completedCount }: AppShellProps) {
  const [open, setOpen] = useState(false)

  return (
    <SidebarContext.Provider value={{ open, toggle: () => setOpen(o => !o), close: () => setOpen(false) }}>
      <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>

        {/* Mobile backdrop */}
        <div
          className={`sidebar-backdrop${open ? ' sidebar-open' : ''}`}
          onClick={() => setOpen(false)}
        />

        {/* Sidebar */}
        <Sidebar
          user={user}
          tokenUsed={tokenUsed}
          tokenTotal={tokenTotal}
          plan={plan}
          currentDay={currentDay}
          completedCount={completedCount}
          isOpen={open}
          onClose={() => setOpen(false)}
        />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  )
}
