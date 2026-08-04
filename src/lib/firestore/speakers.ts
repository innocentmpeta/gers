import { deleteField } from 'firebase/firestore'
import { where, orderBy, listWhere, createDoc, updateDocById, removeDoc } from './crud'
import type { Speaker, SpeakerRole } from '../../types/models'

const col = 'speakers'

export async function listSpeakers(): Promise<Speaker[]> {
  return listWhere<Speaker>(col, [orderBy('order', 'asc')])
}

export async function listSpeakersForSession(sessionId: string): Promise<Speaker[]> {
  return listWhere<Speaker>(col, [where('sessionId', '==', sessionId), orderBy('order', 'asc')])
}

// Admin-only — links/unlinks a speaker or facilitator to a Programme
// session (many Speaker docs can point at the same session). Goes through
// updateDocById directly rather than updateSpeaker so a genuine unlink can
// use deleteField() — Partial<Speaker> can't express "clear this field".
export async function setSpeakerSession(speakerId: string, sessionId: string | null): Promise<void> {
  await updateDocById(col, speakerId, { sessionId: sessionId ?? deleteField() })
}

export async function listVisibleSpeakers(): Promise<Speaker[]> {
  return listWhere<Speaker>(col, [where('visible', '==', true), orderBy('order', 'asc')])
}

// Speakers and Facilitators show on two separate public pages, each only
// ever needing its own role — filtering client-side (rather than a
// composite where('role','==',...) index) since listVisibleSpeakers()
// already has to fetch the whole small collection either way.
export async function listVisibleSpeakersByRole(role: SpeakerRole): Promise<Speaker[]> {
  const all = await listVisibleSpeakers()
  return all.filter((s) => s.role === role)
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

export async function getSpeakerByUserId(userId: string): Promise<Speaker | null> {
  const all = await listWhere<Speaker>(col, [where('userId', '==', userId)])
  return all[0] ?? null
}

export type OwnSpeakerProfileInput = Pick<
  Speaker,
  'role' | 'name' | 'title' | 'bio' | 'photoMediaId' | 'presentationMediaId'
>

// Self-service — a presenter submitting/editing their own public profile.
// New submissions start hidden (visible: false) until an admin reviews them,
// same as admin-added speakers default to visible: true only deliberately.
export async function upsertOwnSpeakerProfile(userId: string, data: OwnSpeakerProfileInput): Promise<void> {
  const existing = await getSpeakerByUserId(userId)
  if (existing) {
    await updateSpeaker(existing.id, data)
  } else {
    const count = (await listSpeakers()).length
    await createDoc<Speaker>(col, { ...data, userId, order: count, visible: false })
  }
}
