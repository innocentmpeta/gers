import { where, listWhere, createDoc, updateDocById } from './crud'
import type { HomeContent } from '../../types/models'

const col = 'homeContent'

export async function getHomeContent(pageId: string): Promise<HomeContent | null> {
  const results = await listWhere<HomeContent>(col, [where('pageId', '==', pageId)])
  return results[0] ?? null
}

export async function saveHomeContent(
  pageId: string,
  data: Omit<HomeContent, 'id' | 'pageId'>
): Promise<void> {
  const existing = await getHomeContent(pageId)
  if (existing) {
    await updateDocById(col, existing.id, data)
  } else {
    await createDoc<HomeContent>(col, { ...data, pageId })
  }
}
