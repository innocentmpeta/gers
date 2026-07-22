import { where, orderBy, listWhere, createDoc, updateDocById } from './crud'
import type { Registration } from '../../types/models'

const col = 'registrations'

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

export type NewRegistrationInput = Pick<
  Registration,
  'userId' | 'symposiumId' | 'affiliation' | 'attendanceMode' | 'participationRole' | 'mealPreference'
>

export async function createRegistration(input: NewRegistrationInput): Promise<string> {
  const now = new Date().toISOString()
  return createDoc<Registration>(col, {
    ...input,
    status: 'pending_approval',
    confirmed: false,
    createdAt: now,
    updatedAt: now,
  })
}

export async function updateRegistration(id: string, data: Partial<Registration>): Promise<void> {
  await updateDocById(col, id, { ...data, updatedAt: new Date().toISOString() })
}

export async function confirmRegistration(id: string, mealPreference?: string): Promise<void> {
  await updateRegistration(id, {
    confirmed: true,
    confirmedAt: new Date().toISOString(),
    mealPreference,
  })
}

export async function approveRegistration(id: string, approvedBy: string): Promise<void> {
  await updateRegistration(id, { status: 'approved', approvedBy, approvedAt: new Date().toISOString() })
}

export async function rejectRegistration(id: string, approvedBy: string): Promise<void> {
  await updateRegistration(id, { status: 'rejected', approvedBy, approvedAt: new Date().toISOString() })
}
