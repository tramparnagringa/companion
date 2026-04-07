'use client'

import { createContext, useContext } from 'react'

interface SidebarContextValue {
  open: boolean
  toggle: () => void
  close: () => void
}

export const SidebarContext = createContext<SidebarContextValue>({
  open: false,
  toggle: () => {},
  close: () => {},
})

export const useSidebar = () => useContext(SidebarContext)
