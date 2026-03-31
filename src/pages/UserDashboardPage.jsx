import Navbar from '../components/Navbar'

export default function UserDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

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
