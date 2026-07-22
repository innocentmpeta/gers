import { where, orderBy, listWhere, createDoc, updateDocById } from './crud'
import type { AbstractSubmission } from '../../types/models'

const col = 'abstractSubmissions'

export async function listAbstractSubmissions(): Promise<AbstractSubmission[]> {
  return listWhere<AbstractSubmission>(col, [orderBy('createdAt', 'desc')])
}

export async function listUserAbstractSubmissions(userId: string): Promise<AbstractSubmission[]> {
  return listWhere<AbstractSubmission>(col, [where('userId', '==', userId), orderBy('createdAt', 'desc')])
}

export type NewAbstractInput = Pick<
  AbstractSubmission,
  'userId' | 'symposiumId' | 'affiliation' | 'track' | 'title' | 'abstractText'
>

export async function submitAbstract(input: NewAbstractInput): Promise<string> {
  return createDoc<AbstractSubmission>(col, {
    ...input,
    status: 'pending',
    createdAt: new Date().toISOString(),
  })
}

export async function decideAbstract(
  id: string,
  status: 'accepted' | 'declined',
  reviewedBy: string
): Promise<void> {
  await updateDocById(col, id, { status, reviewedBy, decidedAt: new Date().toISOString() })
}
