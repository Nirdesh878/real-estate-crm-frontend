import { useAuth } from '../state/auth/useAuth'

export default function UserDashboardPage() {
  const auth = useAuth()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">User Dashboard</p>
            <p className="text-xs text-slate-500">
              Welcome{auth.user?.name ? `, ${auth.user.name}` : ''}.
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
          <h2 className="text-lg font-semibold text-slate-900">My Workspace</h2>
          <p className="mt-2 text-sm text-slate-600">
            Add user features here (my leads, my tasks, my profile).
          </p>
        </div>
      </main>
    </div>
  )
}

