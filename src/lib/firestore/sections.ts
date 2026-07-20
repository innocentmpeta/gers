import { where, orderBy, listWhere, createDoc, updateDocById, removeDoc } from './crud'
import type { Section } from '../../types/models'

const col = 'sections'

export async function listSectionsForPage(pageId: string): Promise<Section[]> {
  return listWhere<Section>(col, [where('pageId', '==', pageId), orderBy('order', 'asc')])
}

export async function createSection(data: Omit<Section, 'id'>): Promise<string> {
  return createDoc<Section>(col, data)
}

export async function updateSection(id: string, data: Partial<Section>): Promise<void> {
  await updateDocById(col, id, data)
}

export async function deleteSection(id: string): Promise<void> {
  await removeDoc(col, id)
}
