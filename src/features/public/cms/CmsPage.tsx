import { useEffect, useState } from 'react'
import HeroBlock from '../../../components/cms/HeroBlock'
import SectionRenderer from '../../../components/cms/SectionRenderer'
import { getPageBySlug } from '../../../lib/firestore/pages'
import { getHeroForPage } from '../../../lib/firestore/heroes'
import { listSectionsForPage } from '../../../lib/firestore/sections'
import type { Hero, Page, Section } from '../../../types/models'

// Renders any freeform or curated page from the CMS — one component covers
// About/Event Overview/Exhibition/Student Track/Register-intro/Past Symposiums/Home
// rather than duplicating this fetch-and-render logic per page.
export default function CmsPage({ slug }: { slug: string }) {
  const [page, setPage] = useState<Page | null>(null)
  const [hero, setHero] = useState<Hero | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getPageBySlug(slug).then(async (p) => {
      setPage(p)
      if (p) {
        const [h, s] = await Promise.all([getHeroForPage(p.id), listSectionsForPage(p.id)])
        setHero(h)
        setSections(s)
      }
      setLoading(false)
    })
  }, [slug])

  if (loading) return null

  if (!page) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-24 text-slate-400">
        This page hasn't been set up yet.
      </div>
    )
  }

  return (
    <div>
      <HeroBlock hero={hero} />
      {sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  )
}
