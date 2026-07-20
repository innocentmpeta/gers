import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from '../firebase'

// Small generic helpers shared by the CMS repositories (pages/sections/items/
// heroes/mediaAssets/knowledgeBaseDocuments) so each one stays a thin,
// typed wrapper instead of repeating this boilerplate.

export async function listWhere<T>(
  collectionName: string,
  constraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T)
}

export async function getById<T>(collectionName: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(db, collectionName, id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null
}

// Firestore rejects explicit `undefined` field values (unlike `null`), and our
// domain types use optional fields (e.g. Item.tag?, Hero.imageId?) that end up
// as `undefined` when unset. Every write goes through here so callers can pass
// those types straight through without each one remembering to strip them.
function omitUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  const result: Partial<T> = {}
  for (const key in data) {
    if (data[key] !== undefined) result[key] = data[key]
  }
  return result
}

export async function createDoc<T extends { id?: string }>(
  collectionName: string,
  data: Omit<T, 'id'>
): Promise<string> {
  const ref = await addDoc(collection(db, collectionName), omitUndefined(data as Record<string, unknown>))
  return ref.id
}

export async function updateDocById(
  collectionName: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  await updateDoc(doc(db, collectionName, id), omitUndefined(data))
}

export async function removeDoc(collectionName: string, id: string): Promise<void> {
  await deleteDoc(doc(db, collectionName, id))
}

export { where, orderBy }
