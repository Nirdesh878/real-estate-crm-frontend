import Navbar from '../components/Navbar'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-5xl p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Admin Dashboard</h2>
          <p className="mt-2 text-sm text-slate-600">
            Replace this page with your CRM modules (leads, properties, tasks).
          </p>
        </div>
      </main>
    </div>
  )
}
