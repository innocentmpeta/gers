import { orderBy, listWhere, getById, createDoc, updateDocById, removeDoc } from './crud'
import type { Session } from '../../types/models'

const col = 'sessions'

export async function listSessions(): Promise<Session[]> {
  return listWhere<Session>(col, [orderBy('startTime', 'asc')])
}

export async function getSession(id: string): Promise<Session | null> {
  return getById<Session>(col, id)
}

export async function createSession(data: Omit<Session, 'id'>): Promise<string> {
  return createDoc<Session>(col, data)
}

export async function updateSession(id: string, data: Partial<Session>): Promise<void> {
  await updateDocById(col, id, data)
}

export async function deleteSession(id: string): Promise<void> {
  await removeDoc(col, id)
}
