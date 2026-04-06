import { Menu, Bell, Search, LogOut } from 'lucide-react'
import { useAuth } from '../../state/auth/useAuth'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Header() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function onLogout() {
    await auth.logout()
    navigate('/login', { replace: true })
  }

  // Find current menu label based on path
  const currentMenu = auth.menus?.find(m => location.pathname.startsWith(m.path))
  const pageTitle = currentMenu?.label || 'Dashboard'

  return (
    <header className="h-20 border-b border-dark-200 bg-white/70 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-all">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 rounded-lg text-dark-500 hover:bg-dark-100 transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-heading font-semibold text-dark-900 hidden md:block">
          {pageTitle}
        </h2>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input 
            type="text" 
            placeholder="Search leads..." 
            className="pl-9 pr-4 py-2 bg-dark-50 border border-dark-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all w-64 text-dark-800 placeholder-dark-400"
          />
        </div>

        <button className="relative p-2 rounded-full text-dark-500 hover:bg-dark-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-6 w-px bg-dark-200 mx-1 hidden md:block"></div>

        <button 
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-dark-600 font-medium hover:bg-rose-50 hover:text-rose-600 transition-colors group text-sm"
        >
          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
