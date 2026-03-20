import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../state/auth/useAuth'

function FullPageLoader() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center p-6">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
          <p className="mt-3 text-sm text-slate-600">Loading…</p>
        </div>
      </div>
    </div>
  )
}

export default function ProtectedRoute() {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') return <FullPageLoader />

  if (auth.status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

