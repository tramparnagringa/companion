'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function TodayRedirectClient({
  defaultSlug,
  slugs,
}: {
  defaultSlug: string
  slugs: string[]
}) {
  const router = useRouter()

  useEffect(() => {
    const last = localStorage.getItem('tng_active_slug')
    const slug = (last && slugs.includes(last)) ? last : defaultSlug
    router.replace(`/${slug}/today`)
  }, [])

  return null
}
