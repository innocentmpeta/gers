import { useState } from 'react'
import MediaPicker from '../../../components/cms/MediaPicker'
import { createItem, updateItem, deleteItem } from '../../../lib/firestore/items'
import type { Item, MediaAsset } from '../../../types/models'

type LinkMode = 'none' | 'external' | 'detail'

function linkModeOf(item: Partial<Item>): LinkMode {
  if (item.detailPageSlug) return 'detail'
  if (item.externalLink) return 'external'
  return 'none'
}

interface ItemFormProps {
  sectionId: string
  order: number
  item: Item | null
  onSaved: () => void
  onCancel: () => void
}

export default function ItemForm({ sectionId, order, item, onSaved, onCancel }: ItemFormProps) {
  const [title, setTitle] = useState(item?.title ?? '')
  const [bodyShort, setBodyShort] = useState(item?.bodyShort ?? '')
  const [bodyFull, setBodyFull] = useState(item?.bodyFull ?? '')
  const [tag, setTag] = useState(item?.tag ?? '')
  const [image, setImage] = useState<MediaAsset | null>(null)
  const [imageId, setImageId] = useState(item?.imageId)
  const [linkMode, setLinkMode] = useState<LinkMode>(linkModeOf(item ?? {}))
  const [externalLink, setExternalLink] = useState(item?.externalLink ?? '')
  const [gallery, setGallery] = useState<string[]>(item?.gallery ?? [])
  const [attachments, setAttachments] = useState<string[]>(item?.attachments ?? [])
  const [relatedLinks, setRelatedLinks] = useState<{ label: string; url: string }[]>(
    item?.relatedLinks ?? []
  )
  const [saving, setSaving] = useState(false)

  function addGalleryImage(asset: MediaAsset | null) {
    if (asset) setGallery((g) => [...g, asset.id])
  }
  function addAttachment(asset: MediaAsset | null) {
    if (asset) setAttachments((a) => [...a, asset.id])
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        sectionId,
        order,
        title,
        bodyShort: bodyShort || undefined,
        bodyFull: bodyFull || undefined,
        tag: tag || undefined,
        imageId: imageId,
        gallery: gallery.length ? gallery : undefined,
        attachments: attachments.length ? attachments : undefined,
        relatedLinks: relatedLinks.length ? relatedLinks : undefined,
        externalLink: linkMode === 'external' ? externalLink : undefined,
        detailPageSlug: linkMode === 'detail' ? (item?.detailPageSlug ?? crypto.randomUUID()) : undefined,
      }
      if (item) {
        await updateItem(item.id, payload)
      } else {
        await createItem(payload)
      }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!item) return
    if (!confirm('Delete this item?')) return
    await deleteItem(item.id)
    onSaved()
  }

  return (
    <div className="rounded-md border border-sand-200 bg-sand-50 p-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 flex flex-col gap-1 text-sm text-slate-700">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-md border border-sand-200 bg-white px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Short blurb (card teaser)
          <textarea
            value={bodyShort}
            onChange={(e) => setBodyShort(e.target.value)}
            rows={3}
            className="rounded-md border border-sand-200 bg-white px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Full body (detail page)
          <textarea
            value={bodyFull}
            onChange={(e) => setBodyFull(e.target.value)}
            rows={3}
            className="rounded-md border border-sand-200 bg-white px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Tag / label
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="e.g. booth number, category"
            className="rounded-md border border-sand-200 bg-white px-3 py-2"
          />
        </label>
      </div>

      <div className="mt-3">
        <MediaPicker
          label="Image"
          accept="image"
          selectedAssetId={image?.id ?? imageId}
          onSelect={(asset) => {
            setImage(asset)
            setImageId(asset?.id)
          }}
        />
      </div>

      <div className="mt-4">
        <p className="text-sm text-slate-700">On click</p>
        <div className="mt-1 flex gap-4 text-sm">
          {(['none', 'external', 'detail'] as LinkMode[]).map((mode) => (
            <label key={mode} className="inline-flex items-center gap-1.5">
              <input
                type="radio"
                checked={linkMode === mode}
                onChange={() => setLinkMode(mode)}
              />
              {mode === 'none' ? 'Not clickable' : mode === 'external' ? 'External link' : 'Detail page'}
            </label>
          ))}
        </div>
        {linkMode === 'external' && (
          <input
            value={externalLink}
            onChange={(e) => setExternalLink(e.target.value)}
            placeholder="https://…"
            className="mt-2 w-full rounded-md border border-sand-200 bg-white px-3 py-2 text-sm"
          />
        )}
        {linkMode === 'detail' && (
          <p className="mt-2 text-sm text-slate-500">
            A dedicated page will be generated for this item with the full body, gallery, and
            attachments below.
          </p>
        )}
      </div>

      {linkMode === 'detail' && (
        <>
          <div className="mt-4">
            <p className="text-sm text-slate-700">Gallery</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {gallery.map((id, i) => (
                <span key={id + i} className="rounded bg-white px-2 py-1 text-xs text-slate-500 border border-sand-200">
                  image #{i + 1}
                  <button
                    className="ml-2 text-red-500"
                    onClick={() => setGallery((g) => g.filter((_, idx) => idx !== i))}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2">
              <MediaPicker label="Add to gallery" accept="image" onSelect={addGalleryImage} />
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-slate-700">Attachments</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {attachments.map((id, i) => (
                <span key={id + i} className="rounded bg-white px-2 py-1 text-xs text-slate-500 border border-sand-200">
                  file #{i + 1}
                  <button
                    className="ml-2 text-red-500"
                    onClick={() => setAttachments((a) => a.filter((_, idx) => idx !== i))}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2">
              <MediaPicker label="Add attachment" accept="document" onSelect={addAttachment} />
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-slate-700">Related links</p>
            {relatedLinks.map((rl, i) => (
              <div key={i} className="mt-1 flex gap-2">
                <input
                  value={rl.label}
                  onChange={(e) =>
                    setRelatedLinks((links) =>
                      links.map((l, idx) => (idx === i ? { ...l, label: e.target.value } : l))
                    )
                  }
                  placeholder="Label"
                  className="w-1/3 rounded-md border border-sand-200 bg-white px-2 py-1 text-sm"
                />
                <input
                  value={rl.url}
                  onChange={(e) =>
                    setRelatedLinks((links) =>
                      links.map((l, idx) => (idx === i ? { ...l, url: e.target.value } : l))
                    )
                  }
                  placeholder="https://…"
                  className="flex-1 rounded-md border border-sand-200 bg-white px-2 py-1 text-sm"
                />
                <button
                  onClick={() => setRelatedLinks((links) => links.filter((_, idx) => idx !== i))}
                  className="text-red-500"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              onClick={() => setRelatedLinks((links) => [...links, { label: '', url: '' }])}
              className="mt-2 text-sm text-ink-800 underline"
            >
              + Add link
            </button>
          </div>
        </>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !title}
          className="rounded-full bg-ink-800 px-4 py-2 text-sm font-medium text-sand-50 hover:bg-ink-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save item'}
        </button>
        <button onClick={onCancel} className="text-sm text-slate-500">
          Cancel
        </button>
        {item && (
          <button onClick={handleDelete} className="ml-auto text-sm text-red-600">
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
