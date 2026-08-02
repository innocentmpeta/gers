#!/usr/bin/env node
// One-off: dumps every top-level collection in a Firestore project to a
// single local JSON file, preserving document IDs (required so cross-
// collection references like registrations.userId / sections.pageId /
// speakers.photoMediaId still resolve after a project migration).
// Assumes no subcollections and no Firestore-native types (Timestamp,
// GeoPoint, DocumentReference) — confirmed true for this project's schema
// before writing this script; a project that used those would need this
// extended to convert them to a JSON-safe form.
//
// Usage: GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json node scripts/firestore-export.cjs <output.json>

const fs = require('fs')
const { initializeApp, applicationDefault } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

async function main() {
  const [outPath] = process.argv.slice(2)
  if (!outPath) {
    console.error('Usage: node scripts/firestore-export.cjs <output.json>')
    process.exit(1)
  }

  initializeApp({ credential: applicationDefault() })
  const db = getFirestore()

  const dump = {}
  const collections = await db.listCollections()
  for (const col of collections) {
    const snap = await col.get()
    dump[col.id] = snap.docs.map((d) => ({ id: d.id, data: d.data() }))
    console.log(`${col.id}: ${snap.size} docs`)
  }

  fs.mkdirSync(require('path').dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(dump, null, 2))
  console.log(`\nWrote ${outPath}`)
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e)
  process.exit(1)
})
