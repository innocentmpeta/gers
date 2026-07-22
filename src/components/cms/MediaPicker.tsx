import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { listMedia, uploadMediaAsset } from '../../lib/firestore/media'
import { useAuth } from '../../lib/auth'
import type { MediaAsset } from '../../types/models'

interface MediaPickerProps {
  label: string
  accept: 'image' | 'document'
  selectedAssetId?: string
  onSelect: (asset: MediaAsset | null) => void
}

export default function MediaPicker({ label, accept, selectedAssetId, onSelect }: MediaPickerProps) {
  const { firebaseUser } = useAuth()
  const [open, setOpen] = useState(false)
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const selected = assets.find((a) => a.id === selectedAssetId)

  useEffect(() => {
    if (!open) return
    listMedia().then((all) => setAssets(all.filter((a) => a.type === accept)))
  }, [open, accept])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !firebaseUser) return
    setUploading(true)
    try {
      const asset = await uploadMediaAsset(file, firebaseUser.uid)
      setAssets((prev) => [asset, ...prev])
      onSelect(asset)
      setOpen(false)
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  return (
    <div>
      <p className="text-sm text-slate-700">{label}</p>
      <div className="mt-1 flex items-center gap-3">
        {selected && accept === 'image' && (
          <img src={selected.fileUrl} alt={selected.altText} className="h-14 w-14 rounded object-cover" />
        )}
        {selected && accept === 'document' && (
          <span className="text-sm text-ink-800 underline">{selected.altText}</span>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md border border-sand-200 bg-white px-3 py-1.5 text-sm text-ink-800 hover:border-ink-700"
        >
          {selected ? 'Change' : 'Choose'}
        </button>
        {selected && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-sm text-slate-400 hover:text-red-600"
          >
            Remove
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 rounded-lg border border-sand-200 bg-white p-3">
          <label className="inline-flex cursor-pointer items-center rounded-md bg-gold-500 px-3 py-1.5 text-sm font-medium text-sand-50 hover:bg-gold-600">
            {uploading ? 'Uploading…' : 'Upload new'}
            <input
              ref={fileInput}
              type="file"
              accept={accept === 'image' ? 'image/*' : undefined}
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>

          <div className="mt-3 grid grid-cols-6 gap-2">
            {assets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => {
                  onSelect(asset)
                  setOpen(false)
                }}
                className={clsx(
                  'aspect-square overflow-hidden rounded border-2',
                  asset.id === selectedAssetId ? 'border-gold-500' : 'border-transparent'
                )}
                title={asset.altText}
              >
                {accept === 'image' ? (
                  <img src={asset.fileUrl} alt={asset.altText} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-sand-100 p-1 text-center text-[10px] text-slate-600">
                    {asset.altText}
                  </span>
                )}
              </button>
            ))}
            {assets.length === 0 && <p className="col-span-6 text-sm text-slate-400">No media uploaded yet.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
