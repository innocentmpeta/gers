import { useEffect, useState } from 'react'
import { sendSignInLinkToEmail } from 'firebase/auth'
import { auth } from '../../../lib/firebase'
import { createInvite, listInvites } from '../../../lib/firestore/invites'
import { listAllUsers, setUserSystemRole } from '../../../lib/firestore/users'
import {
  listRegistrations,
  adminCreateAttendeeRegistration,
  updateRegistration,
} from '../../../lib/firestore/registrations'
import { getDefaultSymposium } from '../../../lib/firestore/symposia'
import { useAuth } from '../../../lib/auth'
import type {
  AgeGroup,
  AttendanceMode,
  Gender,
  Invite,
  ParticipationRole,
  Registration,
  Salutation,
  Sector,
  SystemRole,
  Symposium,
  User,
} from '../../../types/models'

const SALUTATIONS: Salutation[] = ['Mr', 'Ms', 'Mrs', 'Dr', 'Prof', 'Other']
const SECTORS: Sector[] = ['Academia', 'Research', 'Government', 'Enterprise', 'Civil Society', 'Other']
const GENDERS: Gender[] = ['Female', 'Male', 'Prefer not to say']
const AGE_GROUPS: AgeGroup[] = ['Under 35 years', '35 years and over']

const ROLE_LABEL: Record<ParticipationRole, string> = {
  public_participant: 'Public participant',
  invited_participant: 'Invited participant',
  exhibitor: 'Exhibitor',
  facilitator: 'Facilitator',
  presenter: 'Presenter',
  vip: 'VIP',
}

const MODE_LABEL: Record<AttendanceMode, string> = {
  online: 'Online',
  face_to_face: 'Face to face',
  mixed: 'Mixed',
}

// 'organiser' is the underlying systemRole value throughout the codebase —
// shown here as "Symposium Manager" to match how the organisers refer to it.
const SYSTEM_ROLE_LABEL: Record<Exclude<SystemRole, null>, string> = {
  content_manager: 'Content Manager',
  organiser: 'Symposium Manager',
  super_admin: 'Super Admin',
}
const SYSTEM_ROLES = Object.keys(SYSTEM_ROLE_LABEL) as Exclude<SystemRole, null>[]

type Draft = {
  salutation: Salutation | ''
  name: string
  surname: string
  email: string
  organization: string
  jobTitle: string
  sector: Sector | ''
  gender: Gender | ''
  ageGroup: AgeGroup | ''
  whatsappNumber: string
  systemRole: SystemRole | ''
  registerAsAttendee: boolean
  participationRole: ParticipationRole
  attendanceMode: AttendanceMode
}

const EMPTY: Draft = {
  salutation: '',
  name: '',
  surname: '',
  email: '',
  organization: '',
  jobTitle: '',
  sector: '',
  gender: '',
  ageGroup: '',
  whatsappNumber: '',
  systemRole: '',
  registerAsAttendee: false,
  participationRole: 'vip',
  attendanceMode: 'online',
}

function actionCodeSettingsFor(email: string) {
  return {
    url: `${window.location.origin}/invite/complete?email=${encodeURIComponent(email)}`,
    handleCodeInApp: true,
  }
}

function mapError(err: unknown): string {
  const code = (err as { code?: string })?.code
  if (code === 'auth/invalid-email') return "That doesn't look like a valid email address."
  if (code === 'auth/unauthorized-continue-uri') {
    return "This domain isn't authorized for sign-in links in the Firebase console yet."
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Passwordless email sign-in is disabled for this project — enable "Email link (passwordless sign-in)" under Authentication > Sign-in method > Email/Password in the Firebase console, then try again.'
  }
  return 'Could not send the invite — please try again.'
}

function inviteSummary(invite: Invite): string {
  const parts: string[] = []
  if (invite.systemRole) parts.push(SYSTEM_ROLE_LABEL[invite.systemRole])
  if (invite.registerAsAttendee && invite.participationRole && invite.attendanceMode) {
    parts.push(`${ROLE_LABEL[invite.participationRole]} · ${MODE_LABEL[invite.attendanceMode]}`)
  }
  return parts.join(' · ') || '—'
}

export default function AdminAccounts() {
  const { profile } = useAuth()
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justInvited, setJustInvited] = useState<string | null>(null)
  const [invites, setInvites] = useState<Invite[]>([])
  const [resendingId, setResendingId] = useState<string | null>(null)

  const [users, setUsers] = useState<User[]>([])
  const [symposium, setSymposium] = useState<Symposium | null>(null)
  const [registrationsByUser, setRegistrationsByUser] = useState<Map<string, Registration>>(new Map())
  const [attendanceBusyId, setAttendanceBusyId] = useState<string | null>(null)
  const [userSearch, setUserSearch] = useState('')

  async function load() {
    const [inv, allUsers, sym, regs] = await Promise.all([
      listInvites(),
      listAllUsers(),
      getDefaultSymposium(),
      listRegistrations(),
    ])
    setInvites(inv)
    setUsers(allUsers.sort((a, b) => a.name.localeCompare(b.name)))
    setSymposium(sym)
    const map = new Map<string, Registration>()
    for (const r of regs) {
      if (r.status !== 'withdrawn') map.set(r.userId, r)
    }
    setRegistrationsByUser(map)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSending(true)
    setError(null)
    setJustInvited(null)
    try {
      await createInvite({
        email: draft.email,
        salutation: draft.salutation || undefined,
        name: draft.name,
        surname: draft.surname,
        organization: draft.organization || undefined,
        jobTitle: draft.jobTitle || undefined,
        sector: draft.sector || undefined,
        gender: draft.gender || undefined,
        ageGroup: draft.ageGroup || undefined,
        whatsappNumber: draft.whatsappNumber || undefined,
        systemRole: draft.systemRole || undefined,
        registerAsAttendee: draft.registerAsAttendee,
        participationRole: draft.registerAsAttendee ? draft.participationRole : undefined,
        attendanceMode: draft.registerAsAttendee ? draft.attendanceMode : undefined,
        invitedBy: profile.id,
      })
      await sendSignInLinkToEmail(auth, draft.email, actionCodeSettingsFor(draft.email))
      setJustInvited(draft.email)
      setDraft(EMPTY)
      await load()
    } catch (err) {
      setError(mapError(err))
    } finally {
      setSending(false)
    }
  }

  async function handleResend(invite: Invite) {
    setResendingId(invite.id)
    try {
      await sendSignInLinkToEmail(auth, invite.email, actionCodeSettingsFor(invite.email))
    } catch (err) {
      setError(mapError(err))
    } finally {
      setResendingId(null)
    }
  }

  async function handleRoleChange(user: User, role: SystemRole) {
    await setUserSystemRole(user.id, role)
    await load()
  }

  async function handleToggleAttendance(user: User) {
    if (!symposium) return
    setAttendanceBusyId(user.id)
    try {
      const existing = registrationsByUser.get(user.id)
      if (existing) {
        await updateRegistration(existing.id, { status: 'withdrawn' })
      } else {
        await adminCreateAttendeeRegistration(user.id, symposium.id)
      }
      await load()
    } finally {
      setAttendanceBusyId(null)
    }
  }

  const canRegisterAttendance = !draft.systemRole || draft.registerAsAttendee
  const formValid = draft.email && draft.name && draft.surname && (draft.systemRole || draft.registerAsAttendee)

  const userQuery = userSearch.trim().toLowerCase()
  const visibleUsers = userQuery
    ? users.filter((u) =>
        [u.name, u.surname, u.email, u.organization].filter(Boolean).join(' ').toLowerCase().includes(userQuery)
      )
    : users

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <h1 className="text-3xl">Accounts &amp; Roles</h1>
      <p className="mt-2 text-sm text-slate-500">
        Invite someone who can't self-register — a new organiser account, a VIP, an invited expert —
        with a role and/or attendance already set. They get a passwordless sign-in link by email;
        completing it creates their account automatically.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 rounded-lg border border-sand-200 bg-white p-5">
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Salutation
            <select
              value={draft.salutation}
              onChange={(e) => setDraft({ ...draft, salutation: e.target.value as Salutation })}
              className="rounded-md border border-sand-200 px-3 py-2"
            >
              <option value="">—</option>
              {SALUTATIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Email
            <input
              type="email"
              required
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              className="rounded-md border border-sand-200 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Name
            <input
              required
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="rounded-md border border-sand-200 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Surname
            <input
              required
              value={draft.surname}
              onChange={(e) => setDraft({ ...draft, surname: e.target.value })}
              className="rounded-md border border-sand-200 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Organization
            <input
              value={draft.organization}
              onChange={(e) => setDraft({ ...draft, organization: e.target.value })}
              className="rounded-md border border-sand-200 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Job title
            <input
              value={draft.jobTitle}
              onChange={(e) => setDraft({ ...draft, jobTitle: e.target.value })}
              className="rounded-md border border-sand-200 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Sector
            <select
              value={draft.sector}
              onChange={(e) => setDraft({ ...draft, sector: e.target.value as Sector })}
              className="rounded-md border border-sand-200 px-3 py-2"
            >
              <option value="">—</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Gender
            <select
              value={draft.gender}
              onChange={(e) => setDraft({ ...draft, gender: e.target.value as Gender })}
              className="rounded-md border border-sand-200 px-3 py-2"
            >
              <option value="">—</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Age group
            <select
              value={draft.ageGroup}
              onChange={(e) => setDraft({ ...draft, ageGroup: e.target.value as AgeGroup })}
              className="rounded-md border border-sand-200 px-3 py-2"
            >
              <option value="">—</option>
              {AGE_GROUPS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            WhatsApp number
            <input
              value={draft.whatsappNumber}
              onChange={(e) => setDraft({ ...draft, whatsappNumber: e.target.value })}
              className="rounded-md border border-sand-200 px-3 py-2"
            />
          </label>
        </div>

        <div className="mt-2 rounded-md border border-sand-200 p-4">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            System role (admin access — leave as "None" for an attendee-only invite)
            <select
              value={draft.systemRole ?? ''}
              onChange={(e) => setDraft({ ...draft, systemRole: (e.target.value || null) as SystemRole | '' })}
              className="rounded-md border border-sand-200 px-3 py-2"
            >
              <option value="">None</option>
              {SYSTEM_ROLES.map((r) => (
                <option key={r} value={r}>
                  {SYSTEM_ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-2 rounded-md border border-sand-200 p-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={draft.registerAsAttendee}
              onChange={(e) => setDraft({ ...draft, registerAsAttendee: e.target.checked })}
            />
            Also register them for the symposium
          </label>
          {draft.registerAsAttendee && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                Role
                <select
                  value={draft.participationRole}
                  onChange={(e) => setDraft({ ...draft, participationRole: e.target.value as ParticipationRole })}
                  className="rounded-md border border-sand-200 px-3 py-2"
                >
                  {(Object.keys(ROLE_LABEL) as ParticipationRole[]).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm text-slate-700">
                Attendance
                <select
                  value={draft.attendanceMode}
                  onChange={(e) => setDraft({ ...draft, attendanceMode: e.target.value as AttendanceMode })}
                  className="rounded-md border border-sand-200 px-3 py-2"
                >
                  <option value="online">Online</option>
                  <option value="face_to_face">Face to face</option>
                </select>
              </label>
            </div>
          )}
        </div>

        {!canRegisterAttendance && (
          <p className="text-xs text-slate-400">
            Tip: most organisers also attend — tick "Also register them for the symposium" if this
            person should show up as an attendee too.
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {justInvited && <p className="text-sm text-green-600">Invite sent to {justInvited}.</p>}

        <button
          type="submit"
          disabled={sending || !formValid}
          className="mt-2 self-start rounded-full bg-ink-800 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-ink-700 disabled:opacity-60"
        >
          {sending ? 'Sending…' : 'Send invite'}
        </button>
      </form>

      <h2 className="mt-10 text-lg font-semibold text-ink-900">Invites</h2>
      <div className="mt-3 flex flex-col divide-y divide-sand-200 rounded-lg border border-sand-200 bg-white">
        {invites.length === 0 && <p className="px-5 py-4 text-sm text-slate-400">No invites sent yet.</p>}
        {invites.map((invite) => (
          <div key={invite.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-ink-900">
                {invite.name} {invite.surname} — {invite.email}
              </p>
              <p className="text-sm text-slate-500">{inviteSummary(invite)}</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className={invite.status === 'pending' ? 'text-gold-600' : 'text-green-600'}>
                {invite.status === 'pending' ? 'Pending' : 'Accepted'}
              </span>
              {invite.status === 'pending' && (
                <button
                  onClick={() => handleResend(invite)}
                  disabled={resendingId === invite.id}
                  className="text-ink-800 underline disabled:opacity-60"
                >
                  {resendingId === invite.id ? 'Sending…' : 'Resend'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">All users</h2>
          <p className="mt-1 text-sm text-slate-500">
            Change an existing account's system role, or toggle whether they're also registered to
            attend {symposium?.name ?? 'the symposium'}.
          </p>
        </div>
        <input
          type="search"
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="min-w-[240px] rounded-full border border-sand-200 px-4 py-1.5 text-sm"
        />
      </div>
      <div className="mt-3 flex flex-col divide-y divide-sand-200 rounded-lg border border-sand-200 bg-white">
        {users.length === 0 && <p className="px-5 py-4 text-sm text-slate-400">No accounts yet.</p>}
        {users.length > 0 && visibleUsers.length === 0 && (
          <p className="px-5 py-4 text-sm text-slate-400">No users match "{userSearch}".</p>
        )}
        {visibleUsers.map((user) => {
          const registration = registrationsByUser.get(user.id)
          return (
            <div key={user.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-ink-900">
                  {user.name} {user.surname}
                </p>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <select
                  value={user.systemRole ?? ''}
                  onChange={(e) => handleRoleChange(user, (e.target.value || null) as SystemRole)}
                  className="rounded-md border border-sand-200 px-2 py-1.5"
                >
                  <option value="">No system role</option>
                  {SYSTEM_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {SYSTEM_ROLE_LABEL[r]}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleToggleAttendance(user)}
                  disabled={!symposium || attendanceBusyId === user.id}
                  className="whitespace-nowrap text-ink-800 underline disabled:opacity-60"
                >
                  {attendanceBusyId === user.id
                    ? 'Working…'
                    : registration
                      ? 'Withdraw attendance'
                      : 'Register for attendance'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
