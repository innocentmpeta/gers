import { useEffect, useState } from 'react'
import { deleteField } from 'firebase/firestore'
import { useAuth } from '../../../lib/auth'
import {
  listRegistrations,
  approveRegistration,
  rejectRegistration,
  updateRegistration,
  syncCapacity,
  inviteToAttendInPerson,
  uninviteFromInPerson,
  promoteNextWaitlisted,
  withdrawRegistration,
} from '../../../lib/firestore/registrations'
import { listUsersByIds } from '../../../lib/firestore/users'
import { getDefaultSymposium, updateCapacitySettings } from '../../../lib/firestore/symposia'
import { formatSymposiumDay } from '../../../lib/symposiumDays'
import type { AttendanceDayChoice, ConfirmationStatus, Registration, Symposium, User } from '../../../types/models'

const DAY_CHOICE_LABEL: Record<AttendanceDayChoice, string> = {
  face_to_face: 'In-person',
  online: 'Online',
  none: 'None',
}

type StatusFilter = 'all' | Registration['status']

const STATUS_LABEL: Record<Registration['status'], string> = {
  pending_approval: 'Pending approval',
  approved: 'Approved',
  rejected: 'Not approved',
  withdrawn: 'Withdrawn',
}

const STATUS_COLOR: Record<Registration['status'], string> = {
  pending_approval: 'text-gold-600',
  approved: 'text-green-600',
  rejected: 'text-red-600',
  withdrawn: 'text-slate-500',
}

const CONFIRMATION_LABEL: Record<ConfirmationStatus, string> = {
  unconfirmed: 'Not yet confirmed',
  waitlisted: 'Waitlisted',
  offered: 'Offer pending',
  confirmed: 'Confirmed',
}

const ROLE_LABEL: Record<Registration['participationRole'], string> = {
  public_participant: 'Public participant',
  invited_participant: 'Invited participant',
  exhibitor: 'Exhibitor',
  facilitator: 'Facilitator',
  presenter: 'Presenter',
  vip: 'VIP',
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

type CapacityDraft = {
  maxPhysicalAttendees: string
  onlineCapacityMode: 'platform' | 'fixed'
  maxOnlineAttendees: string
}

function toCapacityDraft(s: Symposium): CapacityDraft {
  return {
    maxPhysicalAttendees: s.maxPhysicalAttendees?.toString() ?? '',
    onlineCapacityMode: s.onlineCapacityMode ?? 'platform',
    maxOnlineAttendees: s.maxOnlineAttendees?.toString() ?? '',
  }
}

function CapacityPanel({
  symposium,
  registrations,
  onSaved,
}: {
  symposium: Symposium
  registrations: Registration[]
  onSaved: () => void
}) {
  const [draft, setDraft] = useState<CapacityDraft>(toCapacityDraft(symposium))
  const [saving, setSaving] = useState(false)

  const invitedCount = registrations.filter((r) => r.participationRole === 'invited_participant').length
  const approvedCount = registrations.filter((r) => r.status === 'approved').length
  const pendingCount = registrations.filter((r) => r.status === 'pending_approval').length

  async function save() {
    setSaving(true)
    try {
      await updateCapacitySettings(symposium.id, {
        maxPhysicalAttendees:
          draft.maxPhysicalAttendees.trim() === '' ? deleteField() : Number(draft.maxPhysicalAttendees),
        onlineCapacityMode: draft.onlineCapacityMode,
        maxOnlineAttendees:
          draft.onlineCapacityMode === 'fixed' && draft.maxOnlineAttendees.trim() !== ''
            ? Number(draft.maxOnlineAttendees)
            : deleteField(),
      })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-sand-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-ink-900">Capacity</h2>
      <p className="mt-1 text-sm text-slate-500">
        In-person attendance is by invitation — use the caps below as a guide when deciding who to
        invite, factoring in expected drop-off. Registration itself is never blocked by these.
      </p>
      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-700">
        <div>
          <dt className="inline text-slate-500">Pending review: </dt>
          <dd className="inline font-medium">{pendingCount}</dd>
        </div>
        <div>
          <dt className="inline text-slate-500">Approved: </dt>
          <dd className="inline font-medium">{approvedCount}</dd>
        </div>
        <div>
          <dt className="inline text-slate-500">Invited in-person: </dt>
          <dd className="inline font-medium">
            {invitedCount}
            {symposium.maxPhysicalAttendees != null && ` / ${symposium.maxPhysicalAttendees}`}
          </dd>
        </div>
      </dl>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Max physical attendees
          <input
            type="number"
            value={draft.maxPhysicalAttendees}
            onChange={(e) => setDraft({ ...draft, maxPhysicalAttendees: e.target.value })}
            placeholder="Unlimited"
            className="rounded-md border border-sand-200 px-3 py-2"
          />
          <span className="text-xs text-slate-500">
            Confirmed: {symposium.confirmedPhysicalCount ?? 0}
            {draft.maxPhysicalAttendees && ` / ${draft.maxPhysicalAttendees}`}
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Online capacity
          <select
            value={draft.onlineCapacityMode}
            onChange={(e) => setDraft({ ...draft, onlineCapacityMode: e.target.value as 'platform' | 'fixed' })}
            className="rounded-md border border-sand-200 px-3 py-2"
          >
            <option value="platform">Rely on platform's own limit (unlimited here)</option>
            <option value="fixed">Set a fixed cap</option>
          </select>
          {draft.onlineCapacityMode === 'fixed' && (
            <>
              <input
                type="number"
                value={draft.maxOnlineAttendees}
                onChange={(e) => setDraft({ ...draft, maxOnlineAttendees: e.target.value })}
                placeholder="Max online attendees"
                className="mt-1 rounded-md border border-sand-200 px-3 py-2"
              />
              <span className="text-xs text-slate-500">
                Confirmed: {symposium.confirmedOnlineCount ?? 0}
                {draft.maxOnlineAttendees && ` / ${draft.maxOnlineAttendees}`}
              </span>
            </>
          )}
        </label>
      </div>
      <button
        onClick={save}
        disabled={saving}
        className="mt-4 rounded-full bg-ink-800 px-4 py-2 text-sm font-medium text-sand-50 hover:bg-ink-700 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save capacity settings'}
      </button>
    </div>
  )
}

export default function AdminRegistrations() {
  const { firebaseUser } = useAuth()
  const [symposium, setSymposium] = useState<Symposium | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [users, setUsers] = useState<Map<string, User>>(new Map())
  const [filter, setFilter] = useState<StatusFilter>('pending_approval')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [editingLogisticsId, setEditingLogisticsId] = useState<string | null>(null)
  const [logisticsDraft, setLogisticsDraft] = useState<LogisticsDraft | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const s = await getDefaultSymposium()
    if (s) await syncCapacity(s.id)
    const [freshSymposium, regs] = await Promise.all([getDefaultSymposium(), listRegistrations()])
    setSymposium(freshSymposium)
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

  async function handleInvite(id: string) {
    await inviteToAttendInPerson(id)
    load()
  }

  // Excludes 'invited_participant' — that's only ever set via Invite in
  // person above, which also resets attendance mode/confirmation correctly.
  // This picker never touches those, so routing it through here instead
  // would leave attendanceMode/confirmationStatus stale.
  async function handleChangeRole(id: string, role: Registration['participationRole']) {
    await updateRegistration(id, { participationRole: role })
    load()
  }

  async function handleWithdraw(id: string) {
    if (!confirm('Withdraw this registration? They can register again later if needed.')) return
    await withdrawRegistration(id)
    load()
  }

  async function handleUninvite(id: string) {
    if (!symposium) return
    if (!confirm("Revoke this person's in-person invitation? They'll move back to online.")) return
    const freedSeat = await uninviteFromInPerson(id, symposium.id)
    if (freedSeat) await promoteNextWaitlisted(symposium.id, 'face_to_face')
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

  const query = search.trim().toLowerCase()
  const visible = registrations.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false
    if (!query) return true
    const user = users.get(r.userId)
    const haystack = [user?.name, user?.surname, user?.email, user?.organization].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(query)
  })

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

      {symposium && <CapacityPanel symposium={symposium} registrations={registrations} onSaved={load} />}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-2 text-sm">
          {(['pending_approval', 'approved', 'rejected', 'withdrawn', 'all'] as StatusFilter[]).map((f) => (
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
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or organization…"
          className="ml-auto min-w-[240px] rounded-full border border-sand-200 px-4 py-1.5 text-sm"
        />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {visible.length === 0 && <p className="text-sm text-slate-500">No registrations here.</p>}

        {visible.map((r) => {
          const user = users.get(r.userId)
          return (
            <div key={r.id} className="rounded-lg border border-sand-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-ink-900">
                    {user ? [user.name, user.surname].filter(Boolean).join(' ') : 'Unknown user'}
                  </p>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {ROLE_LABEL[r.participationRole]} ·{' '}
                    <span className="capitalize">{r.attendanceMode.replaceAll('_', ' ')}</span>
                    {user?.organization && <> · {user.organization}</>}
                  </p>
                  <p className={`mt-1 text-sm font-medium ${STATUS_COLOR[r.status]}`}>
                    {STATUS_LABEL[r.status]} · {CONFIRMATION_LABEL[r.confirmationStatus]}
                    {r.mealPreference && ` · ${r.mealPreference}`}
                  </p>
                  {r.attendanceDays && Object.keys(r.attendanceDays).length > 0 && (
                    <p className="mt-1 text-xs text-slate-500">
                      {Object.entries(r.attendanceDays)
                        .map(([day, choice]) => `${formatSymposiumDay(day)}: ${DAY_CHOICE_LABEL[choice]}`)
                        .join(', ')}
                    </p>
                  )}
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
                  {r.status === 'approved' && r.participationRole === 'public_participant' && (
                    <button onClick={() => handleInvite(r.id)} className="text-ink-800 underline">
                      Invite in person
                    </button>
                  )}
                  {r.participationRole === 'invited_participant' && (
                    <button onClick={() => handleUninvite(r.id)} className="text-red-600 underline">
                      Revoke invitation
                    </button>
                  )}
                  {r.status === 'approved' && r.participationRole !== 'invited_participant' && (
                    <select
                      value={r.participationRole}
                      onChange={(e) => handleChangeRole(r.id, e.target.value as Registration['participationRole'])}
                      className="rounded-md border border-sand-200 px-2 py-1 text-xs"
                    >
                      {(['public_participant', 'exhibitor', 'facilitator', 'presenter', 'vip'] as const).map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABEL[role]}
                        </option>
                      ))}
                    </select>
                  )}
                  {r.status === 'approved' && (
                    <button onClick={() => handleWithdraw(r.id)} className="text-red-600 underline">
                      Withdraw
                    </button>
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
