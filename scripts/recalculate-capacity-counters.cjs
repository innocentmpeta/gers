// One-time fix for historical counter drift caused by registration paths
// that set confirmationStatus:'confirmed' without ever incrementing the
// Symposium's confirmedOnlineCount/confirmedPhysicalCount (fixed in
// src/lib/firestore/registrations.ts) — recomputes the true counts
// directly from registration data and corrects the stored counters.
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
initializeApp({ credential: cert(require('/Users/user/Documents/REACT_CODE/gers/cms-symposium-key.json')) })

async function main() {
  const db = getFirestore()
  const symposiaSnap = await db.collection('symposia').get()

  for (const symDoc of symposiaSnap.docs) {
    const symposiumId = symDoc.id
    const sym = symDoc.data()
    const regsSnap = await db.collection('registrations').where('symposiumId', '==', symposiumId).get()

    let truePhysical = 0
    let trueOnline = 0
    regsSnap.forEach((doc) => {
      const r = doc.data()
      const heldSeat = r.status === 'approved' && (r.confirmationStatus === 'confirmed' || r.confirmationStatus === 'offered')
      if (!heldSeat) return
      if (r.attendanceMode === 'face_to_face') truePhysical++
      else if (r.attendanceMode === 'online') trueOnline++
      // 'mixed' is deliberately uncapped/uncounted, matching capField() in registrations.ts
    })

    const currentPhysical = sym.confirmedPhysicalCount ?? 0
    const currentOnline = sym.confirmedOnlineCount ?? 0

    console.log(`Symposium ${symposiumId} (${sym.name || 'unnamed'}):`)
    console.log(`  Physical: stored=${currentPhysical} -> true=${truePhysical}`)
    console.log(`  Online:   stored=${currentOnline} -> true=${trueOnline}`)

    if (currentPhysical !== truePhysical || currentOnline !== trueOnline) {
      await symDoc.ref.update({ confirmedPhysicalCount: truePhysical, confirmedOnlineCount: trueOnline })
      console.log('  -> corrected')
    } else {
      console.log('  -> already correct')
    }
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
