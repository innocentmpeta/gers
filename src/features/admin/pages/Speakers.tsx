import { useEffect, useState } from 'react'
import MediaPicker from '../../../components/cms/MediaPicker'
import { listSpeakers, createSpeaker, updateSpeaker, deleteSpeaker } from '../../../lib/firestore/speakers'
import { listSessions } from '../../../lib/firestore/sessions'
import type { MediaAsset, Session, Speaker } from '../../../types/models'

type Draft = {
  name: string
  title: string
  bio: string
  photoMediaId?: string
  sessionId: string
}

const EMPTY: Draft = { name: '', title: '', bio: '', photoMediaId: undefined, sessionId: '' }

function toDraft(speaker: Speaker): Draft {
  return {
    name: speaker.name,
    title: speaker.title ?? '',
    bio: speaker.bio ?? '',
    photoMediaId: speaker.photoMediaId,
    sessionId: speaker.sessionId ?? '',
  }
}

export default function AdminSpeakers() {
  const [speakers, setSpeakers] = useState<Speaker[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [photo, setPhoto] = useState<MediaAsset | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const [s, sess] = await Promise.all([listSpeakers(), listSessions()])
    setSpeakers(s)
    setSessions(sess)
  }

  useEffect(() => {
    load()
  }, [])

  function startEdit(speaker: Speaker) {
    setEditingId(speaker.id)
    setAdding(false)
    setDraft(toDraft(speaker))
    setPhoto(null)
  }

  function startAdd() {
    setAdding(true)
    setEditingId(null)
    setDraft(EMPTY)
    setPhoto(null)
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
        title: draft.title || undefined,
        bio: draft.bio || undefined,
        photoMediaId: photo?.id ?? draft.photoMediaId,
        sessionId: draft.sessionId || undefined,
      }
      if (editingId) {
        await updateSpeaker(editingId, payload)
      } else {
        await createSpeaker({ ...payload, order: speakers.length, visible: true })
      }
      cancel()
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this speaker?')) return
    await deleteSpeaker(id)
    load()
  }

  async function toggleVisible(speaker: Speaker) {
    await updateSpeaker(speaker.id, { visible: !speaker.visible })
    load()
  }

  const formOpen = adding || editingId

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="text-3xl">Speakers</h1>
      <p className="mt-2 text-sm text-slate-500">
        Curated public profiles — not a direct view of registration data, since a presenter's
        registration also carries payment and accommodation details that shouldn't be public.
        Toggle visibility off for a late cancellation without deleting the profile.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {speakers.map((speaker) =>
          editingId === speaker.id ? (
            <div key={speaker.id} className="rounded-lg border border-sand-200 bg-white p-4">
              <SpeakerForm
                draft={draft}
                setDraft={setDraft}
                photo={photo}
                setPhoto={setPhoto}
                sessions={sessions}
                onSave={handleSave}
                onCancel={cancel}
                saving={saving}
              />
            </div>
          ) : (
            <div key={speaker.id} className="flex items-center justify-between rounded-lg border border-sand-200 bg-white p-4">
              <div>
                <p className="text-teal-900">{speaker.name}</p>
                {speaker.title && <p className="text-sm text-slate-500">{speaker.title}</p>}
                {!speaker.visible && <p className="text-xs text-red-600">Hidden from public site</p>}
              </div>
              <div className="flex gap-3 text-sm">
                <button onClick={() => toggleVisible(speaker)} className="text-teal-800 underline">
                  {speaker.visible ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => startEdit(speaker)} className="text-teal-800 underline">
                  Edit
                </button>
                <button onClick={() => handleDelete(speaker.id)} className="text-red-600">
                  Delete
                </button>
              </div>
            </div>
          )
        )}

        {adding && (
          <div className="rounded-lg border border-sand-200 bg-white p-4">
            <SpeakerForm
              draft={draft}
              setDraft={setDraft}
              photo={photo}
              setPhoto={setPhoto}
              sessions={sessions}
              onSave={handleSave}
              onCancel={cancel}
              saving={saving}
            />
          </div>
        )}

        {!formOpen && (
          <button
            onClick={startAdd}
            className="self-start rounded-md border border-dashed border-sand-300 px-4 py-2 text-sm text-teal-800 hover:border-teal-700"
          >
            + Add speaker
          </button>
        )}
      </div>
    </div>
  )
}

function SpeakerForm({
  draft,
  setDraft,
  photo,
  setPhoto,
  sessions,
  onSave,
  onCancel,
  saving,
}: {
  draft: Draft
  setDraft: (d: Draft) => void
  photo: MediaAsset | null
  setPhoto: (a: MediaAsset | null) => void
  sessions: Session[]
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
        Title / affiliation
        <input
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          className="rounded-md border border-sand-200 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Bio
        <textarea
          value={draft.bio}
          onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
          rows={3}
          className="rounded-md border border-sand-200 px-3 py-2"
        />
      </label>
      <MediaPicker
        label="Photo"
        accept="image"
        selectedAssetId={photo?.id ?? draft.photoMediaId}
        onSelect={setPhoto}
      />
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Session (optional)
        <select
          value={draft.sessionId}
          onChange={(e) => setDraft({ ...draft, sessionId: e.target.value })}
          className="rounded-md border border-sand-200 px-3 py-2"
        >
          <option value="">None</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-3">
        <button
          onClick={onSave}
          disabled={saving || !draft.name}
          className="rounded-full bg-teal-800 px-4 py-2 text-sm font-medium text-sand-50 hover:bg-teal-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save speaker'}
        </button>
        <button onClick={onCancel} className="text-sm text-slate-500">
          Cancel
        </button>
      </div>
    </div>
  )
}
