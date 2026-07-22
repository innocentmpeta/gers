import { useEffect, useState } from 'react'
import { listFaqItems, createFaqItem, updateFaqItem, deleteFaqItem } from '../../../lib/firestore/faqItems'
import type { FaqItem } from '../../../types/models'

export default function FaqEditor() {
  const [items, setItems] = useState<FaqItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setItems(await listFaqItems())
  }

  useEffect(() => {
    load()
  }, [])

  function startEdit(item: FaqItem) {
    setEditingId(item.id)
    setAdding(false)
    setQuestion(item.question)
    setAnswer(item.answer)
  }

  function startAdd() {
    setAdding(true)
    setEditingId(null)
    setQuestion('')
    setAnswer('')
  }

  function cancel() {
    setAdding(false)
    setEditingId(null)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editingId) {
        await updateFaqItem(editingId, { question, answer })
      } else {
        await createFaqItem({ question, answer, order: items.length })
      }
      cancel()
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this question?')) return
    await deleteFaqItem(id)
    load()
  }

  async function move(item: FaqItem, direction: -1 | 1) {
    const idx = items.findIndex((i) => i.id === item.id)
    const swapWith = items[idx + direction]
    if (!swapWith) return
    await updateFaqItem(item.id, { order: swapWith.order })
    await updateFaqItem(swapWith.id, { order: item.order })
    load()
  }

  const formOpen = adding || editingId

  return (
    <div className="mt-8">
      <h2 className="text-xl">Questions</h2>
      <div className="mt-4 flex flex-col gap-3">
        {items.map((item, idx) =>
          editingId === item.id ? (
            <div key={item.id} className="rounded-lg border border-sand-200 bg-white p-4">
              <FaqForm
                question={question}
                answer={answer}
                setQuestion={setQuestion}
                setAnswer={setAnswer}
                onSave={handleSave}
                onCancel={cancel}
                saving={saving}
              />
            </div>
          ) : (
            <div key={item.id} className="flex items-start justify-between rounded-lg border border-sand-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col text-slate-400">
                  <button onClick={() => move(item, -1)} disabled={idx === 0} className="disabled:opacity-30">
                    ▲
                  </button>
                  <button onClick={() => move(item, 1)} disabled={idx === items.length - 1} className="disabled:opacity-30">
                    ▼
                  </button>
                </div>
                <div>
                  <p className="text-ink-900">{item.question}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.answer}</p>
                </div>
              </div>
              <div className="flex gap-3 text-sm shrink-0">
                <button onClick={() => startEdit(item)} className="text-ink-800 underline">
                  Edit
                </button>
                <button onClick={() => handleDelete(item.id)} className="text-red-600">
                  Delete
                </button>
              </div>
            </div>
          )
        )}

        {adding && (
          <div className="rounded-lg border border-sand-200 bg-white p-4">
            <FaqForm
              question={question}
              answer={answer}
              setQuestion={setQuestion}
              setAnswer={setAnswer}
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
            + Add question
          </button>
        )}
      </div>
    </div>
  )
}

function FaqForm({
  question,
  answer,
  setQuestion,
  setAnswer,
  onSave,
  onCancel,
  saving,
}: {
  question: string
  answer: string
  setQuestion: (v: string) => void
  setAnswer: (v: string) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Question
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="rounded-md border border-sand-200 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Answer
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={3}
          className="rounded-md border border-sand-200 px-3 py-2"
        />
      </label>
      <div className="flex gap-3">
        <button
          onClick={onSave}
          disabled={saving || !question || !answer}
          className="rounded-full bg-ink-800 px-4 py-2 text-sm font-medium text-sand-50 hover:bg-ink-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save question'}
        </button>
        <button onClick={onCancel} className="text-sm text-slate-500">
          Cancel
        </button>
      </div>
    </div>
  )
}
