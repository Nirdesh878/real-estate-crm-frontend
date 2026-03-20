export const ROLE_ADMIN = 1
export const ROLE_USER = 2

export function isAdmin(user) {
  const roleId = Number(user?.role_id)
  return roleId === ROLE_ADMIN
}

export function defaultDashboardPath(user) {
  return isAdmin(user) ? '/dashboard' : '/user-dashboard'
}

