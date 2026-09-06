import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { firebaseConfig } from './firebase'
import { newUserProfile, createUserProfile, type NewUserProfileInput } from './firestore/users'
import { adminProvisionRegistration } from './firestore/registrations'
import type { AttendanceMode, ParticipationRole } from '../types/models'

// Avoids ambiguous characters (0/O, 1/l/I) since an organiser may need to
// read this out loud or retype it from a printed list.
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint32Array(12))
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

// Runs createUserWithEmailAndPassword on a throwaway secondary Firebase app
// instance rather than the app's own primary `auth` — the client SDK always
// signs in as whichever account it just created, so calling this on the
// primary auth would sign the admin out of their own session and into the
// invitee's new account instead. The secondary app has fully independent
// auth state, so the admin's session in the main app is never touched.
async function createAuthAccountOnly(email: string, password: string): Promise<string> {
  const secondaryApp = initializeApp(firebaseConfig, `admin-provision-${Date.now()}-${Math.random()}`)
  try {
    const secondaryAuth = getAuth(secondaryApp)
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    await signOut(secondaryAuth)
    return cred.user.uid
  } finally {
    await deleteApp(secondaryApp)
  }
}

export type AdminBulkAccountInput = NewUserProfileInput & {
  symposiumId: string
  participationRole: ParticipationRole
  attendanceMode: AttendanceMode
}

// The email-independent alternative to the invite-link flow: creates a
// fully-formed account, profile, and registration in one go, with a
// generated temporary password an organiser can hand to the invitee
// directly (their own email, WhatsApp, etc.) instead of relying on
// Firebase's automated sign-in-link email, which institutional mail
// filters have been silently dropping. The invitee logs in with the temp
// password and lands straight on their existing registration — same
// confirm-attendance flow as anyone else invited to attend in person.
export async function adminCreateAccountAndRegistration(
  input: AdminBulkAccountInput
): Promise<{ uid: string; tempPassword: string }> {
  const tempPassword = generateTempPassword()
  const { symposiumId, participationRole, attendanceMode, ...profileInput } = input
  const uid = await createAuthAccountOnly(input.email, tempPassword)

  await createUserProfile(newUserProfile(uid, profileInput))
  await adminProvisionRegistration(uid, symposiumId, participationRole, attendanceMode)

  return { uid, tempPassword }
}
