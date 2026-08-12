import { useEffect, useState } from 'react'
import { listVisibleDocuments } from '../../lib/firestore/symposiumDocuments'
import { getMediaAsset } from '../../lib/firestore/media'
import type { DocumentCategory, MediaAsset, SymposiumDocument } from '../../types/models'

const CATEGORY_LABEL: Record<DocumentCategory, string> = {
  presentation: 'Presentations',
  report: 'Reports',
  other: 'Other documents',
}

// Presentations/reports/other files an admin has flagged visible — grouped
// by category so a growing list stays scannable. Renders nothing (not even
// a heading) when there's nothing to show, so it never adds empty clutter
// to an account page that already has several sections.
export default function SymposiumDocuments({ symposiumId }: { symposiumId: string }) {
  const [documents, setDocuments] = useState<SymposiumDocument[]>([])
  const [files, setFiles] = useState<Record<string, MediaAsset>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listVisibleDocuments(symposiumId).then(async (docs) => {
      setDocuments(docs)
      const ids = [...new Set(docs.map((d) => d.mediaAssetId))]
      const assets = await Promise.all(ids.map((id) => getMediaAsset(id)))
      const map: Record<string, MediaAsset> = {}
      assets.forEach((a) => {
        if (a) map[a.id] = a
      })
      setFiles(map)
      setLoading(false)
    })
  }, [symposiumId])

  if (loading || documents.length === 0) return null

  const byCategory = (['presentation', 'report', 'other'] as DocumentCategory[])
    .map((category) => ({ category, docs: documents.filter((d) => d.category === category) }))
    .filter((group) => group.docs.length > 0)

  return (
    <div className="mt-10 border-t border-sand-200 pt-8">
      <h2 className="text-lg font-semibold text-ink-900">Documents</h2>
      <div className="mt-4 flex flex-col gap-5">
        {byCategory.map(({ category, docs }) => (
          <div key={category}>
            <p className="text-sm font-medium text-slate-700">{CATEGORY_LABEL[category]}</p>
            <ul className="mt-2 flex flex-col gap-1">
              {docs.map((doc) => {
                const file = files[doc.mediaAssetId]
                return (
                  <li key={doc.id}>
                    {file ? (
                      <a href={file.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-ink-800 underline">
                        {doc.title}
                      </a>
                    ) : (
                      <span className="text-sm text-slate-400">{doc.title}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
