#!/usr/bin/env node
// Seeds the single Symposium document Session/Programme data hangs off of.
// No-ops if one already exists — see src/lib/firestore/symposia.ts for why
// there's only ever one right now.
//
// Usage: GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json node scripts/seed-symposium.cjs

const { initializeApp, cert, applicationDefault } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

async function main() {
  initializeApp({
    credential: process.env.GOOGLE_APPLICATION_CREDENTIALS ? applicationDefault() : cert(require('../serviceAccountKey.json')),
  })
  const db = getFirestore()
  const existing = await db.collection('symposia').limit(1).get()
  if (!existing.empty) {
    console.log('Symposium already exists, skipping.')
    return
  }

  await db.collection('symposia').add({
    year: 2026,
    name: 'GERS Symposium 2026',
    startDate: '2026-09-15',
    endDate: '2026-09-17',
    registrationDeadline: '2026-08-15',
    confirmationDeadline: '2026-09-01',
    mealEditDeadline: '2026-09-01',
  })
  console.log('Created default Symposium.')
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e)
  process.exit(1)
})
