import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../lib/auth'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signUp(name, email, password)
      navigate('/account', { replace: true })
    } catch (err) {
      const code = (err as { code?: string }).code
      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.')
      } else if (code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.')
      } else if (code === 'auth/operation-not-allowed') {
        setError('Email/password sign-in is not yet enabled for this project.')
      } else {
        setError('Could not create your account. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-3xl">Create your account</h1>
      <p className="mt-2 text-sm text-slate-500">
        Your account is active immediately — registering for a symposium is a separate step
        once you're signed in.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Full name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-sand-200 bg-white px-3 py-2 text-teal-950 outline-none focus:border-teal-700"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-sand-200 bg-white px-3 py-2 text-teal-950 outline-none focus:border-teal-700"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-sand-200 bg-white px-3 py-2 text-teal-950 outline-none focus:border-teal-700"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-ochre-500 px-4 py-2 text-sm font-medium text-sand-50 hover:bg-ochre-600 disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="text-teal-800 underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
