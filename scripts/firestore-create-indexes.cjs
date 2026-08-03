#!/usr/bin/env node
// One-off: creates the composite indexes listed in firestore.indexes.json
// directly via the Firestore Admin REST API, using the service account's
// OAuth2 token. Exists because `firebase deploy --only firestore:indexes`
// needs a broader project role (Service Usage) than this service account
// has been granted, while plain Firestore Admin SDK reads/writes — and,
// it turns out, this same Admin REST API — work fine with what it already has.
//
// Usage: GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json node scripts/firestore-create-indexes.cjs

const fs = require('fs')
const path = require('path')
const { GoogleAuth } = require('google-auth-library')

async function main() {
  const indexesPath = path.join(__dirname, '..', 'firestore.indexes.json')
  const { indexes } = JSON.parse(fs.readFileSync(indexesPath, 'utf8'))

  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/datastore'] })
  const client = await auth.getClient()
  const projectId = await auth.getProjectId()

  for (const idx of indexes) {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/collectionGroups/${idx.collectionGroup}/indexes`
    const body = { queryScope: idx.queryScope, fields: idx.fields }
    try {
      await client.request({ url, method: 'POST', data: body })
      console.log(`created: ${idx.collectionGroup} [${idx.fields.map((f) => f.fieldPath).join(', ')}]`)
    } catch (e) {
      const msg = e.response?.data?.error?.message || e.message
      if (msg.includes('already exists')) {
        console.log(`already exists: ${idx.collectionGroup} [${idx.fields.map((f) => f.fieldPath).join(', ')}]`)
      } else {
        console.error(`FAILED: ${idx.collectionGroup} [${idx.fields.map((f) => f.fieldPath).join(', ')}] — ${msg}`)
      }
    }
  }
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e)
  process.exit(1)
})
