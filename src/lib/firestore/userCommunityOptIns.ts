import { where, listWhere, createDoc, removeDoc } from './crud'
import type { UserCommunityOptIn } from '../../types/models'

const col = 'userCommunityOptIns'

export async function listUserOptIns(userId: string, symposiumId: string): Promise<UserCommunityOptIn[]> {
  return listWhere<UserCommunityOptIn>(col, [
    where('userId', '==', userId),
    where('symposiumId', '==', symposiumId),
  ])
}

// Replaces the user's opt-ins for the symposium with exactly `communityIds` —
// simplest correct approach given opt-ins are only ever edited a few at a
// time from a checkbox list, not worth a diff-based update.
export async function setUserOptIns(
  userId: string,
  symposiumId: string,
  communityIds: string[]
): Promise<void> {
  const existing = await listUserOptIns(userId, symposiumId)
  await Promise.all(existing.map((optIn) => removeDoc(col, optIn.id)))
  await Promise.all(
    communityIds.map((communityId) =>
      createDoc<UserCommunityOptIn>(col, { userId, symposiumId, communityId })
    )
  )
}
