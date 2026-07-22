import { useEffect, useState } from 'react'
import ItemForm from './ItemForm'
import { listItemsForSection, updateItem, deleteItem } from '../../../lib/firestore/items'
import { updateSection, deleteSection } from '../../../lib/firestore/sections'
import type { Item, Section, SectionLayout } from '../../../types/models'

interface SectionEditorProps {
  section: Section
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onDeleted: () => void
}

export default function SectionEditor({
  section,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onDeleted,
}: SectionEditorProps) {
  const [items, setItems] = useState<Item[]>([])
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [addingNew, setAddingNew] = useState(false)

  async function refreshItems() {
    setItems(await listItemsForSection(section.id))
    setEditingItemId(null)
    setAddingNew(false)
  }

  useEffect(() => {
    refreshItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.id])

  async function handleLayoutChange(layout: SectionLayout) {
    await updateSection(section.id, { layout })
  }

  async function handleDeleteSection() {
    if (!confirm('Delete this section and all its items?')) return
    await Promise.all(items.map((item) => deleteItem(item.id)))
    await deleteSection(section.id)
    onDeleted()
  }

  async function moveItem(item: Item, direction: -1 | 1) {
    const idx = items.findIndex((i) => i.id === item.id)
    const swapWith = items[idx + direction]
    if (!swapWith) return
    await updateItem(item.id, { order: swapWith.order })
    await updateItem(swapWith.id, { order: item.order })
    refreshItems()
  }

  return (
    <div className="rounded-lg border border-sand-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onMoveUp} disabled={!canMoveUp} className="text-slate-400 disabled:opacity-30">
            ↑
          </button>
          <button onClick={onMoveDown} disabled={!canMoveDown} className="text-slate-400 disabled:opacity-30">
            ↓
          </button>
          <select
            value={section.layout}
            onChange={(e) => handleLayoutChange(e.target.value as SectionLayout)}
            className="rounded-md border border-sand-200 px-2 py-1 text-sm"
          >
            <option value="grid">Grid of cards</option>
            <option value="feature_rows">Alternating feature rows</option>
          </select>
        </div>
        <button onClick={handleDeleteSection} className="text-sm text-red-600">
          Delete section
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {items.map((item, idx) =>
          editingItemId === item.id ? (
            <ItemForm
              key={item.id}
              sectionId={section.id}
              order={item.order}
              item={item}
              onSaved={refreshItems}
              onCancel={() => setEditingItemId(null)}
            />
          ) : (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-md border border-sand-100 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col text-slate-400">
                  <button onClick={() => moveItem(item, -1)} disabled={idx === 0} className="disabled:opacity-30">
                    ▲
                  </button>
                  <button
                    onClick={() => moveItem(item, 1)}
                    disabled={idx === items.length - 1}
                    className="disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
                <span>{item.title}</span>
              </div>
              <button onClick={() => setEditingItemId(item.id)} className="text-sm text-ink-800 underline">
                Edit
              </button>
            </div>
          )
        )}

        {addingNew ? (
          <ItemForm
            sectionId={section.id}
            order={items.length}
            item={null}
            onSaved={refreshItems}
            onCancel={() => setAddingNew(false)}
          />
        ) : (
          <button
            onClick={() => setAddingNew(true)}
            className="self-start rounded-md border border-dashed border-sand-200 px-3 py-2 text-sm text-ink-800 hover:border-ink-700"
          >
            + Add item
          </button>
        )}
      </div>
    </div>
  )
}
