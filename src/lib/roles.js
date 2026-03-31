export const ROLE_ADMIN = 1
export const ROLE_CALLER = 2
export const ROLE_MANAGER = 3
export const ROLE_ROOT = 4

export function isAdmin(user) {
  const roleId = Number(user?.role_id)
  return roleId === ROLE_ADMIN || roleId === ROLE_ROOT
}

export function defaultDashboardPath(user) {
  return isAdmin(user) ? '/dashboard' : '/user-dashboard'
}
