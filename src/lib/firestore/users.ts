import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { db } from '../firebase'
import { updateDocById, omitUndefined } from './crud'
import type { User } from '../../types/models'

const usersCol = 'users'

export type NewUserProfileInput = Pick<
  User,
  'name' | 'surname' | 'email' | 'salutation' | 'phone' | 'whatsappNumber' | 'organization' | 'jobTitle' | 'sector' | 'gender' | 'ageGroup'
> &
  Partial<Pick<User, 'showInDirectory' | 'showWhatsapp' | 'showEmail' | 'visibilityScope'>>

export function newUserProfile(uid: string, data: NewUserProfileInput): User {
  return {
    id: uid,
    showInDirectory: false,
    showWhatsapp: false,
    showEmail: false,
    visibilityScope: 'private',
    ...data,
    systemRole: null,
    consentAcceptedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }
}

export async function createUserProfile(profile: User): Promise<void> {
  await setDoc(doc(db, usersCol, profile.id), omitUndefined(profile as unknown as Record<string, unknown>))
}

export async function getUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, usersCol, uid))
  return snap.exists() ? (snap.data() as User) : null
}

// Admin-only (relies on the `canRegistrations`/`canAccounts` read rule) — used
// to resolve display names/emails alongside registrations and abstracts,
// which only store a bare userId.
export async function listUsersByIds(uids: string[]): Promise<Map<string, User>> {
  const unique = [...new Set(uids)]
  const users = await Promise.all(unique.map((uid) => getUserProfile(uid)))
  const map = new Map<string, User>()
  unique.forEach((uid, i) => {
    const u = users[i]
    if (u) map.set(uid, u)
  })
  return map
}

export function subscribeToUserProfile(uid: string, onChange: (profile: User | null) => void): Unsubscribe {
  return onSnapshot(doc(db, usersCol, uid), (snap) => {
    onChange(snap.exists() ? (snap.data() as User) : null)
  })
}

export type EditableProfileFields = Pick<
  User,
  | 'salutation'
  | 'name'
  | 'surname'
  | 'phone'
  | 'whatsappNumber'
  | 'organization'
  | 'jobTitle'
  | 'sector'
  | 'gender'
  | 'ageGroup'
  | 'showInDirectory'
  | 'showWhatsapp'
  | 'showEmail'
  | 'visibilityScope'
>

export async function updateOwnProfile(uid: string, fields: Partial<EditableProfileFields>): Promise<void> {
  await updateDocById(usersCol, uid, fields)
}
