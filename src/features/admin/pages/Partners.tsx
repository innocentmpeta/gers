import { useEffect, useState } from 'react'
import MediaPicker from '../../../components/cms/MediaPicker'
import { RichTextHint } from '../../../components/RichText'
import {
  listPartners,
  createPartner,
  updatePartner,
  deletePartner,
} from '../../../lib/firestore/partnerProfiles'
import type { MediaAsset, PartnerCategory, PartnerProfile } from '../../../types/models'

const CATEGORY_LABEL: Record<PartnerCategory, string> = {
  exhibitor: 'Exhibitors',
  partner: 'Partners',
}

type Draft = {
  name: string
  contactName: string
  blurb: string
  logoMediaId?: string
  imageMediaId?: string
  websiteUrl: string
}

const EMPTY: Draft = {
  name: '',
  contactName: '',
  blurb: '',
  logoMediaId: undefined,
  imageMediaId: undefined,
  websiteUrl: '',
}

function toDraft(partner: PartnerProfile): Draft {
  return {
    name: partner.name,
    contactName: partner.contactName ?? '',
    blurb: partner.blurb ?? '',
    logoMediaId: partner.logoMediaId,
    imageMediaId: partner.imageMediaId,
    websiteUrl: partner.websiteUrl ?? '',
  }
}

export default function AdminPartners() {
  const [category, setCategory] = useState<PartnerCategory>('exhibitor')
  const [partners, setPartners] = useState<PartnerProfile[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [logo, setLogo] = useState<MediaAsset | null>(null)
  const [image, setImage] = useState<MediaAsset | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    setPartners(await listPartners(category))
  }

  useEffect(() => {
    load()
    setEditingId(null)
    setAdding(false)
  }, [category])

  function startEdit(partner: PartnerProfile) {
    setEditingId(partner.id)
    setAdding(false)
    setDraft(toDraft(partner))
    setLogo(null)
    setImage(null)
  }

  function startAdd() {
    setAdding(true)
    setEditingId(null)
    setDraft(EMPTY)
    setLogo(null)
    setImage(null)
  }

  function cancel() {
    setAdding(false)
    setEditingId(null)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        name: draft.name,
        contactName: draft.contactName || undefined,
        blurb: draft.blurb || undefined,
        logoMediaId: logo?.id ?? draft.logoMediaId,
        imageMediaId: image?.id ?? draft.imageMediaId,
        websiteUrl: draft.websiteUrl || undefined,
      }
      if (editingId) {
        await updatePartner(editingId, payload)
      } else {
        await createPartner({ ...payload, category, order: partners.length, visible: true })
      }
      cancel()
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this profile?')) return
    await deletePartner(id)
    load()
  }

  async function toggleVisible(partner: PartnerProfile) {
    await updatePartner(partner.id, { visible: !partner.visible })
    load()
  }

  async function move(partner: PartnerProfile, direction: -1 | 1) {
    const idx = partners.findIndex((p) => p.id === partner.id)
    const swapWith = partners[idx + direction]
    if (!swapWith) return
    await updatePartner(partner.id, { order: swapWith.order })
    await updatePartner(swapWith.id, { order: partner.order })
    load()
  }

  const formOpen = adding || editingId

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="text-3xl">Partners</h1>
      <p className="mt-2 text-sm text-slate-500">
        Curated public profiles for exhibitors and facilitators — attendees with those roles can
        submit their own from their account, which land here hidden until you review and show them.
      </p>

      <div className="mt-6 flex gap-2 text-sm">
        {(['exhibitor', 'partner'] as PartnerCategory[]).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1.5 ${
              category === c ? 'bg-ink-900 text-sand-50' : 'bg-sand-100 text-slate-700 hover:bg-sand-200'
            }`}
          >
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {partners.map((partner, idx) =>
          editingId === partner.id ? (
            <div key={partner.id} className="rounded-lg border border-sand-200 bg-white p-4">
              <PartnerForm
                draft={draft}
                setDraft={setDraft}
                logo={logo}
                setLogo={setLogo}
                image={image}
                setImage={setImage}
                onSave={handleSave}
                onCancel={cancel}
                saving={saving}
              />
            </div>
          ) : (
            <div
              key={partner.id}
              className="flex items-center justify-between rounded-lg border border-sand-200 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-slate-400">
                  <button onClick={() => move(partner, -1)} disabled={idx === 0} className="disabled:opacity-30">
                    ▲
                  </button>
                  <button
                    onClick={() => move(partner, 1)}
                    disabled={idx === partners.length - 1}
                    className="disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
                <div>
                  <p className="text-ink-900">{partner.name}</p>
                  {!partner.visible && partner.userId && (
                    <p className="text-xs text-gold-600">Self-submitted — pending review</p>
                  )}
                  {!partner.visible && !partner.userId && (
                    <p className="text-xs text-red-600">Hidden from public site</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 text-sm shrink-0">
                <button onClick={() => toggleVisible(partner)} className="text-ink-800 underline">
                  {partner.visible ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => startEdit(partner)} className="text-ink-800 underline">
                  Edit
                </button>
                <button onClick={() => handleDelete(partner.id)} className="text-red-600">
                  Delete
                </button>
              </div>
            </div>
          )
        )}

        {partners.length === 0 && !adding && (
          <p className="text-sm text-slate-500">No {CATEGORY_LABEL[category].toLowerCase()} yet.</p>
        )}

        {adding && (
          <div className="rounded-lg border border-sand-200 bg-white p-4">
            <PartnerForm
              draft={draft}
              setDraft={setDraft}
              logo={logo}
              setLogo={setLogo}
              image={image}
              setImage={setImage}
              onSave={handleSave}
              onCancel={cancel}
              saving={saving}
            />
          </div>
        )}

        {!formOpen && (
          <button
            onClick={startAdd}
            className="self-start rounded-md border border-dashed border-sand-300 px-4 py-2 text-sm text-ink-800 hover:border-ink-700"
          >
            + Add {category}
          </button>
        )}
      </div>
    </div>
  )
}

function PartnerForm({
  draft,
  setDraft,
  logo,
  setLogo,
  image,
  setImage,
  onSave,
  onCancel,
  saving,
}: {
  draft: Draft
  setDraft: (d: Draft) => void
  logo: MediaAsset | null
  setLogo: (a: MediaAsset | null) => void
  image: MediaAsset | null
  setImage: (a: MediaAsset | null) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Name
        <input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          className="rounded-md border border-sand-200 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Contact name (optional — shown on the Exhibition page for exhibitors)
        <input
          value={draft.contactName}
          onChange={(e) => setDraft({ ...draft, contactName: e.target.value })}
          className="rounded-md border border-sand-200 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Blurb
        <textarea
          value={draft.blurb}
          onChange={(e) => setDraft({ ...draft, blurb: e.target.value })}
          rows={3}
          className="rounded-md border border-sand-200 px-3 py-2"
        />
        <RichTextHint />
      </label>
      <MediaPicker label="Logo" accept="image" selectedAssetId={logo?.id ?? draft.logoMediaId} onSelect={setLogo} />
      <MediaPicker label="Image" accept="image" selectedAssetId={image?.id ?? draft.imageMediaId} onSelect={setImage} />
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Website (optional)
        <input
          value={draft.websiteUrl}
          onChange={(e) => setDraft({ ...draft, websiteUrl: e.target.value })}
          className="rounded-md border border-sand-200 px-3 py-2"
        />
      </label>
      <div className="flex gap-3">
        <button
          onClick={onSave}
          disabled={saving || !draft.name}
          className="rounded-full bg-ink-800 px-4 py-2 text-sm font-medium text-sand-50 hover:bg-ink-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onCancel} className="text-sm text-slate-500">
          Cancel
        </button>
      </div>
    </div>
  )
}
