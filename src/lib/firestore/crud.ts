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

// Firestore rejects explicit `undefined` field values (unlike `null`) anywhere
// in the payload, including nested inside arrays/objects (e.g.
// HomeContent.exploreCards[].imageId) — a top-level-only strip isn't enough,
// it just moves the crash one level down. Every write goes through here so
// callers can pass optional-field-bearing domain types straight through.
function omitUndefinedDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(omitUndefinedDeep)
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const key in value as Record<string, unknown>) {
      const v = (value as Record<string, unknown>)[key]
      if (v !== undefined) result[key] = omitUndefinedDeep(v)
    }
    return result
  }
  return value
}

function omitUndefined<T extends Record<string, unknown>>(data: T): Partial<T> {
  return omitUndefinedDeep(data) as Partial<T>
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
