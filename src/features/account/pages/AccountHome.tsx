import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../lib/auth'
import { getDefaultSymposium } from '../../../lib/firestore/symposia'
import {
  getRegistrationForUser,
  attemptConfirm,
  acceptOffer,
  declineOffer,
  requestModeSwitch,
} from '../../../lib/firestore/registrations'
import { listUserAbstractSubmissions } from '../../../lib/firestore/abstractSubmissions'
import type { AbstractSubmission, AttendanceMode, Registration, Symposium } from '../../../types/models'

const MEAL_OPTIONS = ['Standard', 'Vegetarian', 'Vegan', 'Halal', 'No meal']

const STATUS_LABEL: Record<Registration['status'], string> = {
  pending_approval: 'Pending approval',
  approved: 'Approved',
  rejected: 'Not approved',
}

const ABSTRACT_STATUS_LABEL: Record<AbstractSubmission['status'], string> = {
  pending: 'Pending review',
  accepted: 'Accepted',
  declined: 'Declined',
}

const MODE_LABEL: Record<AttendanceMode, string> = {
  face_to_face: 'Face to face',
  online: 'Online',
  mixed: 'Mixed',
}

export default function AccountHome() {
  const { firebaseUser, profile, logOut } = useAuth()
  const navigate = useNavigate()

  const [symposium, setSymposium] = useState<Symposium | null>(null)
  const [registration, setRegistration] = useState<Registration | null>(null)
  const [abstracts, setAbstracts] = useState<AbstractSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [mealPreference, setMealPreference] = useState(MEAL_OPTIONS[0])
  const [switchTarget, setSwitchTarget] = useState<AttendanceMode>('face_to_face')
  const [actionPending, setActionPending] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!firebaseUser) return
    try {
      const s = await getDefaultSymposium()
      const [reg, abs] = await Promise.all([
        s ? getRegistrationForUser(firebaseUser.uid, s.id) : Promise.resolve(null),
        listUserAbstractSubmissions(firebaseUser.uid),
      ])
      setSymposium(s)
      setRegistration(reg)
      setAbstracts(abs)
    } catch {
      setLoadError('Could not load your registration details. Please refresh the page.')
    } finally {
      setLoading(false)
    }
  }, [firebaseUser])

  useEffect(() => {
    load()
  }, [load])

  async function handleLogOut() {
    await logOut()
    navigate('/')
  }

  // Promoting the *next* waitlisted person is deliberately not triggered
  // from here — it requires reading other attendees' registrations, which
  // rules correctly restrict to admins. A freed slot gets offered out the
  // next time an admin's Registrations page runs its capacity sync.
  async function runAction(action: () => Promise<void>) {
    setActionPending(true)
    setActionError(null)
    try {
      await action()
      await load()
    } catch {
      setActionError('That action failed — please try again.')
    } finally {
      setActionPending(false)
    }
  }

  const handleConfirm = () =>
    runAction(async () => {
      if (!registration || !symposium) return
      await attemptConfirm(registration.id, symposium.id, mealPreference)
    })

  const handleAccept = () =>
    runAction(async () => {
      if (!registration || !symposium) return
      await acceptOffer(registration.id, symposium.id)
    })

  const handleDecline = () =>
    runAction(async () => {
      if (!registration || !symposium) return
      await declineOffer(registration.id, symposium.id)
    })

  const handleSwitch = () =>
    runAction(async () => {
      if (!registration || !symposium) return
      await requestModeSwitch(registration.id, symposium.id, switchTarget)
    })

  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <p className="text-sm uppercase tracking-wide text-gold-600">My Account</p>
      <h1 className="mt-2 text-4xl">{profile ? `Welcome, ${profile.name}` : 'My Account'}</h1>

      {profile && (
        <dl className="mt-8 grid max-w-sm grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-slate-500">Email</dt>
          <dd>{profile.email}</dd>
          <dt className="text-slate-500">System role</dt>
          <dd>{profile.systemRole ?? 'attendee (no admin role)'}</dd>
        </dl>
      )}

      <div className="mt-10 border-t border-sand-200 pt-8">
        <h2 className="text-lg font-semibold text-ink-900">Registration</h2>

        {loading && <p className="mt-2 text-sm text-slate-500">Loading…</p>}

        {loadError && <p className="mt-2 text-sm text-red-600">{loadError}</p>}

        {!loading && !loadError && !symposium && (
          <p className="mt-2 text-sm text-slate-500">Registration isn't open yet — check back soon.</p>
        )}

        {!loading && symposium && !registration && (
          <div className="mt-2">
            <p className="text-sm text-slate-500">You haven't registered for {symposium.name} yet.</p>
            <Link
              to="/register/apply"
              className="mt-4 inline-flex rounded-full bg-gold-500 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-gold-600"
            >
              Register now
            </Link>
          </div>
        )}

        {!loading && symposium && registration && (
          <div className="mt-2 flex flex-col gap-4">
            <dl className="grid max-w-sm grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-slate-500">Symposium</dt>
              <dd>{symposium.name}</dd>
              <dt className="text-slate-500">Status</dt>
              <dd>{STATUS_LABEL[registration.status]}</dd>
              <dt className="text-slate-500">Role</dt>
              <dd className="capitalize">{registration.participationRole}</dd>
              <dt className="text-slate-500">Attendance</dt>
              <dd>{MODE_LABEL[registration.attendanceMode]}</dd>
              {registration.confirmationStatus === 'confirmed' && (
                <>
                  <dt className="text-slate-500">Confirmed</dt>
                  <dd>Yes{registration.mealPreference && ` — ${registration.mealPreference}`}</dd>
                </>
              )}
            </dl>

            {actionError && <p className="text-sm text-red-600">{actionError}</p>}

            {registration.status === 'pending_approval' && (
              <p className="text-sm text-slate-500">
                We'll let you know once your registration has been reviewed.
              </p>
            )}

            {registration.status === 'rejected' && (
              <p className="text-sm text-slate-500">
                Your registration wasn't approved. Contact the organisers if you have questions.
              </p>
            )}

            {registration.status === 'approved' && registration.confirmationStatus === 'unconfirmed' && (
              <div className="rounded-md border border-sand-200 p-4">
                <p className="text-sm text-slate-700">
                  Please confirm your attendance
                  {symposium.confirmationDeadline &&
                    ` before ${new Date(symposium.confirmationDeadline).toLocaleDateString()}`}
                  .
                </p>
                <label className="mt-3 flex flex-col gap-1 text-sm text-slate-700">
                  Meal preference
                  <select
                    value={mealPreference}
                    onChange={(e) => setMealPreference(e.target.value)}
                    className="rounded-md border border-sand-200 bg-white px-3 py-2 text-ink-950 outline-none focus:border-ink-700"
                  >
                    {MEAL_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  onClick={handleConfirm}
                  disabled={actionPending}
                  className="mt-4 rounded-full bg-gold-500 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-gold-600 disabled:opacity-60"
                >
                  {actionPending ? 'Confirming…' : 'Confirm attendance'}
                </button>
              </div>
            )}

            {registration.confirmationStatus === 'waitlisted' && (
              <div className="rounded-md border border-sand-200 p-4">
                <p className="text-sm text-slate-700">
                  You're on the waitlist for <strong>{MODE_LABEL[registration.attendanceMode]}</strong>. We'll
                  offer you a spot as soon as one opens up.
                </p>
                {registration.previousConfirmedMode && (
                  <p className="mt-2 text-sm text-slate-500">
                    You remain confirmed for {MODE_LABEL[registration.previousConfirmedMode]} in the meantime.
                  </p>
                )}
              </div>
            )}

            {registration.confirmationStatus === 'offered' && (
              <div className="rounded-md border border-gold-500 bg-sand-50 p-4">
                <p className="text-sm text-slate-700">
                  A spot has opened up for <strong>{MODE_LABEL[registration.attendanceMode]}</strong>!
                  {registration.offerExpiresAt &&
                    ` Accept by ${new Date(registration.offerExpiresAt).toLocaleString()}, or it'll pass to the next person on the waitlist.`}
                </p>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleAccept}
                    disabled={actionPending}
                    className="rounded-full bg-gold-500 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-gold-600 disabled:opacity-60"
                  >
                    Accept
                  </button>
                  <button
                    onClick={handleDecline}
                    disabled={actionPending}
                    className="rounded-full border border-ink-800 px-5 py-2.5 text-sm text-ink-800 hover:bg-ink-800 hover:text-sand-50 disabled:opacity-60"
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}

            {registration.confirmationStatus === 'confirmed' && (
              <div className="rounded-md border border-sand-200 p-4">
                <p className="text-sm text-slate-700">Want to attend a different way?</p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <select
                    value={switchTarget}
                    onChange={(e) => setSwitchTarget(e.target.value as AttendanceMode)}
                    className="rounded-md border border-sand-200 bg-white px-3 py-2 text-sm text-ink-950 outline-none focus:border-ink-700"
                  >
                    {(Object.keys(MODE_LABEL) as AttendanceMode[])
                      .filter((m) => m !== registration.attendanceMode)
                      .map((m) => (
                        <option key={m} value={m}>
                          {MODE_LABEL[m]}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={handleSwitch}
                    disabled={actionPending}
                    className="rounded-full border border-ink-800 px-4 py-2 text-sm text-ink-800 hover:bg-ink-800 hover:text-sand-50 disabled:opacity-60"
                  >
                    {actionPending ? 'Switching…' : 'Switch attendance mode'}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  If the new mode is full, you'll be waitlisted for it without losing your current spot.
                </p>
              </div>
            )}
          </div>
        )}

        {!loading && abstracts.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-ink-900">Abstract submissions</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {abstracts.map((a) => (
                <li key={a.id} className="rounded-md border border-sand-200 p-3 text-sm">
                  <p className="font-medium text-ink-900">{a.title}</p>
                  <p className="text-slate-500">{ABSTRACT_STATUS_LABEL[a.status]}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        onClick={handleLogOut}
        className="mt-10 rounded-full border border-ink-800 px-4 py-2 text-sm text-ink-800 hover:bg-ink-800 hover:text-sand-50"
      >
        Log out
      </button>
    </div>
  )
}
