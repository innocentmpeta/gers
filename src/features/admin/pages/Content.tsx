import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPages } from '../../../lib/firestore/pages'
import type { Page } from '../../../types/models'

const TYPE_LABEL: Record<Page['type'], string> = {
  freeform: 'Freeform',
  data_backed: 'Data-backed',
  curated: 'Curated',
  dedicated: 'Dedicated',
}

export default function AdminContent() {
  const [pages, setPages] = useState<Page[] | null>(null)

  useEffect(() => {
    listPages().then((p) => setPages(p.sort((a, b) => a.title.localeCompare(b.title))))
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="text-3xl">Content</h1>
      <p className="mt-2 text-sm text-slate-500">
        Freeform and curated pages get the full section editor; data-backed pages (Programme,
        Speakers) and the dedicated FAQ template only expose a hero here.
      </p>

      {pages === null && <p className="mt-6 text-slate-400">Loading…</p>}
      {pages?.length === 0 && (
        <p className="mt-6 text-slate-400">
          No pages exist yet — they need to be seeded once in Firestore before they'll show up here.
        </p>
      )}

      <div className="mt-6 flex flex-col divide-y divide-sand-200 rounded-lg border border-sand-200 bg-white">
        {pages?.map((page) => (
          <Link
            key={page.id}
            to={`/admin/content/${page.id}`}
            className="flex items-center justify-between px-5 py-4 hover:bg-sand-50"
          >
            <div>
              <p className="text-ink-900">{page.title}</p>
              <p className="text-sm text-slate-400">/{page.slug}</p>
            </div>
            <span className="text-xs uppercase tracking-wide text-gold-600">
              {TYPE_LABEL[page.type]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
