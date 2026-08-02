import { useState } from 'react'
import { listRegistrations } from '../../../lib/firestore/registrations'
import { listAbstractSubmissions } from '../../../lib/firestore/abstractSubmissions'
import { listUsersByIds } from '../../../lib/firestore/users'
import type { AbstractSubmission, Registration, User } from '../../../types/models'

function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => csvCell(row[h])).join(','))
  }
  return lines.join('\n')
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function registrationRow(r: Registration, u: User | undefined): Record<string, unknown> {
  return {
    name: u?.name ?? '',
    surname: u?.surname ?? '',
    email: u?.email ?? '',
    organization: u?.organization ?? '',
    jobTitle: u?.jobTitle ?? '',
    sector: u?.sector ?? '',
    gender: u?.gender ?? '',
    ageGroup: u?.ageGroup ?? '',
    whatsappNumber: u?.whatsappNumber ?? '',
    participationRole: r.participationRole,
    attendanceMode: r.attendanceMode,
    status: r.status,
    confirmationStatus: r.confirmationStatus,
    mealPreference: r.mealPreference ?? '',
    registrationAmountPaid: r.registrationAmountPaid ?? '',
    accommodationPaid: r.accommodationPaid ?? '',
    mealAmount: r.mealAmount ?? '',
    transportAmount: r.transportAmount ?? '',
    accommodationAddress: r.accommodationAddress ?? '',
    createdAt: r.createdAt,
  }
}

function abstractRow(a: AbstractSubmission, u: User | undefined): Record<string, unknown> {
  return {
    title: a.title,
    track: a.track,
    status: a.status,
    submitterName: u?.name ?? '',
    submitterSurname: u?.surname ?? '',
    submitterEmail: u?.email ?? '',
    affiliation: a.affiliation ?? '',
    abstractText: a.abstractText,
    createdAt: a.createdAt,
  }
}

export default function AdminExport() {
  const [busy, setBusy] = useState<'registrations' | 'abstracts' | null>(null)

  async function exportRegistrations() {
    setBusy('registrations')
    try {
      const registrations = await listRegistrations()
      const users = await listUsersByIds(registrations.map((r) => r.userId))
      const rows = registrations.map((r) => registrationRow(r, users.get(r.userId)))
      download(`registrations-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows))
    } finally {
      setBusy(null)
    }
  }

  async function exportAbstracts() {
    setBusy('abstracts')
    try {
      const abstracts = await listAbstractSubmissions()
      const users = await listUsersByIds(abstracts.map((a) => a.userId))
      const rows = abstracts.map((a) => abstractRow(a, users.get(a.userId)))
      download(`abstracts-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <h1 className="text-3xl">Export</h1>
      <p className="mt-2 text-sm text-slate-500">Download the current dataset as CSV.</p>

      <div className="mt-6 flex flex-col gap-3">
        <div className="flex items-center justify-between rounded-lg border border-sand-200 bg-white p-5">
          <div>
            <p className="text-ink-900">Registrations</p>
            <p className="text-sm text-slate-500">All registrations, joined with attendee profile details.</p>
          </div>
          <button
            onClick={exportRegistrations}
            disabled={busy !== null}
            className="rounded-full bg-ink-800 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-ink-700 disabled:opacity-60"
          >
            {busy === 'registrations' ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-sand-200 bg-white p-5">
          <div>
            <p className="text-ink-900">Abstract submissions</p>
            <p className="text-sm text-slate-500">All submitted abstracts, joined with submitter details.</p>
          </div>
          <button
            onClick={exportAbstracts}
            disabled={busy !== null}
            className="rounded-full bg-ink-800 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-ink-700 disabled:opacity-60"
          >
            {busy === 'abstracts' ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
      </div>
    </div>
  )
}
