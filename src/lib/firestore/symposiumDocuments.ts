import { where, orderBy, listWhere, createDoc, updateDocById, removeDoc } from './crud'
import type { SymposiumDocument } from '../../types/models'

const col = 'symposiumDocuments'

// Admin-facing — every document for the symposium, visible or not.
export async function listDocuments(symposiumId: string): Promise<SymposiumDocument[]> {
  return listWhere<SymposiumDocument>(col, [where('symposiumId', '==', symposiumId), orderBy('order', 'asc')])
}

// Attendee-facing (AccountHome) — only what's been flagged visible.
export async function listVisibleDocuments(symposiumId: string): Promise<SymposiumDocument[]> {
  const all = await listDocuments(symposiumId)
  return all.filter((d) => d.visibleToAttendees)
}

export async function createDocument(data: Omit<SymposiumDocument, 'id'>): Promise<string> {
  return createDoc<SymposiumDocument>(col, data)
}

export async function updateDocument(id: string, data: Partial<SymposiumDocument>): Promise<void> {
  await updateDocById(col, id, data)
}

export async function deleteDocument(id: string): Promise<void> {
  await removeDoc(col, id)
}
