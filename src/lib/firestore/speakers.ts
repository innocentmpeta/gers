import { deleteField } from 'firebase/firestore'
import { where, orderBy, listWhere, getById, createDoc, updateDocById, removeDoc } from './crud'
import type { Sdg, Speaker, SpeakerRole } from '../../types/models'

const col = 'speakers'

export async function listSpeakers(): Promise<Speaker[]> {
  return listWhere<Speaker>(col, [orderBy('order', 'asc')])
}

export async function getSpeaker(id: string): Promise<Speaker | null> {
  return getById<Speaker>(col, id)
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
  | 'role'
  | 'name'
  | 'title'
  | 'organization'
  | 'bio'
  | 'photoMediaId'
  | 'presentationMediaId'
  | 'linkedinUrl'
  | 'areasOfInterest'
  | 'sdgs'
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

export type SpeakerProfileSyncInput = {
  name: string
  surname: string
  organization?: string
  jobTitle?: string
  bio?: string
  photoMediaId?: string
  linkedinUrl?: string
  areasOfInterest?: string
  sdgs?: Sdg[]
}

// Auto-links a presenter/facilitator's own account profile into the public
// Speakers page once their attendance is confirmed — the merge the admin
// Speakers form and "My Profile" both used to require entering separately.
// Only touches presentation-facing fields; sessionId/order/
// presentationMediaId are left as whatever admin already set (or the
// defaults) since scheduling stays admin-only. Leaves `visible` alone on
// an update — re-confirming shouldn't un-publish a card an admin already
// approved, only a brand-new sync starts hidden pending review.
export async function syncSpeakerFromProfile(
  userId: string,
  role: SpeakerRole,
  profile: SpeakerProfileSyncInput
): Promise<void> {
  const existing = await getSpeakerByUserId(userId)
  const fields = {
    role,
    name: `${profile.name} ${profile.surname}`.trim(),
    title: profile.jobTitle,
    organization: profile.organization,
    bio: profile.bio,
    photoMediaId: profile.photoMediaId,
    linkedinUrl: profile.linkedinUrl,
    areasOfInterest: profile.areasOfInterest,
    sdgs: profile.sdgs,
  }
  if (existing) {
    await updateSpeaker(existing.id, fields)
  } else {
    const count = (await listSpeakers()).length
    await createDoc<Speaker>(col, { ...fields, userId, order: count, visible: false })
  }
}
