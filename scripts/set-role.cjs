#!/usr/bin/env node
// Sets a user's systemRole in both places it needs to exist: the Firestore
// users/{uid} profile (read by the app UI and Firestore rules) and the Auth
// custom claim (read by Storage rules — see storage.rules for why Storage
// can't just look the role up in Firestore itself). Keeping these in sync is
// a manual step until Phase 7 replaces this with a Cloud Function triggered
// from the Accounts & Roles admin screen.
//
// Usage: GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json node scripts/set-role.js <email> <role>

const { initializeApp, cert, applicationDefault } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore } = require('firebase-admin/firestore')

const VALID_ROLES = ['super_admin', 'organiser', 'content_manager']

async function main() {
  const [email, role] = process.argv.slice(2)
  if (!email || !VALID_ROLES.includes(role)) {
    console.error(`Usage: node scripts/set-role.js <email> <${VALID_ROLES.join('|')}>`)
    process.exit(1)
  }

  initializeApp({
    credential: process.env.GOOGLE_APPLICATION_CREDENTIALS ? applicationDefault() : cert(require('../serviceAccountKey.json')),
  })

  const userRecord = await getAuth().getUserByEmail(email)
  await getAuth().setCustomUserClaims(userRecord.uid, { systemRole: role })

  const db = getFirestore()
  const profileRef = db.collection('users').doc(userRecord.uid)
  const existing = await profileRef.get()
  if (existing.exists) {
    await profileRef.update({ systemRole: role })
  } else {
    await profileRef.set({
      name: userRecord.displayName || userRecord.email.split('@')[0],
      email: userRecord.email,
      showInDirectory: false,
      showWhatsapp: false,
      showEmail: false,
      visibilityScope: 'private',
      systemRole: role,
      createdAt: new Date().toISOString(),
    })
  }

  console.log(`${email} (${userRecord.uid}) is now ${role}.`)
  console.log('They must sign out and back in (or wait for their ID token to refresh) for the Storage claim to take effect.')
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e)
  process.exit(1)
})
