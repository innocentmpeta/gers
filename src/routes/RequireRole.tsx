import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { can, type Capability } from '../types/permissions'

// Gates the admin shell. Any signed-in user with a systemRole may enter (the
// individual admin pages narrow further by specific capability); attendees
// with no systemRole are bounced back to the public site.
export default function RequireRole({ capability }: { capability?: Capability }) {
  const { firebaseUser, profile, loading } = useAuth()

  if (loading) return null
  if (!firebaseUser || !profile?.systemRole) {
    return <Navigate to="/login" replace />
  }
  if (capability && !can(profile.systemRole, capability)) {
    return <Navigate to="/admin" replace />
  }
  return <Outlet />
}
