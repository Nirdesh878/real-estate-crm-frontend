import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute'
import AdminRoute from './routes/AdminRoute'
import MenuGuard from './routes/MenuGuard'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import UserDashboardPage from './pages/UserDashboardPage'
import UsersPage from './pages/UsersPage'
import PermissionsPage from './pages/PermissionsPage'
import MenusPage from './pages/MenusPage'
import LeadsPage from './pages/LeadsPage'
import LeadStatusesPage from './pages/LeadStatusesPage'
import { useAuth } from './state/auth/useAuth'
import { defaultDashboardPath } from './lib/roles'

function HomeRedirect() {
  const auth = useAuth()
  if (auth.status === 'loading') return null
  return (
    <Navigate
      to={auth.status === 'authenticated' ? defaultDashboardPath(auth.user) : '/login'}
      replace
    />
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<MenuGuard />}>
            <Route path="/user-dashboard" element={<UserDashboardPage />} />

            <Route element={<AdminRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/permissions" element={<PermissionsPage />} />
              <Route path="/menus" element={<MenusPage />} />
              <Route path="/lead-statuses" element={<LeadStatusesPage />} />
              <Route path="/leads" element={<LeadsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
