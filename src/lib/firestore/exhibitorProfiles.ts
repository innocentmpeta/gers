import { where, listWhere, createDoc, updateDocById } from './crud'
import type { BoothOption, ExhibitorProfile, SponsorshipTier } from '../../types/models'

const profilesCol = 'exhibitorProfiles'
const boothCol = 'boothOptions'
const tierCol = 'sponsorshipTiers'

export async function listBoothOptions(symposiumId: string): Promise<BoothOption[]> {
  return listWhere<BoothOption>(boothCol, [where('symposiumId', '==', symposiumId)])
}

export async function listSponsorshipTiers(symposiumId: string): Promise<SponsorshipTier[]> {
  return listWhere<SponsorshipTier>(tierCol, [where('symposiumId', '==', symposiumId)])
}

export async function getExhibitorProfile(registrationId: string): Promise<ExhibitorProfile | null> {
  const all = await listWhere<ExhibitorProfile>(profilesCol, [
    where('registrationId', '==', registrationId),
  ])
  return all[0] ?? null
}

export async function createExhibitorProfile(data: Omit<ExhibitorProfile, 'id'>): Promise<string> {
  return createDoc<ExhibitorProfile>(profilesCol, data)
}

export async function updateExhibitorProfile(id: string, data: Partial<ExhibitorProfile>): Promise<void> {
  await updateDocById(profilesCol, id, data)
}
