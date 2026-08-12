import { useEffect, useState } from 'react'
import { useAuth } from '../../../lib/auth'
import MediaPicker from '../../../components/cms/MediaPicker'
import { getDefaultSymposium } from '../../../lib/firestore/symposia'
import {
  listDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../../../lib/firestore/symposiumDocuments'
import type { DocumentCategory, MediaAsset, Symposium, SymposiumDocument } from '../../../types/models'

const CATEGORY_LABEL: Record<DocumentCategory, string> = {
  presentation: 'Presentation',
  report: 'Report',
  other: 'Other',
}

type Draft = {
  title: string
  category: DocumentCategory
  mediaAssetId?: string
  visibleToAttendees: boolean
}

const EMPTY: Draft = { title: '', category: 'presentation', mediaAssetId: undefined, visibleToAttendees: false }

function toDraft(doc: SymposiumDocument): Draft {
  return {
    title: doc.title,
    category: doc.category,
    mediaAssetId: doc.mediaAssetId,
    visibleToAttendees: doc.visibleToAttendees,
  }
}

export default function AdminDocuments() {
  const { firebaseUser } = useAuth()
  const [symposium, setSymposium] = useState<Symposium | null>(null)
  const [documents, setDocuments] = useState<SymposiumDocument[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [file, setFile] = useState<MediaAsset | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const s = await getDefaultSymposium()
    setSymposium(s)
    if (s) setDocuments(await listDocuments(s.id))
  }

  useEffect(() => {
    load()
  }, [])

  function startEdit(doc: SymposiumDocument) {
    setEditingId(doc.id)
    setAdding(false)
    setDraft(toDraft(doc))
    setFile(null)
  }

  function startAdd() {
    setAdding(true)
    setEditingId(null)
    setDraft(EMPTY)
    setFile(null)
  }

  function cancel() {
    setAdding(false)
    setEditingId(null)
  }

  async function handleSave() {
    if (!symposium || !firebaseUser) return
    const mediaAssetId = file?.id ?? draft.mediaAssetId
    if (!mediaAssetId) return
    setSaving(true)
    try {
      const payload = {
        title: draft.title,
        category: draft.category,
        mediaAssetId,
        visibleToAttendees: draft.visibleToAttendees,
      }
      if (editingId) {
        await updateDocument(editingId, payload)
      } else {
        await createDocument({
          ...payload,
          symposiumId: symposium.id,
          order: documents.length,
          uploadedBy: firebaseUser.uid,
          uploadedAt: new Date().toISOString(),
        })
      }
      cancel()
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this document? It will disappear from any account it was showing on.')) return
    await deleteDocument(id)
    load()
  }

  async function toggleVisible(doc: SymposiumDocument) {
    await updateDocument(doc.id, { visibleToAttendees: !doc.visibleToAttendees })
    load()
  }

  const formOpen = adding || editingId

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <h1 className="text-3xl">Documents</h1>
      <p className="mt-2 text-sm text-slate-500">
        Presentations, reports, and other symposium documents. Toggle visibility on to show a
        document as a download on attendees' account pages.
      </p>

      {!symposium && <p className="mt-6 text-sm text-slate-400">No symposium set up yet.</p>}

      {symposium && (
        <div className="mt-6 flex flex-col gap-3">
          {documents.map((doc) =>
            editingId === doc.id ? (
              <div key={doc.id} className="rounded-lg border border-sand-200 bg-white p-4">
                <DocumentForm draft={draft} setDraft={setDraft} file={file} setFile={setFile} onSave={handleSave} onCancel={cancel} saving={saving} />
              </div>
            ) : (
              <div key={doc.id} className="flex items-center justify-between rounded-lg border border-sand-200 bg-white p-4">
                <div>
                  <p className="text-ink-900">{doc.title}</p>
                  <p className="text-sm text-slate-500">{CATEGORY_LABEL[doc.category]}</p>
                  {!doc.visibleToAttendees && <p className="text-xs text-red-600">Hidden from accounts</p>}
                </div>
                <div className="flex gap-3 text-sm">
                  <button onClick={() => toggleVisible(doc)} className="text-ink-800 underline">
                    {doc.visibleToAttendees ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => startEdit(doc)} className="text-ink-800 underline">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(doc.id)} className="text-red-600">
                    Delete
                  </button>
                </div>
              </div>
            )
          )}

          {adding && (
            <div className="rounded-lg border border-sand-200 bg-white p-4">
              <DocumentForm draft={draft} setDraft={setDraft} file={file} setFile={setFile} onSave={handleSave} onCancel={cancel} saving={saving} />
            </div>
          )}

          {!formOpen && (
            <button
              onClick={startAdd}
              className="self-start rounded-md border border-dashed border-sand-300 px-4 py-2 text-sm text-ink-800 hover:border-ink-700"
            >
              + Add document
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function DocumentForm({
  draft,
  setDraft,
  file,
  setFile,
  onSave,
  onCancel,
  saving,
}: {
  draft: Draft
  setDraft: (d: Draft) => void
  file: MediaAsset | null
  setFile: (a: MediaAsset | null) => void
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
        Category
        <select
          value={draft.category}
          onChange={(e) => setDraft({ ...draft, category: e.target.value as DocumentCategory })}
          className="rounded-md border border-sand-200 px-3 py-2"
        >
          <option value="presentation">Presentation</option>
          <option value="report">Report</option>
          <option value="other">Other</option>
        </select>
      </label>
      <MediaPicker
        label="File"
        accept="document"
        selectedAssetId={file?.id ?? draft.mediaAssetId}
        onSelect={setFile}
      />
      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={draft.visibleToAttendees}
          onChange={(e) => setDraft({ ...draft, visibleToAttendees: e.target.checked })}
        />
        Show on attendees' accounts
      </label>
      <div className="flex gap-3">
        <button
          onClick={onSave}
          disabled={saving || !draft.title || !(file?.id ?? draft.mediaAssetId)}
          className="rounded-full bg-ink-800 px-4 py-2 text-sm font-medium text-sand-50 hover:bg-ink-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save document'}
        </button>
        <button onClick={onCancel} className="text-sm text-slate-500">
          Cancel
        </button>
      </div>
    </div>
  )
}
