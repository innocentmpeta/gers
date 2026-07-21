import { orderBy, listWhere, createDoc, updateDocById, removeDoc } from './crud'
import type { FaqItem } from '../../types/models'

const col = 'faqItems'

export async function listFaqItems(): Promise<FaqItem[]> {
  return listWhere<FaqItem>(col, [orderBy('order', 'asc')])
}

export async function createFaqItem(data: Omit<FaqItem, 'id'>): Promise<string> {
  return createDoc<FaqItem>(col, data)
}

export async function updateFaqItem(id: string, data: Partial<FaqItem>): Promise<void> {
  await updateDocById(col, id, data)
}

export async function deleteFaqItem(id: string): Promise<void> {
  await removeDoc(col, id)
}
