import { useEffect, useState } from 'react'
import { getPageBySlug } from '../../../lib/firestore/pages'
import { getHeroForPage } from '../../../lib/firestore/heroes'
import type { Hero, Page } from '../../../types/models'

// Shared by the data-backed/dedicated pages (Programme, Speakers, FAQ) —
// they each still get a hero like any other page, just render their own
// content below it instead of CMS Sections.
export function usePageHero(slug: string) {
  const [page, setPage] = useState<Page | null>(null)
  const [hero, setHero] = useState<Hero | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getPageBySlug(slug).then(async (p) => {
      setPage(p)
      if (p) setHero(await getHeroForPage(p.id))
      setLoading(false)
    })
  }, [slug])

  return { page, hero, loading }
}
