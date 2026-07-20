import { where, listWhere, getById, updateDocById } from './crud'
import type { Page } from '../../types/models'

const col = 'pages'

export async function listPages(): Promise<Page[]> {
  return listWhere<Page>(col, [])
}

export async function getPage(id: string): Promise<Page | null> {
  return getById<Page>(col, id)
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  const results = await listWhere<Page>(col, [where('slug', '==', slug)])
  return results[0] ?? null
}

export async function updatePage(id: string, data: Partial<Page>): Promise<void> {
  await updateDocById(col, id, data)
}
