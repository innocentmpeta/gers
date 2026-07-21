import { listWhere } from './crud'
import type { Symposium } from '../../types/models'

const col = 'symposia'

// Only one Symposium document exists at this stage of the build (see
// scripts/seed-symposium.cjs) — real multi-year selection logic is deferred
// until Phase 5 needs it for registration deadlines.
export async function getDefaultSymposium(): Promise<Symposium | null> {
  const all = await listWhere<Symposium>(col, [])
  return all[0] ?? null
}
