import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../lib/auth'
import { getDefaultSymposium } from '../../../lib/firestore/symposia'
import {
  getRegistrationForUser,
  attemptConfirm,
  acceptOffer,
  declineOffer,
  withdrawRegistration,
} from '../../../lib/firestore/registrations'
import { listUserAbstractSubmissions } from '../../../lib/firestore/abstractSubmissions'
import { syncSpeakerFromProfile } from '../../../lib/firestore/speakers'
import OrganizationEditor from '../OrganizationEditor'
import AccountProfileEditor from '../AccountProfileEditor'
import ChangePasswordCard from '../../../components/ChangePasswordCard'
import ChangeEmailCard from '../../../components/ChangeEmailCard'
import SymposiumDocuments from '../SymposiumDocuments'
import { getSymposiumDays, formatSymposiumDay } from '../../../lib/symposiumDays'
import type {
  AbstractSubmission,
  AttendanceDayChoice,
  AttendanceMode,
  ParticipationRole,
  Registration,
  Symposium,
} from '../../../types/models'

const MEAL_OPTIONS = ['Standard', 'Vegetarian', 'Vegan', 'Halal', 'No meal']

const DAY_CHOICE_LABEL: Record<AttendanceDayChoice, string> = {
  face_to_face: 'In-person',
  online: 'Online',
  none: 'None',
}

const STATUS_LABEL: Record<Registration['status'], string> = {
  pending_approval: 'Pending approval',
  approved: 'Approved',
  rejected: 'Not approved',
  withdrawn: 'Withdrawn',
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

const ROLE_LABEL: Record<ParticipationRole, string> = {
  public_participant: 'Public participant',
  invited_participant: 'Invited participant',
  exhibitor: 'Exhibitor',
  facilitator: 'Facilitator',
  presenter: 'Presenter',
  vip: 'VIP',
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
  const [attendanceDays, setAttendanceDays] = useState<Record<string, AttendanceDayChoice>>({})
  const [actionPending, setActionPending] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // Registration and abstracts are independent — one query failing (e.g. a
  // missing Firestore index) shouldn't blank out the whole page when the
  // other half loaded fine, so these are awaited separately rather than via
  // a single Promise.all.
  const load = useCallback(async () => {
    if (!firebaseUser) return
    setLoadError(null)
    try {
      const s = await getDefaultSymposium()
      setSymposium(s)
      try {
        setRegistration(s ? await getRegistrationForUser(firebaseUser.uid, s.id) : null)
      } catch (err) {
        console.error('Failed to load registration', err)
        setLoadError("We couldn't check your registration status.")
      }
      try {
        setAbstracts(await listUserAbstractSubmissions(firebaseUser.uid))
      } catch {
        // Non-critical — the abstracts list just stays empty.
      }
    } catch (err) {
      console.error('Failed to load account details', err)
      setLoadError("We couldn't load your account details.")
    } finally {
      setLoading(false)
    }
  }, [firebaseUser])

  useEffect(() => {
    load()
  }, [load])

  // Defaults every symposium day to "In-person" for someone invited to
  // attend that way — they opt specific days down to Online/None rather
  // than opting each one up, which matches what an in-person invite implies.
  // Only runs once the registration is actually confirmable, and respects
  // any choices already saved (e.g. re-opening this after a partial save).
  useEffect(() => {
    if (!symposium || !registration) return
    const days = getSymposiumDays(symposium)
    const defaults: Record<string, AttendanceDayChoice> = {}
    days.forEach((day) => {
      defaults[day] = registration.attendanceDays?.[day] ?? 'face_to_face'
    })
    setAttendanceDays(defaults)
  }, [symposium, registration])

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

  // Presenters/facilitators get their public Speakers card auto-created/
  // updated from their own account profile the moment their seat is
  // actually confirmed — so the bio/photo/organization they already
  // entered in "My Profile" doesn't have to be re-typed by an admin. Only
  // fires for those two roles; a confirmed public/invited participant has
  // no Speaker card to sync.
  async function maybeSyncSpeakerProfile() {
    if (!firebaseUser || !profile || !registration) return
    if (registration.participationRole !== 'presenter' && registration.participationRole !== 'facilitator') return
    await syncSpeakerFromProfile(firebaseUser.uid, registration.participationRole, {
      name: profile.name,
      surname: profile.surname,
      organization: profile.organization,
      jobTitle: profile.jobTitle,
      bio: profile.bio,
      photoMediaId: profile.photoMediaId,
      linkedinUrl: profile.linkedinUrl,
      areasOfInterest: profile.areasOfInterest,
      sdgs: profile.sdgs,
    })
  }

  const handleConfirm = () =>
    runAction(async () => {
      if (!registration || !symposium) return
      const status = await attemptConfirm(registration.id, symposium.id, mealPreference, attendanceDays)
      if (status === 'confirmed') await maybeSyncSpeakerProfile()
    })

  const handleAccept = () =>
    runAction(async () => {
      if (!registration || !symposium) return
      await acceptOffer(registration.id, symposium.id)
      await maybeSyncSpeakerProfile()
    })

  const handleDecline = () =>
    runAction(async () => {
      if (!registration || !symposium) return
      await declineOffer(registration.id, symposium.id)
    })

  const handleWithdraw = () =>
    runAction(async () => {
      if (!registration) return
      if (!confirm('Withdraw your registration? You can register again later if you change your mind.')) return
      await withdrawRegistration(registration.id)
    })

  // Keyed off attendance mode, not role — any face-to-face registration
  // (invited_participant, or a VIP/exhibitor/etc invited to attend in
  // person) needs the same confirm + meal-preference step; a face-to-face
  // registrant with a different role isn't a "just show up online" case.
  const isInvited = registration?.attendanceMode === 'face_to_face'

  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <p className="text-sm uppercase tracking-wide text-gold-600">My Account</p>
      <h1 className="mt-2 text-4xl">{profile ? `Welcome, ${profile.name}` : 'Welcome'}</h1>

      <div className="mt-10 border-t border-sand-200 pt-8">
        <h2 className="text-lg font-semibold text-ink-900">Registration</h2>

        {loading && <p className="mt-2 text-sm text-slate-500">Loading…</p>}

        {loadError && (
          <div className="mt-2">
            <p className="text-sm text-red-600">{loadError}</p>
            <button onClick={() => load()} className="mt-2 text-sm text-ink-800 underline">
              Try again
            </button>
          </div>
        )}

        {!loading && !loadError && !symposium && (
          <p className="mt-2 text-sm text-slate-500">Registration isn't open yet — check back soon.</p>
        )}

        {!loading && !loadError && symposium && !registration && (
          <div className="mt-2">
            <p className="text-sm font-medium text-gold-600">Not yet registered</p>
            <p className="mt-1 text-sm text-slate-500">
              You haven't signed up for {symposium.name} yet.
            </p>
            <Link
              to="/register/apply"
              className="mt-4 inline-flex rounded-full bg-gold-500 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-gold-600"
            >
              Sign up &amp; Register
            </Link>
          </div>
        )}

        {!loading && symposium && registration && (
          <div className="mt-2 flex flex-col gap-4">
            {registration.status === 'approved' && (
              <p className="text-sm font-medium text-green-600">Registered</p>
            )}
            <dl className="grid max-w-sm grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-slate-500">Symposium</dt>
              <dd>{symposium.name}</dd>
              <dt className="text-slate-500">Status</dt>
              <dd>{STATUS_LABEL[registration.status]}</dd>
              <dt className="text-slate-500">Role</dt>
              <dd>{ROLE_LABEL[registration.participationRole]}</dd>
              {isInvited && registration.confirmationStatus === 'confirmed' && (
                <>
                  <dt className="text-slate-500">Confirmed</dt>
                  <dd>Yes{registration.mealPreference && ` — ${registration.mealPreference}`}</dd>
                  {registration.attendanceDays && Object.keys(registration.attendanceDays).length > 0 && (
                    <>
                      <dt className="text-slate-500">Per day</dt>
                      <dd>
                        {Object.entries(registration.attendanceDays)
                          .map(([day, choice]) => `${formatSymposiumDay(day)}: ${DAY_CHOICE_LABEL[choice]}`)
                          .join(', ')}
                      </dd>
                    </>
                  )}
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

            {registration.status === 'withdrawn' && (
              <p className="text-sm text-slate-500">
                You've withdrawn from {symposium.name}. Want to attend after all?{' '}
                <Link to="/register/apply" className="text-ink-800 underline">
                  Register again
                </Link>
                .
              </p>
            )}

            {/* Invited (in-person) attendees confirm + choose a meal preference ahead of
                the event — online participation needs neither, just an option to withdraw. */}
            {isInvited && registration.status === 'approved' && registration.confirmationStatus === 'unconfirmed' && (
              <div className="rounded-md border border-sand-200 p-4">
                <p className="text-sm text-slate-700">
                  You've been invited to attend in person — please confirm your attendance
                  {symposium.confirmationDeadline &&
                    ` before ${new Date(symposium.confirmationDeadline).toLocaleDateString()}`}
                  .
                </p>
                {getSymposiumDays(symposium).length > 0 && (
                  <div className="mt-3 flex flex-col gap-2">
                    <p className="text-sm text-slate-700">Attendance per day</p>
                    {getSymposiumDays(symposium).map((day) => (
                      <label key={day} className="flex items-center justify-between gap-3 text-sm text-slate-600">
                        {formatSymposiumDay(day)}
                        <select
                          value={attendanceDays[day] ?? 'face_to_face'}
                          onChange={(e) =>
                            setAttendanceDays((prev) => ({ ...prev, [day]: e.target.value as AttendanceDayChoice }))
                          }
                          className="rounded-md border border-sand-200 bg-white px-3 py-1.5 text-ink-950 outline-none focus:border-ink-700"
                        >
                          {(['face_to_face', 'online', 'none'] as AttendanceDayChoice[]).map((choice) => (
                            <option key={choice} value={choice}>
                              {DAY_CHOICE_LABEL[choice]}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                )}
                <label className="mt-3 flex flex-col gap-1 text-sm text-slate-700">
                  Dietary requirements
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

            {isInvited && registration.confirmationStatus === 'waitlisted' && (
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

            {isInvited && registration.confirmationStatus === 'offered' && (
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

            {registration.status === 'approved' && !isInvited && (
              <div>
                <button
                  onClick={handleWithdraw}
                  disabled={actionPending}
                  className="mt-3 text-sm text-red-600 underline disabled:opacity-60"
                >
                  Withdraw my registration
                </button>
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

      {symposium && <SymposiumDocuments symposiumId={symposium.id} />}

      {firebaseUser && profile && (
        <AccountProfileEditor userId={firebaseUser.uid} profile={profile} symposiumId={symposium?.id} />
      )}

      {firebaseUser && registration?.participationRole !== 'exhibitor' && (
        <OrganizationEditor userId={firebaseUser.uid} />
      )}

      {/* RoleProfileEditor (the old presenter/facilitator/exhibitor-specific
          "Your public profile" form, which feeds the Speaker/Exhibition
          public cards) is deliberately not rendered here anymore — it was
          showing alongside AccountProfileEditor's own "Your public profile"
          section above, which read as two duplicate/confusing forms per
          organiser feedback 2026-08-12. Admin currently creates Speaker/
          Exhibitor cards manually either way (see admin Speakers/Partners
          pages), so removing self-submission from this screen doesn't lose
          any actual capability right now. Re-linking AccountProfileEditor's
          fields to the public cards is tracked separately (not urgent per
          that same feedback) rather than restoring this duplicate form. */}

      <div className="mt-10 border-t border-sand-200 pt-8">
        <h2 className="text-lg font-semibold text-ink-900">Community of practice</h2>
        <p className="mt-1 text-sm text-slate-500">
          Browse members who've opted into the directory — filter by community, and reach out via
          whatever contact details they've chosen to share.
        </p>
        <Link
          to="/directory"
          className="mt-3 inline-flex rounded-full border border-ink-800 px-5 py-2.5 text-sm text-ink-800 hover:bg-ink-800 hover:text-sand-50"
        >
          Browse the directory
        </Link>
      </div>

      <div className="mt-10 flex flex-col gap-6 border-t border-sand-200 pt-8">
        <ChangeEmailCard />
        <ChangePasswordCard />
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
