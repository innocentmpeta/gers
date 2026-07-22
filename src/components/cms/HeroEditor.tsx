import { useState } from 'react'
import MediaPicker from './MediaPicker'
import { saveHero } from '../../lib/firestore/heroes'
import type { Hero, MediaAsset } from '../../types/models'

interface HeroEditorProps {
  pageId: string
  hero: Hero | null
  onSaved: (hero: Hero) => void
}

type HeroDraft = Omit<Hero, 'id' | 'pageId'>

function toDraft(hero: Hero | null): HeroDraft {
  return {
    imageId: hero?.imageId,
    focalPoint: hero?.focalPoint ?? { x: 50, y: 50 },
    eyebrowText: hero?.eyebrowText ?? '',
    headline: hero?.headline ?? '',
    subtext: hero?.subtext ?? '',
    eventStartDate: hero?.eventStartDate ?? '',
    eventEndDate: hero?.eventEndDate ?? '',
    cta1Label: hero?.cta1Label ?? '',
    cta1Link: hero?.cta1Link ?? '',
    cta2Label: hero?.cta2Label ?? '',
    cta2Link: hero?.cta2Link ?? '',
  }
}

export default function HeroEditor({ pageId, hero, onSaved }: HeroEditorProps) {
  const [draft, setDraft] = useState<HeroDraft>(toDraft(hero))
  const [image, setImage] = useState<MediaAsset | null>(null)
  const [saving, setSaving] = useState(false)

  function field<K extends keyof HeroDraft>(key: K) {
    return {
      value: (draft[key] as string) ?? '',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setDraft((d) => ({ ...d, [key]: e.target.value })),
    }
  }

  function handleFocalClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100)
    setDraft((d) => ({ ...d, focalPoint: { x, y } }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveHero(pageId, { ...draft, imageId: image?.id ?? draft.imageId })
      onSaved({ id: hero?.id ?? '', pageId, ...draft, imageId: image?.id ?? draft.imageId })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-sand-200 bg-white p-5">
      <h3 className="text-lg">Hero</h3>
      <p className="mt-1 text-sm text-slate-500">
        Optional. Leave the image empty and the page falls back to a solid brand-colour banner.
      </p>

      <div className="mt-4">
        <MediaPicker
          label="Image"
          accept="image"
          selectedAssetId={image?.id ?? draft.imageId}
          onSelect={(asset) => setImage(asset)}
        />
      </div>

      {image && (
        <div className="mt-3">
          <p className="text-sm text-slate-700">Focal point (click the image)</p>
          <div className="relative mt-1 max-w-sm cursor-crosshair" onClick={handleFocalClick}>
            <img src={image.fileUrl} alt="" className="w-full rounded" />
            <div
              className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-gold-500 shadow"
              style={{ left: `${draft.focalPoint?.x ?? 50}%`, top: `${draft.focalPoint?.y ?? 50}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4">
        <label className="col-span-2 flex flex-col gap-1 text-sm text-slate-700">
          Eyebrow label
          <input {...field('eyebrowText')} className="rounded-md border border-sand-200 px-3 py-2" />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-sm text-slate-700">
          Headline
          <input {...field('headline')} className="rounded-md border border-sand-200 px-3 py-2" />
        </label>
        <label className="col-span-2 flex flex-col gap-1 text-sm text-slate-700">
          Subtext
          <input {...field('subtext')} className="rounded-md border border-sand-200 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Start date
          <input type="date" {...field('eventStartDate')} className="rounded-md border border-sand-200 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          End date (optional, for multi-day events)
          <input type="date" {...field('eventEndDate')} className="rounded-md border border-sand-200 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          CTA 1 label
          <input {...field('cta1Label')} className="rounded-md border border-sand-200 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          CTA 1 link
          <input {...field('cta1Link')} className="rounded-md border border-sand-200 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          CTA 2 label
          <input {...field('cta2Label')} className="rounded-md border border-sand-200 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          CTA 2 link
          <input {...field('cta2Link')} className="rounded-md border border-sand-200 px-3 py-2" />
        </label>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-5 rounded-full bg-ink-800 px-4 py-2 text-sm font-medium text-sand-50 hover:bg-ink-700 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save hero'}
      </button>
    </div>
  )
}
