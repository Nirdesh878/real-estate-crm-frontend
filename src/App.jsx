import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute'
import AdminRoute from './routes/AdminRoute'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import UserDashboardPage from './pages/UserDashboardPage'
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
          <Route path="/user-dashboard" element={<UserDashboardPage />} />

          <Route element={<AdminRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
