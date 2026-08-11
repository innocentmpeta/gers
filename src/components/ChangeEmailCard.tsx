import { useState } from 'react'
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail } from 'firebase/auth'
import { useAuth } from '../lib/auth'
import { updateOwnEmail } from '../lib/firestore/users'

function mapError(err: unknown): string {
  const code = (err as { code?: string })?.code
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Current password is incorrect.'
  }
  if (code === 'auth/email-already-in-use') return 'That email is already in use by another account.'
  if (code === 'auth/invalid-email') return 'Enter a valid email address.'
  return 'Could not change your email — please try again.'
}

// Self-service — changing the Auth email requires re-authenticating (same
// constraint as ChangePasswordCard), then syncing users/{uid}.email so the
// rest of the app (directory, admin lists) reads the new address too.
export default function ChangeEmailCard() {
  const { firebaseUser } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!firebaseUser?.email) return
    setSaving(true)
    setError(null)
    setDone(false)
    try {
      await reauthenticateWithCredential(firebaseUser, EmailAuthProvider.credential(firebaseUser.email, currentPassword))
      await updateEmail(firebaseUser, newEmail)
      await updateOwnEmail(firebaseUser.uid, newEmail)
      setCurrentPassword('')
      setNewEmail('')
      setDone(true)
    } catch (err) {
      setError(mapError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-sand-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-ink-900">Change your email (username)</h2>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          New email
          <input
            type="email"
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="rounded-md border border-sand-200 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Current password
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="rounded-md border border-sand-200 px-3 py-2"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {done && <p className="text-sm text-green-600">Email changed — use it next time you log in.</p>}
        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-full bg-ink-800 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-ink-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Update email'}
        </button>
      </form>
    </div>
  )
}
