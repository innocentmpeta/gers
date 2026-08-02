#!/usr/bin/env node
// One-off: restores a JSON dump produced by firestore-export.cjs into a
// Firestore project, writing each document back under its original ID.
// Uses batched writes (500/batch, Firestore's limit) for speed; safe to
// re-run (setDoc overwrites, doesn't error on existing docs).
//
// Usage: GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json node scripts/firestore-import.cjs <input.json>

const fs = require('fs')
const { initializeApp, applicationDefault } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

async function main() {
  const [inPath] = process.argv.slice(2)
  if (!inPath) {
    console.error('Usage: node scripts/firestore-import.cjs <input.json>')
    process.exit(1)
  }

  initializeApp({ credential: applicationDefault() })
  const db = getFirestore()

  const dump = JSON.parse(fs.readFileSync(inPath, 'utf8'))

  for (const [colId, docs] of Object.entries(dump)) {
    let batch = db.batch()
    let count = 0
    for (const { id, data } of docs) {
      batch.set(db.collection(colId).doc(id), data)
      count++
      if (count % 500 === 0) {
        await batch.commit()
        batch = db.batch()
      }
    }
    if (count % 500 !== 0) await batch.commit()
    console.log(`${colId}: wrote ${docs.length} docs`)
  }

  console.log('\nImport complete.')
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e)
  process.exit(1)
})
