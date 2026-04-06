import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, UserCog, Settings, Menu as MenuIcon, PhoneCall, List, PlusSquare, Network } from 'lucide-react'
import { useAuth } from '../../state/auth/useAuth'

const iconMap = {
  '/dashboard': LayoutDashboard,
  '/users': Users,
  '/permissions': UserCog,
  '/menus': MenuIcon,
  '/leads': List,
  '/lead-statuses': Settings,
  '/integrations': Network,
  '/user-dashboard': LayoutDashboard
}

export default function Sidebar() {
  const auth = useAuth()
  const location = useLocation()

  return (
    <aside className="hidden md:flex flex-col w-64 bg-dark-950 border-r border-dark-800 text-white shadow-2xl transition-all duration-300">
      <div className="p-6 flex items-center gap-3 border-b border-dark-800/80">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-primary-400 flex items-center justify-center font-bold text-lg shadow-lg shadow-primary-500/30">
          JND
        </div>
        <div>
          <h1 className="font-heading font-bold text-xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white to-dark-300">CRM</h1>
        </div>
      </div>

      <nav className="flex flex-col gap-1.5 p-4 flex-1 overflow-y-auto">
        <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-2 px-3">Menu</p>
        {(auth.menus?.length ? auth.menus : []).map((m) => {
          const Icon = iconMap[m.path] || Network
          const isActive = location.pathname.startsWith(m.path)
          
          return (
            <NavLink
              key={m.key ?? m.id}
              to={m.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive 
                  ? 'bg-primary-500/10 text-primary-400' 
                  : 'text-dark-300 hover:bg-dark-800 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110 mb-0.5 drop-shadow-md' : 'group-hover:scale-110 group-hover:text-primary-300'}`} strokeWidth={isActive ? 2.5 : 2} />
              {m.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="p-4 border-t border-dark-800 bg-dark-900/50">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-dark-800/50 border border-dark-700/50">
          <div className="w-8 h-8 rounded-full bg-primary-900 flex items-center justify-center text-primary-300 text-xs font-bold">
            {auth.user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{auth.user?.name || 'User'}</p>
            <p className="text-xs text-dark-400 truncate">{auth.user?.role?.name || auth.user?.role?.key || 'Role'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
