import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../lib/auth'
import { getDefaultSymposium } from '../../../lib/firestore/symposia'
import { submitAbstract } from '../../../lib/firestore/abstractSubmissions'
import { updateOwnProfile } from '../../../lib/firestore/users'
import type { Symposium } from '../../../types/models'

const inputClass =
  'rounded-md border border-sand-200 bg-white px-3 py-2 text-ink-950 outline-none focus:border-ink-700'
const labelClass = 'flex flex-col gap-1 text-sm text-slate-700'

export default function AbstractSubmissionForm() {
  const { firebaseUser, profile } = useAuth()

  const [symposium, setSymposium] = useState<Symposium | null>(null)
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [affiliation, setAffiliation] = useState('')
  const [phone, setPhone] = useState('')
  const [track, setTrack] = useState('')
  const [title, setTitle] = useState('')
  const [abstractText, setAbstractText] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!profile) return
    setName(profile.name)
    setPhone(profile.phone ?? '')
    getDefaultSymposium().then((s) => {
      setSymposium(s)
      setLoading(false)
    })
  }, [profile])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!firebaseUser || !symposium) return
    setError(null)
    setSubmitting(true)
    try {
      await updateOwnProfile(firebaseUser.uid, { name, phone: phone || undefined })
      await submitAbstract({
        userId: firebaseUser.uid,
        symposiumId: symposium.id,
        affiliation: affiliation || undefined,
        track,
        title,
        abstractText,
      })
      setSubmitted(true)
    } catch {
      setError('Could not submit your abstract. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  if (!symposium) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24">
        <p className="text-slate-500">Abstract submissions aren't open yet — check back soon.</p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24">
        <h1 className="text-3xl">Abstract submitted</h1>
        <p className="mt-4 text-slate-500">
          Thanks — we'll email you once it's been reviewed. If accepted, you'll be invited to
          complete your full registration with your role set to Presenter.{' '}
          <Link to="/account" className="text-ink-800 underline">
            Back to your account
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <p className="text-sm uppercase tracking-wide text-gold-600">Submit an abstract</p>
      <h1 className="mt-2 text-4xl">{symposium.name}</h1>
      <p className="mt-4 text-slate-500">
        Submit before registering — if accepted, you'll be invited to complete registration with
        your role pre-set to Presenter.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className={labelClass}>
          Full name
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          Affiliation / organisation
          <input value={affiliation} onChange={(e) => setAffiliation(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          Track
          <input required value={track} onChange={(e) => setTrack(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          Abstract title
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          Abstract text
          <textarea
            required
            rows={8}
            value={abstractText}
            onChange={(e) => setAbstractText(e.target.value)}
            className={inputClass}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 self-start rounded-full bg-gold-500 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-gold-600 disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit abstract'}
        </button>
      </form>
    </div>
  )
}
