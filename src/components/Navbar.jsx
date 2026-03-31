import { NavLink, useNavigate } from 'react-router-dom'
import { defaultDashboardPath } from '../lib/roles'
import { useAuth } from '../state/auth/useAuth'

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'rounded-xl px-3 py-2 text-sm font-medium',
          isActive
            ? 'bg-slate-900 text-white'
            : 'text-slate-700 hover:bg-slate-100',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  )
}

export default function Navbar() {
  const auth = useAuth()
  const navigate = useNavigate()

  async function onLogout() {
    await auth.logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
            RE
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Real Estate CRM
            </p>
            <p className="text-xs text-slate-500">
              {auth.user?.email || 'Signed in'}
            </p>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          {(auth.menus?.length ? auth.menus : null)?.map((m) => (
            <NavItem key={m.key ?? m.id} to={m.path}>
              {m.label}
            </NavItem>
          )) ?? <NavItem to={defaultDashboardPath(auth.user)}>Dashboard</NavItem>}

          <button
            onClick={onLogout}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  )
}
