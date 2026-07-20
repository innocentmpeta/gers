import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../lib/auth'

export default function Login() {
  const { logIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: Location })?.from?.pathname ?? '/account'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await logIn(email, password)
      navigate(from, { replace: true })
    } catch {
      setError('Could not sign in. Check your email and password and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-3xl">Log in</h1>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-sand-200 bg-white px-3 py-2 text-teal-950 outline-none focus:border-teal-700"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-teal-800 px-4 py-2 text-sm font-medium text-sand-50 hover:bg-teal-700 disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-500">
        No account yet?{' '}
        <Link to="/signup" className="text-teal-800 underline">
          Create one
        </Link>
      </p>
    </div>
  )
}
