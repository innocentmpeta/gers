import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../lib/auth'

function mapError(err: unknown): string {
  const code = (err as { code?: string })?.code
  if (code === 'auth/invalid-email') return "That doesn't look like a valid email address."
  // Deliberately not distinguished from success — confirming an email
  // exists in the system would let anyone probe for registered accounts.
  if (code === 'auth/user-not-found') return ''
  return 'Could not send the reset email — please try again.'
}

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      const message = mapError(err)
      if (message) setError(message)
      else setSent(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-3xl">Forgot password</h1>
      {sent ? (
        <p className="mt-6 text-sm text-slate-600">
          If an account exists for {email}, we've sent a link to reset the password. Check your inbox
          (and spam folder) for an email from Firebase.
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm text-slate-500">
            Enter the email you signed up with and we'll send you a link to reset your password.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-sand-200 bg-white px-3 py-2 text-ink-950 outline-none focus:border-ink-700"
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 rounded-full bg-ink-800 px-4 py-2 text-sm font-medium text-sand-50 hover:bg-ink-700 disabled:opacity-60"
            >
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        </>
      )}
      <p className="mt-6 text-sm text-slate-500">
        <Link to="/login" className="text-ink-800 underline">
          Back to log in
        </Link>
      </p>
    </div>
  )
}
