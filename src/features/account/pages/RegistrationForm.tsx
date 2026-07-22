import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../lib/auth'
import { getDefaultSymposium } from '../../../lib/firestore/symposia'
import { getRegistrationForUser, createRegistration } from '../../../lib/firestore/registrations'
import { listThematicCommunities } from '../../../lib/firestore/thematicCommunities'
import { setUserOptIns } from '../../../lib/firestore/userCommunityOptIns'
import { createExhibitorProfile, listBoothOptions, listSponsorshipTiers } from '../../../lib/firestore/exhibitorProfiles'
import { updateOwnProfile } from '../../../lib/firestore/users'
import { listUserAbstractSubmissions } from '../../../lib/firestore/abstractSubmissions'
import type {
  AttendanceMode,
  BoothOption,
  ParticipationRole,
  Symposium,
  ThematicCommunity,
  VisibilityScope,
  SponsorshipTier,
} from '../../../types/models'

const ATTENDANCE_MODES: { value: AttendanceMode; label: string }[] = [
  { value: 'face_to_face', label: 'Face to face' },
  { value: 'online', label: 'Online' },
  { value: 'mixed', label: 'Mixed' },
]

// Presenter is deliberately excluded — spec 4.3: it's gated by a prior
// accepted abstract and pre-set on acceptance, not self-selected here.
const PARTICIPATION_ROLES: { value: ParticipationRole; label: string }[] = [
  { value: 'attendee', label: 'Attendee' },
  { value: 'exhibitor', label: 'Exhibitor' },
  { value: 'partner', label: 'Partner' },
]

const inputClass =
  'rounded-md border border-sand-200 bg-white px-3 py-2 text-ink-950 outline-none focus:border-ink-700'
const labelClass = 'flex flex-col gap-1 text-sm text-slate-700'

export default function RegistrationForm() {
  const { firebaseUser, profile } = useAuth()
  const navigate = useNavigate()

  const [symposium, setSymposium] = useState<Symposium | null>(null)
  const [communities, setCommunities] = useState<ThematicCommunity[]>([])
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)
  const [isAcceptedPresenter, setIsAcceptedPresenter] = useState(false)
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [affiliation, setAffiliation] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [attendanceMode, setAttendanceMode] = useState<AttendanceMode>('face_to_face')
  const [participationRole, setParticipationRole] = useState<ParticipationRole>('attendee')
  const [selectedCommunities, setSelectedCommunities] = useState<string[]>([])
  const [showInDirectory, setShowInDirectory] = useState(false)
  const [showWhatsapp, setShowWhatsapp] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [visibilityScope, setVisibilityScope] = useState<VisibilityScope>('all_attendees')

  const [companyName, setCompanyName] = useState('')
  const [boothOptionId, setBoothOptionId] = useState('')
  const [sponsorshipTierId, setSponsorshipTierId] = useState('')
  const [boothOptions, setBoothOptions] = useState<BoothOption[]>([])
  const [sponsorshipTiers, setSponsorshipTiers] = useState<SponsorshipTier[]>([])

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!firebaseUser || !profile) return
    setName(profile.name)
    setPhone(profile.phone ?? '')
    setWhatsappNumber(profile.whatsappNumber ?? '')
    setShowInDirectory(profile.showInDirectory)
    setShowWhatsapp(profile.showWhatsapp)
    setShowEmail(profile.showEmail)
    setVisibilityScope(profile.visibilityScope)

    getDefaultSymposium().then(async (s) => {
      setSymposium(s)
      if (!s) {
        setLoading(false)
        return
      }
      const [existing, communityList, booths, tiers, abstracts] = await Promise.all([
        getRegistrationForUser(firebaseUser.uid, s.id),
        listThematicCommunities(),
        listBoothOptions(s.id),
        listSponsorshipTiers(s.id),
        listUserAbstractSubmissions(firebaseUser.uid),
      ])
      setAlreadyRegistered(!!existing)
      setCommunities(communityList)
      setBoothOptions(booths)
      setSponsorshipTiers(tiers)
      const accepted = abstracts.some((a) => a.symposiumId === s.id && a.status === 'accepted')
      setIsAcceptedPresenter(accepted)
      if (accepted) setParticipationRole('presenter')
      setLoading(false)
    })
  }, [firebaseUser, profile])

  function toggleCommunity(id: string) {
    setSelectedCommunities((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!firebaseUser || !symposium) return
    setError(null)
    setSubmitting(true)
    try {
      await updateOwnProfile(firebaseUser.uid, {
        name,
        phone: phone || undefined,
        whatsappNumber: whatsappNumber || undefined,
        showInDirectory,
        showWhatsapp,
        showEmail,
        visibilityScope,
      })

      const registrationId = await createRegistration({
        userId: firebaseUser.uid,
        symposiumId: symposium.id,
        affiliation: affiliation || undefined,
        attendanceMode,
        participationRole,
      })

      if (participationRole === 'exhibitor') {
        await createExhibitorProfile({
          registrationId,
          companyName,
          boothOptionId,
          sponsorshipTierId,
        })
      }

      await setUserOptIns(firebaseUser.uid, symposium.id, selectedCommunities)

      navigate('/account', { replace: true })
    } catch {
      setError('Could not submit your registration. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  if (!symposium) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24">
        <p className="text-slate-500">Registration isn't open yet — check back soon.</p>
      </div>
    )
  }

  if (alreadyRegistered) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24">
        <h1 className="text-3xl">You're already registered</h1>
        <p className="mt-4 text-slate-500">
          You've already submitted a registration for {symposium.name}.{' '}
          <Link to="/account" className="text-ink-800 underline">
            View your account
          </Link>{' '}
          to check its status.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <p className="text-sm uppercase tracking-wide text-gold-600">Register</p>
      <h1 className="mt-2 text-4xl">{symposium.name}</h1>
      <p className="mt-4 text-slate-500">
        Submitting for a symposium is a separate step from creating your account. Fields marked
        here are captured once per symposium and can be edited afterwards from your account.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-ink-900">Your details</h2>
          <label className={labelClass}>
            Full name
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Affiliation / organisation
            <input
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            WhatsApp number
            <input
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-ink-900">Attendance</h2>
          <label className={labelClass}>
            Attendance mode
            <select
              value={attendanceMode}
              onChange={(e) => setAttendanceMode(e.target.value as AttendanceMode)}
              className={inputClass}
            >
              {ATTENDANCE_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          {isAcceptedPresenter ? (
            <div className={labelClass}>
              Participation role
              <p className="rounded-md border border-sand-200 bg-sand-100 px-3 py-2 text-ink-950">
                Presenter — your abstract was accepted
              </p>
            </div>
          ) : (
            <>
              <label className={labelClass}>
                Participation role
                <select
                  value={participationRole}
                  onChange={(e) => setParticipationRole(e.target.value as ParticipationRole)}
                  className={inputClass}
                >
                  {PARTICIPATION_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-sm text-slate-500">
                Presenting? Role is set automatically once your abstract is accepted —{' '}
                <Link to="/register/abstract" className="text-ink-800 underline">
                  submit an abstract
                </Link>{' '}
                instead of registering here.
              </p>
            </>
          )}
        </div>

        {participationRole === 'exhibitor' && (
          <div className="flex flex-col gap-4 rounded-md border border-sand-200 p-4">
            <h2 className="text-lg font-semibold text-ink-900">Exhibitor details</h2>
            <label className={labelClass}>
              Company name
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Booth option
              <select
                required
                value={boothOptionId}
                onChange={(e) => setBoothOptionId(e.target.value)}
                className={inputClass}
              >
                <option value="" disabled>
                  Select a booth option
                </option>
                {boothOptions.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Sponsorship tier
              <select
                required
                value={sponsorshipTierId}
                onChange={(e) => setSponsorshipTierId(e.target.value)}
                className={inputClass}
              >
                <option value="" disabled>
                  Select a sponsorship tier
                </option>
                {sponsorshipTiers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {communities.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-ink-900">Thematic communities</h2>
            <p className="text-sm text-slate-500">Opt in to any that match your interests.</p>
            <div className="flex flex-col gap-2">
              {communities.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={selectedCommunities.includes(c.id)}
                    onChange={() => toggleCommunity(c.id)}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-ink-900">Profile visibility</h2>
          <p className="text-sm text-slate-500">Off by default — you control what other attendees can see.</p>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={showInDirectory} onChange={(e) => setShowInDirectory(e.target.checked)} />
            List me in the attendee directory
          </label>
          {showInDirectory && (
            <>
              <label className="ml-6 flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={showEmail} onChange={(e) => setShowEmail(e.target.checked)} />
                Show my email
              </label>
              <label className="ml-6 flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={showWhatsapp} onChange={(e) => setShowWhatsapp(e.target.checked)} />
                Show my WhatsApp number
              </label>
              <label className="ml-6 flex flex-col gap-1 text-sm text-slate-700">
                Who can see my profile
                <select
                  value={visibilityScope}
                  onChange={(e) => setVisibilityScope(e.target.value as VisibilityScope)}
                  className={inputClass}
                >
                  <option value="all_attendees">All attendees</option>
                  <option value="same_role_only">Attendees with my role only</option>
                  <option value="organisers_only">Organisers only</option>
                  <option value="private">Private</option>
                </select>
              </label>
            </>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 self-start rounded-full bg-gold-500 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-gold-600 disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit registration'}
        </button>
      </form>
    </div>
  )
}
