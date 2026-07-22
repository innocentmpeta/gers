import { listWhere, createDoc, updateDocById, removeDoc } from './crud'
import type { ThematicCommunity } from '../../types/models'

const col = 'thematicCommunities'

export async function listThematicCommunities(): Promise<ThematicCommunity[]> {
  return listWhere<ThematicCommunity>(col, [])
}

export async function createThematicCommunity(data: Omit<ThematicCommunity, 'id'>): Promise<string> {
  return createDoc<ThematicCommunity>(col, data)
}

export async function updateThematicCommunity(id: string, data: Partial<ThematicCommunity>): Promise<void> {
  await updateDocById(col, id, data)
}

export async function deleteThematicCommunity(id: string): Promise<void> {
  await removeDoc(col, id)
}
