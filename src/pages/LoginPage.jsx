import { useMemo, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/auth/useAuth'
import { getLaravelErrorMessage } from '../lib/laravelErrors'
import { defaultDashboardPath, isAdmin } from '../lib/roles'

export default function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const fromPath = useMemo(() => {
    const from = location.state?.from?.pathname
    return typeof from === 'string' ? from : ''
  }, [location.state])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (auth.status === 'authenticated') {
    return <Navigate to={fromPath} replace />
  }

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const user = await auth.login({ email, password })
      const target = fromPath || defaultDashboardPath(user)
      const safeTarget = isAdmin(user) ? target : target === '/dashboard' ? '/user-dashboard' : target
      navigate(safeTarget, { replace: true })
    } catch (err) {
      setError(getLaravelErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center p-6">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Sign in
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Use your CRM account to continue.
            </p>
          </div>

          {error ? (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || auth.status === 'loading'}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            New here?{' '}
            <Link className="font-medium text-slate-900 underline" to="/register">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
