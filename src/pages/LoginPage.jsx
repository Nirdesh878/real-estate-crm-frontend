import { useMemo, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../state/auth/useAuth'
import { getLaravelErrorMessage } from '../lib/laravelErrors'
import { defaultDashboardPath, isAdmin } from '../lib/roles'
import { loginSchema } from '../lib/validation/schemas'

export default function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const fromPath = useMemo(() => {
    const from = location.state?.from?.pathname
    return typeof from === 'string' ? from : ''
  }, [location.state])

  const [error, setError] = useState('')

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onChange',
  })

  if (auth.status === 'authenticated') {
    const redirectTarget =
      fromPath && fromPath !== '/login' && fromPath !== '/register'
        ? fromPath
        : defaultDashboardPath(auth.user)
    const safeTarget = isAdmin(auth.user)
      ? redirectTarget
      : redirectTarget === '/dashboard'
        ? '/user-dashboard'
        : redirectTarget
    return <Navigate to={safeTarget} replace />
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setError('')

    try {
      const user = await auth.login(values)
      const target = fromPath || defaultDashboardPath(user)
      const safeTarget = isAdmin(user)
        ? target
        : target === '/dashboard'
          ? '/user-dashboard'
          : target
      navigate(safeTarget, { replace: true })
    } catch (err) {
      setError(getLaravelErrorMessage(err))
    }
  })

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
                autoComplete="email"
                {...form.register('email')}
              />
              {form.formState.errors.email?.message ? (
                <p className="mt-1 text-xs text-rose-700">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-300 placeholder:text-slate-400 focus:ring-2"
                type="password"
                autoComplete="current-password"
                {...form.register('password')}
              />
              {form.formState.errors.password?.message ? (
                <p className="mt-1 text-xs text-rose-700">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={form.formState.isSubmitting || auth.status === 'loading'}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
