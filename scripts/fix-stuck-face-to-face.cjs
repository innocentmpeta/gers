// One-time fix for registrations that RSVP'd to online for every day while
// still carrying attendanceMode:'face_to_face', because they confirmed
// before the auto-flip logic in attemptConfirm (src/lib/firestore/registrations.ts)
// was deployed. Applies the same rule the live code now applies going
// forward: approved + confirmed/offered + face_to_face + every recorded day
// choice is not face_to_face -> flip attendanceMode to 'online'.
// Run scripts/recalculate-capacity-counters.cjs afterward to fix the
// symposium's confirmedPhysicalCount/confirmedOnlineCount.
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
initializeApp({ credential: cert(require('/Users/user/Documents/REACT_CODE/gers/cms-symposium-key.json')) })

async function main() {
  const db = getFirestore()
  const symposiaSnap = await db.collection('symposia').get()

  for (const symDoc of symposiaSnap.docs) {
    const symposiumId = symDoc.id
    const regsSnap = await db.collection('registrations').where('symposiumId', '==', symposiumId).get()
    let flipped = 0

    for (const doc of regsSnap.docs) {
      const r = doc.data()
      const heldSeat = r.status === 'approved' && (r.confirmationStatus === 'confirmed' || r.confirmationStatus === 'offered')
      if (!heldSeat || r.attendanceMode !== 'face_to_face') continue

      const days = r.attendanceDays
      if (!days || Object.keys(days).length === 0) continue
      const optedFullyOnline = Object.values(days).every((choice) => choice !== 'face_to_face')
      if (!optedFullyOnline) continue

      console.log(`  flipping ${doc.id} (${r.userId}) -> online`, days)
      await doc.ref.update({ attendanceMode: 'online', updatedAt: new Date().toISOString() })
      flipped++
    }

    console.log(`Symposium ${symposiumId}: flipped ${flipped} registration(s)`)
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
