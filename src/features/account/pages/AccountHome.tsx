import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../lib/auth'

export default function AccountHome() {
  const { profile, logOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogOut() {
    await logOut()
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <p className="text-sm uppercase tracking-wide text-ochre-600">My Account</p>
      <h1 className="mt-2 text-4xl">{profile ? `Welcome, ${profile.name}` : 'My Account'}</h1>
      <p className="mt-4 max-w-xl text-slate-500">
        Registration status, confirmation, meal preference, visibility settings, and session
        access will be built out in Phase 5.
      </p>
      {profile && (
        <dl className="mt-8 grid max-w-sm grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-slate-500">Email</dt>
          <dd>{profile.email}</dd>
          <dt className="text-slate-500">System role</dt>
          <dd>{profile.systemRole ?? 'attendee (no admin role)'}</dd>
        </dl>
      )}
      <button
        onClick={handleLogOut}
        className="mt-8 rounded-full border border-teal-800 px-4 py-2 text-sm text-teal-800 hover:bg-teal-800 hover:text-sand-50"
      >
        Log out
      </button>
    </div>
  )
}
