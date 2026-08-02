import { where, orderBy, listWhere, createDoc, updateDocById } from './crud'
import type { Invite } from '../../types/models'

const col = 'invites'

export type NewInviteInput = Omit<Invite, 'id' | 'status' | 'createdAt' | 'consumedAt'>

export async function createInvite(data: NewInviteInput): Promise<string> {
  return createDoc<Invite>(col, {
    ...data,
    status: 'pending',
    createdAt: new Date().toISOString(),
  })
}

export async function listInvites(): Promise<Invite[]> {
  return listWhere<Invite>(col, [orderBy('createdAt', 'desc')])
}

export async function getPendingInviteByEmail(email: string): Promise<Invite | null> {
  const results = await listWhere<Invite>(col, [
    where('email', '==', email),
    where('status', '==', 'pending'),
  ])
  return results[0] ?? null
}

export async function markInviteConsumed(id: string): Promise<void> {
  await updateDocById(col, id, { status: 'consumed', consumedAt: new Date().toISOString() })
}
