import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { firebaseConfig } from './firebase'
import { newUserProfile, createUserProfile, setUserSystemRole, type NewUserProfileInput } from './firestore/users'
import { adminProvisionRegistration } from './firestore/registrations'
import type { AttendanceMode, ParticipationRole, SystemRole } from '../types/models'

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
  // Admin access to grant — omitted for a plain attendee-only account.
  systemRole?: Exclude<SystemRole, null>
  // Symposium registration to create alongside the account — omitted for a
  // role-only account with no attendee registration (e.g. a new organiser
  // who isn't personally attending).
  registration?: {
    symposiumId: string
    participationRole: ParticipationRole
    attendanceMode: AttendanceMode
  }
}

// The email-independent alternative to the invite-link flow: creates a
// fully-formed account (and, as needed, a system role and/or a symposium
// registration) in one go, with a generated temporary password an
// organiser can hand to the invitee directly (their own email, WhatsApp,
// etc.) instead of relying on Firebase's automated sign-in-link email,
// which institutional mail filters have been silently dropping (and which
// also requires the current domain to be authorized for sign-in links,
// something dev/preview domains typically aren't). The invitee logs in
// with the temp password and lands straight on their account — same
// confirm-attendance flow as anyone else invited to attend in person, if a
// registration was created.
export async function adminCreateAccountAndRegistration(
  input: AdminBulkAccountInput
): Promise<{ uid: string; tempPassword: string }> {
  const tempPassword = generateTempPassword()
  const { systemRole, registration, ...profileInput } = input
  const uid = await createAuthAccountOnly(input.email, tempPassword)

  await createUserProfile(newUserProfile(uid, profileInput))
  if (systemRole) await setUserSystemRole(uid, systemRole)
  if (registration) {
    await adminProvisionRegistration(
      uid,
      registration.symposiumId,
      registration.participationRole,
      registration.attendanceMode
    )
  }

  return { uid, tempPassword }
}
