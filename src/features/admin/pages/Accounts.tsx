import { useEffect, useState } from 'react'
import { sendSignInLinkToEmail } from 'firebase/auth'
import { auth } from '../../../lib/firebase'
import { createInvite, listInvites } from '../../../lib/firestore/invites'
import { useAuth } from '../../../lib/auth'
import type { AgeGroup, AttendanceMode, Gender, Invite, ParticipationRole, Salutation, Sector } from '../../../types/models'

const SALUTATIONS: Salutation[] = ['Mr', 'Ms', 'Mrs', 'Dr', 'Prof', 'Other']
const SECTORS: Sector[] = ['Government', 'Academia / Research', 'Private Sector', 'Civil Society / NGO', 'Student', 'Other']
const GENDERS: Gender[] = ['Male', 'Female', 'Prefer not to say', 'Other']
const AGE_GROUPS: AgeGroup[] = ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65+']

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

export default function AdminAccounts() {
  const { profile } = useAuth()
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justInvited, setJustInvited] = useState<string | null>(null)
  const [invites, setInvites] = useState<Invite[]>([])
  const [resendingId, setResendingId] = useState<string | null>(null)

  async function load() {
    setInvites(await listInvites())
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
        participationRole: draft.participationRole,
        attendanceMode: draft.attendanceMode,
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

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="text-3xl">Accounts &amp; Roles</h1>
      <p className="mt-2 text-sm text-slate-500">
        Invite someone who can't self-register — VIPs, invited experts — with a role and attendance
        mode already set. They get a passwordless sign-in link by email; completing it creates their
        account and registration automatically.
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

        {error && <p className="text-sm text-red-600">{error}</p>}
        {justInvited && <p className="text-sm text-green-600">Invite sent to {justInvited}.</p>}

        <button
          type="submit"
          disabled={sending}
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
              <p className="text-sm text-slate-500">
                {ROLE_LABEL[invite.participationRole]} · {MODE_LABEL[invite.attendanceMode]}
              </p>
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
    </div>
  )
}
