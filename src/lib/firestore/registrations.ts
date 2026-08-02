import { doc, runTransaction, deleteField, type Transaction } from 'firebase/firestore'
import { db } from '../firebase'
import { where, orderBy, listWhere, createDoc, updateDocById, omitUndefined } from './crud'
import type { AttendanceMode, ConfirmationStatus, Registration, Symposium } from '../../types/models'

const col = 'registrations'
const symposiaCol = 'symposia'
const OFFER_WINDOW_MS = 48 * 60 * 60 * 1000

export async function getRegistrationForUser(
  userId: string,
  symposiumId: string
): Promise<Registration | null> {
  const all = await listWhere<Registration>(col, [
    where('userId', '==', userId),
    where('symposiumId', '==', symposiumId),
  ])
  return all[0] ?? null
}

export async function listRegistrations(): Promise<Registration[]> {
  return listWhere<Registration>(col, [orderBy('createdAt', 'desc')])
}

// A returning attendee (any prior *approved* registration, any year) skips
// manual review — see project-docs discussion: registration approval exists
// to catch illegitimate/duplicate first-time applicants, not to re-vet
// someone organisers have already approved before.
async function hasPriorApproval(userId: string): Promise<boolean> {
  const prior = await listWhere<Registration>(col, [
    where('userId', '==', userId),
    where('status', '==', 'approved'),
  ])
  return prior.length > 0
}

// The only registration shape self-service sign-up can create — always
// online/public_participant/confirmed, matching the create rule. Every
// other role or attendance mode is assigned afterward by an organiser.
export async function createDefaultRegistration(userId: string, symposiumId: string): Promise<string> {
  const now = new Date().toISOString()
  const autoApprove = await hasPriorApproval(userId)
  return createDoc<Registration>(col, {
    userId,
    symposiumId,
    attendanceMode: 'online',
    participationRole: 'public_participant',
    status: autoApprove ? 'approved' : 'pending_approval',
    confirmationStatus: 'confirmed',
    createdAt: now,
    updatedAt: now,
  })
}

export async function updateRegistration(id: string, data: Partial<Registration>): Promise<void> {
  await updateDocById(col, id, { ...data, updatedAt: new Date().toISOString() })
}

export async function approveRegistration(id: string, approvedBy: string): Promise<void> {
  await updateRegistration(id, { status: 'approved', approvedBy, approvedAt: new Date().toISOString() })
}

export async function rejectRegistration(id: string, approvedBy: string): Promise<void> {
  await updateRegistration(id, { status: 'rejected', approvedBy, approvedAt: new Date().toISOString() })
}

// Self-service — an approved online participant deciding not to attend.
// Rules only permit this exact 'approved' -> 'withdrawn' transition.
export async function withdrawRegistration(id: string): Promise<void> {
  await updateRegistration(id, { status: 'withdrawn' })
}

// ---- capacity helpers ----

function capField(mode: AttendanceMode): 'confirmedPhysicalCount' | 'confirmedOnlineCount' | null {
  if (mode === 'face_to_face') return 'confirmedPhysicalCount'
  if (mode === 'online') return 'confirmedOnlineCount'
  return null // 'mixed' is deliberately uncapped
}

function maxForMode(symposium: Symposium, mode: AttendanceMode): number | null {
  if (mode === 'face_to_face') return symposium.maxPhysicalAttendees ?? null
  if (mode === 'online') {
    return symposium.onlineCapacityMode === 'fixed' ? (symposium.maxOnlineAttendees ?? null) : null
  }
  return null
}

function hasRoom(symposium: Symposium, mode: AttendanceMode): boolean {
  const max = maxForMode(symposium, mode)
  if (max == null) return true
  const field = capField(mode)
  const current = field ? (symposium[field] ?? 0) : 0
  return current < max
}

function regRef(id: string) {
  return doc(db, col, id)
}
function symRef(id: string) {
  return doc(db, symposiaCol, id)
}

async function loadPair(tx: Transaction, registrationId: string, symposiumId: string) {
  const [regSnap, symSnap] = await Promise.all([tx.get(regRef(registrationId)), tx.get(symRef(symposiumId))])
  if (!regSnap.exists()) throw new Error('Registration not found')
  if (!symSnap.exists()) throw new Error('Symposium not found')
  return {
    registration: { id: regSnap.id, ...regSnap.data() } as Registration,
    symposium: { id: symSnap.id, ...symSnap.data() } as Symposium,
  }
}

function bumpCounter(tx: Transaction, symposiumId: string, symposium: Symposium, mode: AttendanceMode, delta: 1 | -1) {
  const field = capField(mode)
  if (!field) return
  const current = symposium[field] ?? 0
  tx.update(symRef(symposiumId), omitUndefined({ [field]: Math.max(0, current + delta) }))
}

// ---- attendee actions ----

// Attempts to claim a seat in the registration's current attendanceMode.
// Confirms immediately if there's room, otherwise joins the waitlist.
export async function attemptConfirm(
  registrationId: string,
  symposiumId: string,
  mealPreference?: string
): Promise<ConfirmationStatus> {
  return runTransaction(db, async (tx) => {
    const { registration, symposium } = await loadPair(tx, registrationId, symposiumId)
    if (registration.status !== 'approved') throw new Error('Registration must be approved before confirming')
    const mode = registration.attendanceMode
    const now = new Date().toISOString()
    const meal = mealPreference ?? registration.mealPreference

    if (hasRoom(symposium, mode)) {
      bumpCounter(tx, symposiumId, symposium, mode, 1)
      tx.update(
        regRef(registrationId),
        omitUndefined({ confirmationStatus: 'confirmed', confirmedAt: now, mealPreference: meal, updatedAt: now })
      )
      return 'confirmed'
    }

    tx.update(
      regRef(registrationId),
      omitUndefined({
        confirmationStatus: 'waitlisted',
        waitlistedAt: now,
        offerExpiresAt: deleteField(),
        mealPreference: meal,
        updatedAt: now,
      })
    )
    return 'waitlisted'
  })
}

// Requests a switch to a different attendance mode. If the target mode has
// room, the switch completes immediately (and the old mode's seat is
// released — call promoteNextWaitlisted for it afterward). If not, the
// attendee is queued for the target mode WITHOUT losing their existing
// confirmed seat — previousConfirmedMode remembers where they still stand.
export async function requestModeSwitch(
  registrationId: string,
  symposiumId: string,
  targetMode: AttendanceMode
): Promise<{ status: ConfirmationStatus; freedMode: AttendanceMode | null }> {
  return runTransaction(db, async (tx) => {
    const { registration, symposium } = await loadPair(tx, registrationId, symposiumId)
    if (registration.confirmationStatus !== 'confirmed') {
      throw new Error('Only a confirmed registration can request a mode switch')
    }
    const currentMode = registration.attendanceMode
    if (currentMode === targetMode) return { status: 'confirmed' as ConfirmationStatus, freedMode: null }
    const now = new Date().toISOString()

    if (hasRoom(symposium, targetMode)) {
      bumpCounter(tx, symposiumId, symposium, targetMode, 1)
      bumpCounter(tx, symposiumId, symposium, currentMode, -1)
      tx.update(
        regRef(registrationId),
        omitUndefined({
          attendanceMode: targetMode,
          confirmationStatus: 'confirmed',
          confirmedAt: now,
          previousConfirmedMode: deleteField(),
          updatedAt: now,
        })
      )
      return { status: 'confirmed' as ConfirmationStatus, freedMode: currentMode }
    }

    tx.update(
      regRef(registrationId),
      omitUndefined({
        attendanceMode: targetMode,
        confirmationStatus: 'waitlisted',
        waitlistedAt: now,
        offerExpiresAt: deleteField(),
        previousConfirmedMode: currentMode,
        updatedAt: now,
      })
    )
    return { status: 'waitlisted' as ConfirmationStatus, freedMode: null }
  })
}

// Accepts an active offer (fresh waitlist promotion, or a mode-switch
// promotion). The seat was already provisionally held since the offer was
// extended, so this just finalizes status — except when finishing a mode
// switch, where the old mode's seat is only released now.
export async function acceptOffer(
  registrationId: string,
  symposiumId: string
): Promise<{ freedMode: AttendanceMode | null }> {
  return runTransaction(db, async (tx) => {
    const { registration, symposium } = await loadPair(tx, registrationId, symposiumId)
    if (registration.confirmationStatus !== 'offered') throw new Error('No active offer to accept')
    if (registration.offerExpiresAt && new Date(registration.offerExpiresAt) < new Date()) {
      throw new Error('This offer has expired')
    }
    const now = new Date().toISOString()
    const freedMode = registration.previousConfirmedMode ?? null
    if (freedMode) bumpCounter(tx, symposiumId, symposium, freedMode, -1)

    tx.update(
      regRef(registrationId),
      omitUndefined({
        confirmationStatus: 'confirmed',
        confirmedAt: now,
        waitlistedAt: deleteField(),
        offerExpiresAt: deleteField(),
        previousConfirmedMode: deleteField(),
        updatedAt: now,
      })
    )
    return { freedMode }
  })
}

// Declines an active offer. Releases the provisionally-held seat for the
// offered mode. If this was a mode-switch offer, reverts to the previously
// confirmed mode (no seat lost); otherwise the attendee drops back to
// 'unconfirmed' and can try confirming again later.
export async function declineOffer(
  registrationId: string,
  symposiumId: string
): Promise<{ freedMode: AttendanceMode }> {
  return runTransaction(db, async (tx) => {
    const { registration, symposium } = await loadPair(tx, registrationId, symposiumId)
    if (registration.confirmationStatus !== 'offered') throw new Error('No active offer to decline')
    return releaseOffer(tx, registrationId, symposiumId, registration, symposium)
  })
}

function releaseOffer(
  tx: Transaction,
  registrationId: string,
  symposiumId: string,
  registration: Registration,
  symposium: Symposium
): { freedMode: AttendanceMode } {
  const offeredMode = registration.attendanceMode
  bumpCounter(tx, symposiumId, symposium, offeredMode, -1)
  const now = new Date().toISOString()

  if (registration.previousConfirmedMode) {
    tx.update(
      regRef(registrationId),
      omitUndefined({
        attendanceMode: registration.previousConfirmedMode,
        confirmationStatus: 'confirmed',
        waitlistedAt: deleteField(),
        offerExpiresAt: deleteField(),
        previousConfirmedMode: deleteField(),
        updatedAt: now,
      })
    )
  } else {
    tx.update(
      regRef(registrationId),
      omitUndefined({
        confirmationStatus: 'unconfirmed',
        waitlistedAt: deleteField(),
        offerExpiresAt: deleteField(),
        updatedAt: now,
      })
    )
  }
  return { freedMode: offeredMode }
}

// Promotes the longest-waiting person on `mode`'s waitlist to a 48h offer,
// if the mode currently has room. Safe to call speculatively — re-checks
// capacity and that the candidate is still waitlisted inside the transaction.
export async function promoteNextWaitlisted(symposiumId: string, mode: AttendanceMode): Promise<void> {
  const field = capField(mode)
  if (!field) return // uncapped modes never queue anyone

  const candidates = await listWhere<Registration>(col, [
    where('symposiumId', '==', symposiumId),
    where('attendanceMode', '==', mode),
    where('confirmationStatus', '==', 'waitlisted'),
    orderBy('waitlistedAt', 'asc'),
  ])
  const next = candidates[0]
  if (!next) return

  await runTransaction(db, async (tx) => {
    const [regSnap, symSnap] = await Promise.all([tx.get(regRef(next.id)), tx.get(symRef(symposiumId))])
    if (!regSnap.exists() || !symSnap.exists()) return
    const registration = { id: regSnap.id, ...regSnap.data() } as Registration
    const symposium = { id: symSnap.id, ...symSnap.data() } as Symposium
    if (registration.confirmationStatus !== 'waitlisted') return // already handled concurrently
    if (!hasRoom(symposium, mode)) return

    bumpCounter(tx, symposiumId, symposium, mode, 1)
    const offerExpiresAt = new Date(Date.now() + OFFER_WINDOW_MS).toISOString()
    tx.update(regRef(next.id), omitUndefined({ confirmationStatus: 'offered', offerExpiresAt, updatedAt: new Date().toISOString() }))
  })
}

// Admin-only entry point (called from the Registrations admin page): sweeps
// expired offers AND re-checks both modes for room, so it also picks up
// slots freed by a decline or a mode switch, not just expiries. Attendee-
// facing actions (accept/decline/switch) deliberately don't call this
// themselves — promoting *someone else's* waitlist entry requires reading
// other people's registrations, which rules correctly restrict to
// isOwner-or-canRegistrations. There's no Cloud Function running on a timer
// yet (Phase 7), so promotion only happens when an admin's next page load
// (or action) triggers this sweep, not the instant a slot frees up.
export async function syncCapacity(symposiumId: string): Promise<void> {
  await expireStaleOffersAndPromote(symposiumId)
  await promoteNextWaitlisted(symposiumId, 'face_to_face')
  await promoteNextWaitlisted(symposiumId, 'online')
}

async function expireStaleOffersAndPromote(symposiumId: string): Promise<void> {
  const offered = await listWhere<Registration>(col, [
    where('symposiumId', '==', symposiumId),
    where('confirmationStatus', '==', 'offered'),
  ])
  const now = new Date()
  const expired = offered.filter((r) => r.offerExpiresAt && new Date(r.offerExpiresAt) < now)
  if (expired.length === 0) return

  const freedModes = new Set<AttendanceMode>()
  for (const registration of expired) {
    try {
      const freed = await runTransaction(db, async (tx) => {
        const [regSnap, symSnap] = await Promise.all([
          tx.get(regRef(registration.id)),
          tx.get(symRef(symposiumId)),
        ])
        if (!regSnap.exists() || !symSnap.exists()) return null
        const fresh = { id: regSnap.id, ...regSnap.data() } as Registration
        const symposium = { id: symSnap.id, ...symSnap.data() } as Symposium
        if (fresh.confirmationStatus !== 'offered') return null // already resolved concurrently
        if (fresh.offerExpiresAt && new Date(fresh.offerExpiresAt) >= now) return null // no longer stale
        return releaseOffer(tx, registration.id, symposiumId, fresh, symposium).freedMode
      })
      if (freed) freedModes.add(freed)
    } catch {
      // best-effort sweep — one failing registration shouldn't block the rest
    }
  }

  for (const mode of freedModes) {
    await promoteNextWaitlisted(symposiumId, mode)
  }
}
