import { useAuth } from '../state/auth/useAuth'

export default function DashboardPage() {
  const auth = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Real Estate CRM</p>
            <p className="text-xs text-slate-500">
              Signed in{auth.user?.email ? ` as ${auth.user.email}` : ''}.
            </p>
          </div>
          <button
            onClick={() => auth.logout()}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Dashboard</h2>
          <p className="mt-2 text-sm text-slate-600">
            Replace this page with your CRM modules (leads, properties, tasks).
          </p>
        </div>
      </main>
    </div>
  )
}

