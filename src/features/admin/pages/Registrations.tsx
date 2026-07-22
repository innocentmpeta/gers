import { useEffect, useState } from 'react'
import { useAuth } from '../../../lib/auth'
import {
  listRegistrations,
  approveRegistration,
  rejectRegistration,
  updateRegistration,
} from '../../../lib/firestore/registrations'
import { listUsersByIds } from '../../../lib/firestore/users'
import type { Registration, User } from '../../../types/models'

type StatusFilter = 'all' | Registration['status']

const STATUS_LABEL: Record<Registration['status'], string> = {
  pending_approval: 'Pending approval',
  approved: 'Approved',
  rejected: 'Not approved',
}

const STATUS_COLOR: Record<Registration['status'], string> = {
  pending_approval: 'text-gold-600',
  approved: 'text-green-600',
  rejected: 'text-red-600',
}

type LogisticsDraft = {
  registrationAmountPaid: string
  accommodationPaid: string
  mealAmount: string
  transportAmount: string
  accommodationAddress: string
}

function toLogisticsDraft(r: Registration): LogisticsDraft {
  return {
    registrationAmountPaid: r.registrationAmountPaid?.toString() ?? '',
    accommodationPaid: r.accommodationPaid?.toString() ?? '',
    mealAmount: r.mealAmount?.toString() ?? '',
    transportAmount: r.transportAmount?.toString() ?? '',
    accommodationAddress: r.accommodationAddress ?? '',
  }
}

export default function AdminRegistrations() {
  const { firebaseUser } = useAuth()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [users, setUsers] = useState<Map<string, User>>(new Map())
  const [filter, setFilter] = useState<StatusFilter>('pending_approval')
  const [loading, setLoading] = useState(true)
  const [editingLogisticsId, setEditingLogisticsId] = useState<string | null>(null)
  const [logisticsDraft, setLogisticsDraft] = useState<LogisticsDraft | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const regs = await listRegistrations()
    setRegistrations(regs)
    setUsers(await listUsersByIds(regs.map((r) => r.userId)))
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleApprove(id: string) {
    if (!firebaseUser) return
    await approveRegistration(id, firebaseUser.uid)
    load()
  }

  async function handleReject(id: string) {
    if (!firebaseUser) return
    if (!confirm('Reject this registration?')) return
    await rejectRegistration(id, firebaseUser.uid)
    load()
  }

  function startLogistics(r: Registration) {
    setEditingLogisticsId(r.id)
    setLogisticsDraft(toLogisticsDraft(r))
  }

  async function saveLogistics(id: string) {
    if (!logisticsDraft) return
    setSaving(true)
    try {
      const num = (v: string) => (v.trim() === '' ? undefined : Number(v))
      await updateRegistration(id, {
        registrationAmountPaid: num(logisticsDraft.registrationAmountPaid),
        accommodationPaid: num(logisticsDraft.accommodationPaid),
        mealAmount: num(logisticsDraft.mealAmount),
        transportAmount: num(logisticsDraft.transportAmount),
        accommodationAddress: logisticsDraft.accommodationAddress || undefined,
      })
      setEditingLogisticsId(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  const visible = registrations.filter((r) => filter === 'all' || r.status === filter)

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-8 py-10">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <h1 className="text-3xl">Registrations</h1>
      <p className="mt-2 text-sm text-slate-500">
        Approve or reject submitted registrations, and record payment/logistics details.
      </p>

      <div className="mt-6 flex gap-2 text-sm">
        {(['pending_approval', 'approved', 'rejected', 'all'] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 ${
              filter === f ? 'bg-ink-900 text-sand-50' : 'bg-sand-100 text-slate-700 hover:bg-sand-200'
            }`}
          >
            {f === 'all' ? 'All' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {visible.length === 0 && <p className="text-sm text-slate-500">No registrations here.</p>}

        {visible.map((r) => {
          const user = users.get(r.userId)
          return (
            <div key={r.id} className="rounded-lg border border-sand-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-ink-900">{user?.name ?? 'Unknown user'}</p>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                  <p className="mt-1 text-sm text-slate-700">
                    <span className="capitalize">{r.participationRole}</span> ·{' '}
                    <span className="capitalize">{r.attendanceMode.replaceAll('_', ' ')}</span>
                    {r.affiliation && <> · {r.affiliation}</>}
                  </p>
                  <p className={`mt-1 text-sm font-medium ${STATUS_COLOR[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                    {r.confirmed && ' · Confirmed'}
                    {r.mealPreference && ` · ${r.mealPreference}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-3 text-sm">
                  {r.status === 'pending_approval' && (
                    <>
                      <button onClick={() => handleApprove(r.id)} className="text-green-600 underline">
                        Approve
                      </button>
                      <button onClick={() => handleReject(r.id)} className="text-red-600 underline">
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => startLogistics(r)}
                    className="text-ink-800 underline"
                  >
                    Logistics
                  </button>
                </div>
              </div>

              {editingLogisticsId === r.id && logisticsDraft && (
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-sand-200 pt-4">
                  <label className="flex flex-col gap-1 text-sm text-slate-700">
                    Registration amount paid
                    <input
                      type="number"
                      value={logisticsDraft.registrationAmountPaid}
                      onChange={(e) =>
                        setLogisticsDraft({ ...logisticsDraft, registrationAmountPaid: e.target.value })
                      }
                      className="rounded-md border border-sand-200 px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-slate-700">
                    Accommodation paid
                    <input
                      type="number"
                      value={logisticsDraft.accommodationPaid}
                      onChange={(e) =>
                        setLogisticsDraft({ ...logisticsDraft, accommodationPaid: e.target.value })
                      }
                      className="rounded-md border border-sand-200 px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-slate-700">
                    Meal amount
                    <input
                      type="number"
                      value={logisticsDraft.mealAmount}
                      onChange={(e) => setLogisticsDraft({ ...logisticsDraft, mealAmount: e.target.value })}
                      className="rounded-md border border-sand-200 px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm text-slate-700">
                    Transport amount
                    <input
                      type="number"
                      value={logisticsDraft.transportAmount}
                      onChange={(e) =>
                        setLogisticsDraft({ ...logisticsDraft, transportAmount: e.target.value })
                      }
                      className="rounded-md border border-sand-200 px-3 py-2"
                    />
                  </label>
                  <label className="col-span-2 flex flex-col gap-1 text-sm text-slate-700">
                    Accommodation address
                    <input
                      value={logisticsDraft.accommodationAddress}
                      onChange={(e) =>
                        setLogisticsDraft({ ...logisticsDraft, accommodationAddress: e.target.value })
                      }
                      className="rounded-md border border-sand-200 px-3 py-2"
                    />
                  </label>
                  <div className="col-span-2 flex gap-3">
                    <button
                      onClick={() => saveLogistics(r.id)}
                      disabled={saving}
                      className="rounded-full bg-ink-800 px-4 py-2 text-sm font-medium text-sand-50 hover:bg-ink-700 disabled:opacity-60"
                    >
                      {saving ? 'Saving…' : 'Save logistics'}
                    </button>
                    <button onClick={() => setEditingLogisticsId(null)} className="text-sm text-slate-500">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
