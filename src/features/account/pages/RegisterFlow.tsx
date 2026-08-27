import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../lib/auth'
import { getDefaultSymposium } from '../../../lib/firestore/symposia'
import { getRegistrationForUser, createDefaultRegistration } from '../../../lib/firestore/registrations'
import type { NewUserProfileInput } from '../../../lib/firestore/users'
import { SALUTATIONS, SECTORS, GENDERS, AGE_GROUPS, DISABILITY_OPTIONS, FIELD_LABELS } from '../profileFieldOptions'
import type { Salutation, Gender, AgeGroup, Disability, Sector, Symposium, VisibilityScope } from '../../../types/models'

const inputClass =
  'rounded-md border border-sand-200 bg-white px-3 py-2 text-ink-950 outline-none focus:border-ink-700'
const labelClass = 'flex flex-col gap-1 text-sm text-slate-700'

// The single entry point into "attending GERS" — replaces the old separate
// sign-up-then-register-later flow (project-docs meeting notes 2026-07-31):
// creating an account IS registering, as an online public participant,
// pending organiser approval. Organisers assign every other role/attendance
// mode afterward; nothing here is self-selected beyond identity fields.
export default function RegisterFlow() {
  const { firebaseUser, profile, signUp } = useAuth()
  const navigate = useNavigate()

  const [symposium, setSymposium] = useState<Symposium | null>(null)
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)
  const [loading, setLoading] = useState(true)

  // True for the whole bundled sign-up+register submission. Creating the
  // Firebase Auth account flips `firebaseUser` truthy immediately — well
  // before registration creation + navigation finish — which would
  // otherwise make this component swap to <QuickRegister> mid-submit and
  // orphan the in-flight registration write. This flag keeps the full form
  // mounted until the whole thing completes.
  const [submittingSignUp, setSubmittingSignUp] = useState(false)
  const [signUpError, setSignUpError] = useState<string | null>(null)

  useEffect(() => {
    if (submittingSignUp) return
    getDefaultSymposium().then(async (s) => {
      setSymposium(s)
      if (s && firebaseUser) {
        const existing = await getRegistrationForUser(firebaseUser.uid, s.id)
        setAlreadyRegistered(!!existing)
      }
      setLoading(false)
    })
  }, [firebaseUser, submittingSignUp])

  async function handleFullSignUpAndRegister(password: string, profileData: NewUserProfileInput) {
    setSignUpError(null)
    setSubmittingSignUp(true)
    try {
      const uid = await signUp(password, profileData)
      if (symposium) await createDefaultRegistration(uid, symposium.id)
      navigate('/account', { replace: true })
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code === 'auth/email-already-in-use') {
        setSignUpError('An account with this email already exists — log in instead to register.')
      } else if (code === 'auth/weak-password') {
        setSignUpError('Password should be at least 6 characters.')
      } else {
        setSignUpError('Could not create your account. Please try again.')
      }
      setSubmittingSignUp(false)
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

  if (submittingSignUp || signUpError || !firebaseUser) {
    return (
      <FullSignUpAndRegister
        symposium={symposium}
        submitting={submittingSignUp}
        error={signUpError}
        onSubmit={handleFullSignUpAndRegister}
      />
    )
  }

  if (alreadyRegistered) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24">
        <h1 className="text-3xl">You're already registered</h1>
        <p className="mt-4 text-slate-500">
          You've already registered for {symposium.name}.{' '}
          <Link to="/account" className="text-ink-800 underline">
            View your account
          </Link>{' '}
          to check its status.
        </p>
      </div>
    )
  }

  return (
    <QuickRegister
      symposium={symposium}
      name={profile?.name}
      onDone={() => navigate('/account', { replace: true })}
    />
  )
}

// Already has an account, just not registered for this symposium yet — every
// field they'd need was already collected at sign-up, so this is one click.
function QuickRegister({
  symposium,
  name,
  onDone,
}: {
  symposium: Symposium
  name: string | undefined
  onDone: () => void
}) {
  const { firebaseUser } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRegister() {
    if (!firebaseUser) return
    setError(null)
    setSubmitting(true)
    try {
      await createDefaultRegistration(firebaseUser.uid, symposium.id)
      onDone()
    } catch {
      setError('Could not submit your registration. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <p className="text-sm uppercase tracking-wide text-gold-600">Register</p>
      <h1 className="mt-2 text-4xl">{symposium.name}</h1>
      <p className="mt-4 text-slate-500">
        {name ? `Register ${name} for ${symposium.name}` : `Register for ${symposium.name}`} — your account details
        are already on file, so there's nothing else to fill in.
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <button
        onClick={handleRegister}
        disabled={submitting}
        className="mt-6 rounded-full bg-gold-500 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-gold-600 disabled:opacity-60"
      >
        {submitting ? 'Registering…' : 'Register now'}
      </button>
    </div>
  )
}

function FullSignUpAndRegister({
  symposium,
  submitting,
  error,
  onSubmit,
}: {
  symposium: Symposium
  submitting: boolean
  error: string | null
  onSubmit: (password: string, profileData: NewUserProfileInput) => void
}) {
  const [salutation, setSalutation] = useState<Salutation | ''>('')
  const [name, setName] = useState('')
  const [surname, setSurname] = useState('')
  const [organization, setOrganization] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [sector, setSector] = useState<Sector | ''>('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [ageGroup, setAgeGroup] = useState<AgeGroup | ''>('')
  const [disability, setDisability] = useState<Disability | ''>('')
  const [email, setEmail] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showInDirectory, setShowInDirectory] = useState(false)
  const [visibilityScope] = useState<VisibilityScope>('all_attendees')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit(password, {
      salutation: salutation || undefined,
      name,
      surname,
      email,
      organization: organization || undefined,
      jobTitle: jobTitle || undefined,
      sector: sector || undefined,
      gender: gender || undefined,
      ageGroup: ageGroup || undefined,
      disability: disability || undefined,
      whatsappNumber: whatsappNumber || undefined,
      showInDirectory,
      visibilityScope,
    })
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <p className="text-sm uppercase tracking-wide text-gold-600">Register</p>
      <h1 className="mt-2 text-4xl">GERS Community of Practice</h1>
      <p className="mt-4 text-slate-500">
        Sign up as part of the GERS Community of Practice and register for {symposium.name} in one
        step — you'll be registered as a participant for this year's Symposium, pending approval
        and further role allocation by organisers.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div className="flex gap-4">
          <label className={labelClass + ' w-32 shrink-0'}>
            {FIELD_LABELS.salutation}
            <select value={salutation} onChange={(e) => setSalutation(e.target.value as Salutation)} className={inputClass}>
              <option value="">—</option>
              {SALUTATIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Name
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Surname
            <input required value={surname} onChange={(e) => setSurname(e.target.value)} className={inputClass} />
          </label>
        </div>

        <label className={labelClass}>
          {FIELD_LABELS.organization}
          <input value={organization} onChange={(e) => setOrganization(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          {FIELD_LABELS.jobTitle}
          <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputClass} />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className={labelClass}>
            Sector
            <select value={sector} onChange={(e) => setSector(e.target.value as Sector)} className={inputClass}>
              <option value="">—</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Gender
            <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} className={inputClass}>
              <option value="">—</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Age group
            <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value as AgeGroup)} className={inputClass}>
              <option value="">—</option>
              {AGE_GROUPS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className={labelClass}>
          {FIELD_LABELS.disability}
          <select
            value={disability}
            onChange={(e) => setDisability(e.target.value as Disability)}
            className={inputClass}
          >
            <option value="">—</option>
            {DISABILITY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          {FIELD_LABELS.whatsapp}
          <input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={showInDirectory} onChange={(e) => setShowInDirectory(e.target.checked)} />
          {FIELD_LABELS.directoryCheckbox} (you can change this anytime from your account)
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 self-start rounded-full bg-gold-500 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-gold-600 disabled:opacity-60"
        >
          {submitting ? 'Registering…' : 'Create account & register'}
        </button>
        <div className="text-xs text-slate-500">
          <p>
            By registering you consent to GERS using your details for event administration,
            communications and research/reporting purposes.
          </p>
          <p className="mt-2">
            Personal information is collected, managed and processed by GDEnv in accordance with
            the guidelines stipulated in the Protection of Personal Information Act (PoPIA), as
            well as associated legislation. Your information will only be used internally by
            GDEnv and disposed of in accordance with legislative requirements if not needed. We
            will not share your information with 3rd parties, unless explicitly permitted by
            yourself in writing.
          </p>
        </div>
      </form>

      <p className="mt-6 text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="text-ink-800 underline">
          Log in to register
        </Link>
      </p>
    </div>
  )
}
