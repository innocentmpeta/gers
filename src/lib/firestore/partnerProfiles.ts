import { where, orderBy, listWhere, createDoc, updateDocById, removeDoc } from './crud'
import type { PartnerCategory, PartnerProfile } from '../../types/models'

const col = 'partnerProfiles'

export async function listPartners(category: PartnerCategory): Promise<PartnerProfile[]> {
  return listWhere<PartnerProfile>(col, [where('category', '==', category), orderBy('order', 'asc')])
}

const ALL_CATEGORIES: PartnerCategory[] = ['exhibitor', 'partner']

// Every category, unfiltered — used by the Dashboard's pending-review count,
// which doesn't care which category a hidden self-submission landed in.
export async function listAllPartners(): Promise<PartnerProfile[]> {
  const lists = await Promise.all(ALL_CATEGORIES.map(listPartners))
  return lists.flat()
}

export async function listVisiblePartners(category: PartnerCategory): Promise<PartnerProfile[]> {
  return listWhere<PartnerProfile>(col, [
    where('category', '==', category),
    where('visible', '==', true),
    orderBy('order', 'asc'),
  ])
}

// The public Partners page and the footer don't distinguish category at all
// (Stacey Bailie, 2026-08-04: "partners page ... needn't be divided into
// exhibitors, sponsors etc — all organisations displayed equally") — every
// visible profile, alphabetical by name regardless of how it was collected.
export async function listAllVisiblePartners(): Promise<PartnerProfile[]> {
  const lists = await Promise.all(ALL_CATEGORIES.map((c) => listVisiblePartners(c)))
  return lists.flat().sort((a, b) => a.name.localeCompare(b.name))
}

export async function createPartner(data: Omit<PartnerProfile, 'id'>): Promise<string> {
  return createDoc<PartnerProfile>(col, data)
}

export async function updatePartner(id: string, data: Partial<PartnerProfile>): Promise<void> {
  await updateDocById(col, id, data)
}

export async function deletePartner(id: string): Promise<void> {
  await removeDoc(col, id)
}

export async function getPartnerByUserId(userId: string): Promise<PartnerProfile | null> {
  const all = await listWhere<PartnerProfile>(col, [where('userId', '==', userId)])
  return all[0] ?? null
}

export type OwnPartnerProfileInput = Pick<
  PartnerProfile,
  'name' | 'contactName' | 'blurb' | 'logoMediaId' | 'imageMediaId' | 'websiteUrl'
>

// Self-service — an exhibitor submitting/editing their own public profile,
// or a presenter/facilitator submitting/editing their organisation's
// profile alongside their personal Speaker one. New submissions start
// hidden until an admin reviews them.
export async function upsertOwnPartnerProfile(
  userId: string,
  category: PartnerCategory,
  data: OwnPartnerProfileInput
): Promise<void> {
  const existing = await getPartnerByUserId(userId)
  if (existing) {
    await updatePartner(existing.id, data)
  } else {
    const count = (await listPartners(category)).length
    await createDoc<PartnerProfile>(col, { ...data, userId, category, order: count, visible: false })
  }
}
