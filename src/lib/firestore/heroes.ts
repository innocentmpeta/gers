import { where, listWhere, createDoc, updateDocById } from './crud'
import type { Hero } from '../../types/models'

const col = 'heroes'

export async function getHeroForPage(pageId: string): Promise<Hero | null> {
  const results = await listWhere<Hero>(col, [where('pageId', '==', pageId)])
  return results[0] ?? null
}

// Upsert — a page has at most one hero (GERS_Technical_Data_Model.docx §3.14).
export async function saveHero(pageId: string, data: Omit<Hero, 'id' | 'pageId'>): Promise<void> {
  const existing = await getHeroForPage(pageId)
  if (existing) {
    await updateDocById(col, existing.id, data)
  } else {
    await createDoc<Hero>(col, { ...data, pageId })
  }
}
