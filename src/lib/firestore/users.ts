import { doc, getDoc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore'
import { db } from '../firebase'
import { listWhere, updateDocById, removeDoc, omitUndefined, where } from './crud'
import type { SystemRole, User } from '../../types/models'

const usersCol = 'users'

export type NewUserProfileInput = Pick<
  User,
  | 'name'
  | 'surname'
  | 'email'
  | 'salutation'
  | 'phone'
  | 'whatsappNumber'
  | 'organization'
  | 'jobTitle'
  | 'sector'
  | 'gender'
  | 'ageGroup'
  | 'disability'
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

// Super-admin-only (relies on the `canAccounts` read rule) — powers the
// Accounts & Roles user list. Small enough dataset for this project's scale
// that a plain unfiltered list is fine, no pagination needed yet.
export async function listAllUsers(): Promise<User[]> {
  return listWhere<User>(usersCol, [])
}

// Direct role change on an existing account — distinct from the invite-based
// grant flow, which only exists to get a *new* account its first role. Once
// the account exists, a super admin can just change this field like any
// other (the `canAccounts` update rule already allows it unrestricted).
export async function setUserSystemRole(uid: string, systemRole: SystemRole): Promise<void> {
  await updateDocById(usersCol, uid, { systemRole })
}

// Self-service — the one moment a brand-new account can set its own
// systemRole, by citing the still-pending invite that approved it. Must
// write both fields together: the rule cross-checks inviteId against the
// invite doc, so systemRole alone (with no inviteId to point at) wouldn't
// satisfy it. See matchesPendingInviteRole in firestore.rules.
export async function grantSystemRoleFromInvite(
  uid: string,
  systemRole: Exclude<SystemRole, null>,
  inviteId: string
): Promise<void> {
  await updateDocById(usersCol, uid, { systemRole, inviteId })
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
  | 'disability'
  | 'bio'
  | 'areasOfInterest'
  | 'sdgs'
  | 'photoMediaId'
  | 'profileEmail'
  | 'linkedinUrl'
  | 'showInDirectory'
  | 'showWhatsapp'
  | 'showEmail'
  | 'visibilityScope'
>

export async function updateOwnProfile(uid: string, fields: Partial<EditableProfileFields>): Promise<void> {
  await updateDocById(usersCol, uid, fields)
}

// Self-service — keeps the Firestore profile's email in sync after a
// successful Firebase Auth updateEmail() call. Auth is the source of truth
// for login; this field is what the rest of the app (directory, admin
// lists) actually reads.
export async function updateOwnEmail(uid: string, email: string): Promise<void> {
  await updateDocById(usersCol, uid, { email })
}

// Powers the community-of-practice directory — small enough dataset for
// this project's scale that a plain filtered list is fine, no pagination.
export async function listDirectoryUsers(): Promise<User[]> {
  return listWhere<User>(usersCol, [where('showInDirectory', '==', true)])
}

// Super-admin-only (relies on the `canAccounts` delete rule). Removes only
// the Firestore profile doc — the underlying Firebase Auth account is NOT
// deleted, since the client SDK can only ever delete the currently
// signed-in user's own auth account, never an arbitrary other one (that
// needs the Admin SDK from a trusted backend, which this project doesn't
// have). A "deleted" test account can therefore still technically sign in
// again, which would recreate its profile doc — acceptable for cleaning up
// test data, but callers should not present this as a full account wipe.
export async function deleteUserProfile(uid: string): Promise<void> {
  await removeDoc(usersCol, uid)
}
