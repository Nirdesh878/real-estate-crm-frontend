import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { defaultDashboardPath } from '../lib/roles'
import { useAuth } from '../state/auth/useAuth'

export default function MenuGuard() {
  const auth = useAuth()
  const location = useLocation()

  const allowed = new Set((auth.menus ?? []).map((m) => m.path))
  const current = location.pathname

  if (allowed.has(current)) return <Outlet />

  const fallback = defaultDashboardPath(auth.user)
  if (allowed.has(fallback)) return <Navigate to={fallback} replace />

  const first = (auth.menus ?? [])[0]?.path
  if (first) return <Navigate to={first} replace />

  return <Navigate to="/login" replace />
}

