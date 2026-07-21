import { where, orderBy, listWhere, createDoc, updateDocById, removeDoc } from './crud'
import type { Speaker } from '../../types/models'

const col = 'speakers'

export async function listSpeakers(): Promise<Speaker[]> {
  return listWhere<Speaker>(col, [orderBy('order', 'asc')])
}

export async function listVisibleSpeakers(): Promise<Speaker[]> {
  return listWhere<Speaker>(col, [where('visible', '==', true), orderBy('order', 'asc')])
}

export async function createSpeaker(data: Omit<Speaker, 'id'>): Promise<string> {
  return createDoc<Speaker>(col, data)
}

export async function updateSpeaker(id: string, data: Partial<Speaker>): Promise<void> {
  await updateDocById(col, id, data)
}

export async function deleteSpeaker(id: string): Promise<void> {
  await removeDoc(col, id)
}
