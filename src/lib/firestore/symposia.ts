import type { FieldValue } from 'firebase/firestore'
import { listWhere, updateDocById } from './crud'
import type { Symposium } from '../../types/models'

const col = 'symposia'

// Only one Symposium document exists at this stage of the build (see
// scripts/seed-symposium.cjs) — real multi-year selection logic is deferred
// until Phase 5 needs it for registration deadlines.
export async function getDefaultSymposium(): Promise<Symposium | null> {
  const all = await listWhere<Symposium>(col, [])
  return all[0] ?? null
}

// The numeric fields accept a FieldValue (deleteField()) as well as a plain
// value — clearing a cap back to "unlimited" needs an actual delete, not an
// omitted key (omitUndefined only skips keys, it can't un-set a field
// already on the document).
export type CapacitySettings = {
  maxPhysicalAttendees?: Symposium['maxPhysicalAttendees'] | FieldValue
  onlineCapacityMode?: Symposium['onlineCapacityMode']
  maxOnlineAttendees?: Symposium['maxOnlineAttendees'] | FieldValue
}

export async function updateCapacitySettings(id: string, data: CapacitySettings): Promise<void> {
  await updateDocById(col, id, data)
}
