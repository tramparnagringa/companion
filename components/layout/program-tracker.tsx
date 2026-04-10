'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Invisible component — watches for /[slug]/* navigation and persists
 * the active program slug to localStorage so /today can restore it.
 */
export function ProgramTracker({ enrollmentSlugs }: { enrollmentSlugs: string[] }) {
  const pathname = usePathname()

  useEffect(() => {
    const segment = pathname.split('/')[1] ?? ''
    if (enrollmentSlugs.includes(segment)) {
      localStorage.setItem('last_program_slug', segment)
    }
  }, [pathname, enrollmentSlugs])

  return null
}
