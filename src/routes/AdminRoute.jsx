import { Navigate, Outlet } from 'react-router-dom'
import { isAdmin } from '../lib/roles'
import { useAuth } from '../state/auth/useAuth'

export default function AdminRoute() {
  const auth = useAuth()

  if (!isAdmin(auth.user)) {
    return <Navigate to="/user-dashboard" replace />
  }

  return <Outlet />
}

