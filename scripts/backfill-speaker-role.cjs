#!/usr/bin/env node
// One-off: sets role: 'presenter' on any speakers/{id} doc created before
// the Speaker.role field existed (splitting the old combined "Experts" page
// back into separate Speakers/Facilitators pages needs every doc to have a
// role, and defaulting to presenter is safe since no facilitator had
// self-submitted yet at the time this was written).
//
// Usage: GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json node scripts/backfill-speaker-role.cjs

const { initializeApp, cert, applicationDefault } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

async function main() {
  initializeApp({
    credential: process.env.GOOGLE_APPLICATION_CREDENTIALS ? applicationDefault() : cert(require('../serviceAccountKey.json')),
  })

  const db = getFirestore()
  const snap = await db.collection('speakers').get()

  const missing = snap.docs.filter((doc) => !doc.data().role)
  if (missing.length === 0) {
    console.log('No speaker docs missing role — nothing to do.')
    return
  }

  const batch = db.batch()
  missing.forEach((doc) => batch.update(doc.ref, { role: 'presenter' }))
  await batch.commit()

  console.log(`Set role: 'presenter' on ${missing.length} speaker doc(s):`)
  missing.forEach((doc) => console.log(`  - ${doc.id} (${doc.data().name})`))
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e)
  process.exit(1)
})
