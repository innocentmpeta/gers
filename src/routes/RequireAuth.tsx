import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function RequireAuth() {
  const { firebaseUser, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <Outlet />
}
