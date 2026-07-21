import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import HeroEditor from '../../../components/cms/HeroEditor'
import SectionEditor from './SectionEditor'
import FaqEditor from './FaqEditor'
import HomeContentEditor from './HomeContentEditor'
import { getPage } from '../../../lib/firestore/pages'
import { getHeroForPage } from '../../../lib/firestore/heroes'
import { listSectionsForPage, createSection, updateSection } from '../../../lib/firestore/sections'
import type { Hero, Page, Section } from '../../../types/models'

export default function PageEditor() {
  const { pageId } = useParams<{ pageId: string }>()
  const [page, setPage] = useState<Page | null>(null)
  const [hero, setHero] = useState<Hero | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!pageId) return
    setLoading(true)
    setError(null)
    try {
      const [p, h, s] = await Promise.all([
        getPage(pageId),
        getHeroForPage(pageId),
        listSectionsForPage(pageId),
      ])
      setPage(p)
      setHero(h)
      setSections(s)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId])

  async function handleAddSection() {
    if (!pageId) return
    await createSection({ pageId, order: sections.length, layout: 'grid' })
    load()
  }

  async function moveSection(section: Section, direction: -1 | 1) {
    const idx = sections.findIndex((s) => s.id === section.id)
    const swapWith = sections[idx + direction]
    if (!swapWith) return
    await updateSection(section.id, { order: swapWith.order })
    await updateSection(swapWith.id, { order: section.order })
    load()
  }

  if (loading) return <div className="px-8 py-10 text-slate-500">Loading…</div>
  if (error) return <div className="px-8 py-10 text-red-600">{error}</div>
  if (!page) return <div className="px-8 py-10 text-slate-500">Page not found.</div>

  const editableSections = page.type === 'freeform' || page.type === 'curated'

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <Link to="/admin/content" className="text-sm text-slate-500 hover:text-teal-800">
        ← All pages
      </Link>
      <h1 className="mt-2 text-3xl">{page.title}</h1>
      <p className="text-sm text-slate-400">/{page.slug} · {page.type.replace('_', ' ')}</p>

      <div className="mt-6">
        <HeroEditor pageId={page.id} hero={hero} onSaved={setHero} />
      </div>

      {page.slug === 'faq' ? (
        <FaqEditor />
      ) : page.slug === 'home' ? (
        <HomeContentEditor pageId={page.id} />
      ) : editableSections ? (
        <div className="mt-8 flex flex-col gap-5">
          <h2 className="text-xl">Sections</h2>
          {sections.map((section, idx) => (
            <SectionEditor
              key={section.id}
              section={section}
              canMoveUp={idx > 0}
              canMoveDown={idx < sections.length - 1}
              onMoveUp={() => moveSection(section, -1)}
              onMoveDown={() => moveSection(section, 1)}
              onDeleted={load}
            />
          ))}
          <button
            onClick={handleAddSection}
            className="self-start rounded-md border border-dashed border-sand-300 px-4 py-2 text-sm text-teal-800 hover:border-teal-700"
          >
            + Add section
          </button>
        </div>
      ) : (
        <p className="mt-8 text-sm text-slate-500">
          This page's content is drawn from live data (registrations/sessions), not the section
          editor — only its hero is configurable here.
        </p>
      )}
    </div>
  )
}
