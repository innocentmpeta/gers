import { where, listWhere, createDoc, updateDocById, removeDoc } from './crud'
import type { ThematicCommunity, UserCommunityOptIn } from '../../types/models'

const communitiesCol = 'thematicCommunities'
const optInsCol = 'userCommunityOptIns'

export async function listCommunities(symposiumId: string): Promise<ThematicCommunity[]> {
  return listWhere<ThematicCommunity>(communitiesCol, [where('symposiumId', '==', symposiumId)])
}

export async function createCommunity(data: Omit<ThematicCommunity, 'id'>): Promise<string> {
  return createDoc<ThematicCommunity>(communitiesCol, data)
}

export async function updateCommunity(id: string, data: Partial<ThematicCommunity>): Promise<void> {
  await updateDocById(communitiesCol, id, data)
}

export async function deleteCommunity(id: string): Promise<void> {
  await removeDoc(communitiesCol, id)
}

export async function listUserOptIns(userId: string): Promise<UserCommunityOptIn[]> {
  return listWhere<UserCommunityOptIn>(optInsCol, [where('userId', '==', userId)])
}

// Directory-wide — used to show/filter members by community. Read access
// widened to any signed-in user in firestore.rules for exactly this (opt-in
// records aren't sensitive, they're a topic tag, same tier as directory
// visibility itself).
export async function listAllOptIns(): Promise<UserCommunityOptIn[]> {
  return listWhere<UserCommunityOptIn>(optInsCol, [])
}

export async function optIn(userId: string, communityId: string, symposiumId: string): Promise<void> {
  await createDoc<UserCommunityOptIn>(optInsCol, { userId, communityId, symposiumId })
}

export async function optOut(optInId: string): Promise<void> {
  await removeDoc(optInsCol, optInId)
}
