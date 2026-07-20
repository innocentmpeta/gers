import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { User } from '../../types/models'

const usersCol = 'users'

export function newUserProfile(uid: string, name: string, email: string): User {
  return {
    id: uid,
    name,
    email,
    showInDirectory: false,
    showWhatsapp: false,
    showEmail: false,
    visibilityScope: 'private',
    systemRole: null,
    createdAt: new Date().toISOString(),
  }
}

export async function createUserProfile(profile: User): Promise<void> {
  await setDoc(doc(db, usersCol, profile.id), profile)
}

export async function getUserProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, usersCol, uid))
  return snap.exists() ? (snap.data() as User) : null
}

export function subscribeToUserProfile(uid: string, onChange: (profile: User | null) => void): Unsubscribe {
  return onSnapshot(doc(db, usersCol, uid), (snap) => {
    onChange(snap.exists() ? (snap.data() as User) : null)
  })
}

export type EditableProfileFields = Pick<
  User,
  'name' | 'phone' | 'whatsappNumber' | 'showInDirectory' | 'showWhatsapp' | 'showEmail' | 'visibilityScope'
>

export async function updateOwnProfile(uid: string, fields: Partial<EditableProfileFields>): Promise<void> {
  await updateDoc(doc(db, usersCol, uid), fields)
}
