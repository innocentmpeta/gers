import { useEffect, useState } from 'react'
import { listSessions, createSession, updateSession, deleteSession } from '../../../lib/firestore/sessions'
import { getDefaultSymposium } from '../../../lib/firestore/symposia'
import type { Session, Symposium } from '../../../types/models'

type SessionDraft = {
  title: string
  description: string
  startTime: string
  endTime: string
  roomOrTrack: string
  joinLink: string
}

const EMPTY_DRAFT: SessionDraft = {
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  roomOrTrack: '',
  joinLink: '',
}

function toDraft(session: Session): SessionDraft {
  return {
    title: session.title,
    description: session.description ?? '',
    startTime: session.startTime.slice(0, 16),
    endTime: session.endTime.slice(0, 16),
    roomOrTrack: session.roomOrTrack ?? '',
    joinLink: session.joinLink ?? '',
  }
}

export default function AdminProgramme() {
  const [symposium, setSymposium] = useState<Symposium | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<SessionDraft>(EMPTY_DRAFT)
  const [saving, setSaving] = useState(false)

  async function load() {
    const [s, sym] = await Promise.all([listSessions(), getDefaultSymposium()])
    setSessions(s)
    setSymposium(sym)
  }

  useEffect(() => {
    load()
  }, [])

  function startEdit(session: Session) {
    setEditingId(session.id)
    setAdding(false)
    setDraft(toDraft(session))
  }

  function startAdd() {
    setAdding(true)
    setEditingId(null)
    setDraft(EMPTY_DRAFT)
  }

  function cancel() {
    setAdding(false)
    setEditingId(null)
  }

  async function handleSave() {
    if (!symposium) return
    setSaving(true)
    try {
      const payload = {
        symposiumId: symposium.id,
        title: draft.title,
        description: draft.description || undefined,
        startTime: new Date(draft.startTime).toISOString(),
        endTime: new Date(draft.endTime).toISOString(),
        roomOrTrack: draft.roomOrTrack || undefined,
        joinLink: draft.joinLink || undefined,
        day: draft.startTime.slice(0, 10),
      }
      if (editingId) {
        await updateSession(editingId, payload)
      } else {
        await createSession(payload)
      }
      cancel()
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this session?')) return
    await deleteSession(id)
    load()
  }

  const formOpen = adding || editingId

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="text-3xl">Programme</h1>
      <p className="mt-2 text-sm text-slate-500">
        Sessions drive the public Programme page directly — there's no separate CMS copy of the
        schedule to keep in sync.
      </p>

      {!symposium && (
        <p className="mt-6 text-sm text-red-600">No symposium found — run scripts/seed-symposium.cjs first.</p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {sessions.map((session) => (
          <div key={session.id} className="rounded-lg border border-sand-200 bg-white p-4">
            {editingId === session.id ? (
              <SessionForm draft={draft} setDraft={setDraft} onSave={handleSave} onCancel={cancel} saving={saving} />
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    {new Date(session.startTime).toLocaleString()} · {session.roomOrTrack || 'No room set'}
                  </p>
                  <p className="text-teal-900">{session.title}</p>
                </div>
                <div className="flex gap-3 text-sm">
                  <button onClick={() => startEdit(session)} className="text-teal-800 underline">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(session.id)} className="text-red-600">
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {adding && (
          <div className="rounded-lg border border-sand-200 bg-white p-4">
            <SessionForm draft={draft} setDraft={setDraft} onSave={handleSave} onCancel={cancel} saving={saving} />
          </div>
        )}

        {!formOpen && symposium && (
          <button
            onClick={startAdd}
            className="self-start rounded-md border border-dashed border-sand-300 px-4 py-2 text-sm text-teal-800 hover:border-teal-700"
          >
            + Add session
          </button>
        )}
      </div>
    </div>
  )
}

function SessionForm({
  draft,
  setDraft,
  onSave,
  onCancel,
  saving,
}: {
  draft: SessionDraft
  setDraft: (d: SessionDraft) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Title
        <input
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          className="rounded-md border border-sand-200 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Description
        <textarea
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          rows={2}
          className="rounded-md border border-sand-200 px-3 py-2"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Start
          <input
            type="datetime-local"
            value={draft.startTime}
            onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
            className="rounded-md border border-sand-200 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          End
          <input
            type="datetime-local"
            value={draft.endTime}
            onChange={(e) => setDraft({ ...draft, endTime: e.target.value })}
            className="rounded-md border border-sand-200 px-3 py-2"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Room / track
        <input
          value={draft.roomOrTrack}
          onChange={(e) => setDraft({ ...draft, roomOrTrack: e.target.value })}
          className="rounded-md border border-sand-200 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Join link (Zoom/Teams)
        <input
          value={draft.joinLink}
          onChange={(e) => setDraft({ ...draft, joinLink: e.target.value })}
          className="rounded-md border border-sand-200 px-3 py-2"
        />
      </label>
      <div className="flex gap-3">
        <button
          onClick={onSave}
          disabled={saving || !draft.title || !draft.startTime || !draft.endTime}
          className="rounded-full bg-teal-800 px-4 py-2 text-sm font-medium text-sand-50 hover:bg-teal-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save session'}
        </button>
        <button onClick={onCancel} className="text-sm text-slate-500">
          Cancel
        </button>
      </div>
    </div>
  )
}
