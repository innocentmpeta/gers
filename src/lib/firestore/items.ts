import { where, orderBy, listWhere, getById, createDoc, updateDocById, removeDoc } from './crud'
import type { Item } from '../../types/models'

const col = 'items'

export async function listItemsForSection(sectionId: string): Promise<Item[]> {
  return listWhere<Item>(col, [where('sectionId', '==', sectionId), orderBy('order', 'asc')])
}

export async function getItem(id: string): Promise<Item | null> {
  return getById<Item>(col, id)
}

export async function getItemByDetailSlug(slug: string): Promise<Item | null> {
  const results = await listWhere<Item>(col, [where('detailPageSlug', '==', slug)])
  return results[0] ?? null
}

export async function createItem(data: Omit<Item, 'id'>): Promise<string> {
  return createDoc<Item>(col, data)
}

export async function updateItem(id: string, data: Partial<Item>): Promise<void> {
  await updateDocById(col, id, data)
}

export async function deleteItem(id: string): Promise<void> {
  await removeDoc(col, id)
}
