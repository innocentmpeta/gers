import { useState } from 'react'
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth'
import { useAuth } from '../lib/auth'

function mapError(err: unknown): string {
  const code = (err as { code?: string })?.code
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Current password is incorrect.'
  }
  if (code === 'auth/weak-password') return 'New password must be at least 6 characters.'
  return 'Could not change your password — please try again.'
}

// Self-service only — Firebase's client SDK can only change the currently
// signed-in user's own password, not someone else's (that needs the Admin
// SDK, i.e. a backend, which this project doesn't have yet). Available to
// any logged-in admin role, not just super admin, so it lives on the
// Dashboard rather than the super-admin-gated Accounts & Roles page.
export default function ChangePasswordCard() {
  const { firebaseUser } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
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
      await updatePassword(firebaseUser, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setDone(true)
    } catch (err) {
      setError(mapError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-sand-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-ink-900">Change your password</h2>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
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
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          New password
          <input
            type="password"
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="rounded-md border border-sand-200 px-3 py-2"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {done && <p className="text-sm text-green-600">Password changed.</p>}
        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-full bg-ink-800 px-5 py-2.5 text-sm font-medium text-sand-50 hover:bg-ink-700 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
