import { useEffect, useState } from 'react'
import { getDefaultSymposium } from '../../../lib/firestore/symposia'
import { listCommunities, createCommunity, updateCommunity, deleteCommunity } from '../../../lib/firestore/communities'
import type { Symposium, ThematicCommunity } from '../../../types/models'

type Draft = { label: string; description: string }
const EMPTY: Draft = { label: '', description: '' }

export default function AdminCommunities() {
  const [symposium, setSymposium] = useState<Symposium | null>(null)
  const [communities, setCommunities] = useState<ThematicCommunity[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [saving, setSaving] = useState(false)

  async function load() {
    const s = await getDefaultSymposium()
    setSymposium(s)
    if (s) setCommunities(await listCommunities(s.id))
  }

  useEffect(() => {
    load()
  }, [])

  function startEdit(c: ThematicCommunity) {
    setEditingId(c.id)
    setAdding(false)
    setDraft({ label: c.label, description: c.description ?? '' })
  }

  function startAdd() {
    setAdding(true)
    setEditingId(null)
    setDraft(EMPTY)
  }

  function cancel() {
    setAdding(false)
    setEditingId(null)
  }

  async function handleSave() {
    if (!symposium) return
    setSaving(true)
    try {
      const payload = { label: draft.label, description: draft.description || undefined, symposiumId: symposium.id }
      if (editingId) {
        await updateCommunity(editingId, payload)
      } else {
        await createCommunity(payload)
      }
      cancel()
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this community? Members currently opted in will lose that tag.')) return
    await deleteCommunity(id)
    load()
  }

  const formOpen = adding || editingId

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <h1 className="text-3xl">Thematic Communities</h1>
      <p className="mt-2 text-sm text-slate-500">
        Topics members can opt into from their account, used to filter the community-of-practice
        directory.
      </p>

      {!symposium && <p className="mt-6 text-sm text-slate-400">No symposium set up yet.</p>}

      {symposium && (
        <div className="mt-6 flex flex-col gap-3">
          {communities.map((c) =>
            editingId === c.id ? (
              <div key={c.id} className="rounded-lg border border-sand-200 bg-white p-4">
                <CommunityForm draft={draft} setDraft={setDraft} onSave={handleSave} onCancel={cancel} saving={saving} />
              </div>
            ) : (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-sand-200 bg-white p-4">
                <div>
                  <p className="text-ink-900">{c.label}</p>
                  {c.description && <p className="text-sm text-slate-500">{c.description}</p>}
                </div>
                <div className="flex gap-3 text-sm">
                  <button onClick={() => startEdit(c)} className="text-ink-800 underline">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-600">
                    Delete
                  </button>
                </div>
              </div>
            )
          )}

          {adding && (
            <div className="rounded-lg border border-sand-200 bg-white p-4">
              <CommunityForm draft={draft} setDraft={setDraft} onSave={handleSave} onCancel={cancel} saving={saving} />
            </div>
          )}

          {!formOpen && (
            <button
              onClick={startAdd}
              className="self-start rounded-md border border-dashed border-sand-300 px-4 py-2 text-sm text-ink-800 hover:border-ink-700"
            >
              + Add community
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function CommunityForm({
  draft,
  setDraft,
  onSave,
  onCancel,
  saving,
}: {
  draft: Draft
  setDraft: (d: Draft) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Label
        <input
          value={draft.label}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          className="rounded-md border border-sand-200 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Description (optional)
        <textarea
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          rows={2}
          className="rounded-md border border-sand-200 px-3 py-2"
        />
      </label>
      <div className="flex gap-3">
        <button
          onClick={onSave}
          disabled={saving || !draft.label}
          className="rounded-full bg-ink-800 px-4 py-2 text-sm font-medium text-sand-50 hover:bg-ink-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save community'}
        </button>
        <button onClick={onCancel} className="text-sm text-slate-500">
          Cancel
        </button>
      </div>
    </div>
  )
}
