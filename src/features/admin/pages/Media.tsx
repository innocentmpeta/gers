import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../../lib/auth'
import { listMedia, uploadMediaAsset, deleteMediaAsset } from '../../../lib/firestore/media'
import type { MediaAsset } from '../../../types/models'

type TypeFilter = 'all' | 'image' | 'document'

export default function AdminMedia() {
  const { firebaseUser } = useAuth()
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  function load() {
    setLoading(true)
    listMedia().then((all) => {
      setAssets(all)
      setLoading(false)
    })
  }

  useEffect(load, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0 || !firebaseUser) return
    setUploading(true)
    try {
      for (const file of files) {
        await uploadMediaAsset(file, firebaseUser.uid)
      }
      load()
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  async function handleDelete(asset: MediaAsset) {
    if (!confirm(`Delete "${asset.altText || asset.fileUrl}"? This can't be undone, and it may still be referenced elsewhere on the site.`))
      return
    setDeletingId(asset.id)
    try {
      await deleteMediaAsset(asset)
      setAssets((prev) => prev.filter((a) => a.id !== asset.id))
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = assets.filter((a) => {
    if (typeFilter !== 'all' && a.type !== typeFilter) return false
    if (search && !(a.altText ?? '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="mx-auto max-w-6xl px-8 py-10">
      <h1 className="text-3xl">Media Library</h1>
      <p className="mt-2 text-sm text-slate-500">
        Every image and document uploaded across the site — content sections, speaker/partner
        profiles, and self-submissions. Deleting here removes the file everywhere it was used, so
        check it's not still referenced before deleting.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center rounded-md bg-gold-500 px-4 py-2 text-sm font-medium text-sand-50 hover:bg-gold-600">
          {uploading ? 'Uploading…' : 'Upload files'}
          <input
            ref={fileInput}
            type="file"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>

        <div className="flex gap-1 rounded-md border border-sand-200 bg-white p-1">
          {(['all', 'image', 'document'] as TypeFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`rounded px-3 py-1 text-sm capitalize ${
                typeFilter === f ? 'bg-ink-800 text-sand-50' : 'text-slate-600 hover:bg-sand-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by filename…"
          className="rounded-md border border-sand-200 px-3 py-1.5 text-sm"
        />
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-slate-400">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-sm text-slate-400">No media matches.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map((asset) => (
            <div key={asset.id} className="group relative overflow-hidden rounded-lg border border-sand-200 bg-white">
              <div className="aspect-square bg-sand-100">
                {asset.type === 'image' ? (
                  <img src={asset.fileUrl} alt={asset.altText} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-slate-500">
                    {asset.altText}
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="truncate text-xs text-slate-500" title={asset.altText}>
                  {asset.altText}
                </p>
              </div>
              <button
                onClick={() => handleDelete(asset)}
                disabled={deletingId === asset.id}
                className="absolute right-1 top-1 rounded-full bg-ink-950/70 px-2 py-1 text-xs text-sand-50 opacity-0 transition-opacity hover:bg-red-600 disabled:opacity-100 group-hover:opacity-100"
              >
                {deletingId === asset.id ? '…' : 'Delete'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
