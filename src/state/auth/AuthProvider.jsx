import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './AuthContext.jsx'
import {
  getMe,
  login as loginApi,
  logout as logoutApi,
  register as registerApi,
} from '../../lib/authApi'

const initialState = {
  status: 'loading',
  user: null,
  menus: [],
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(initialState)

  const refresh = useCallback(async () => {
    try {
      const { user, menus } = await getMe()
      setState({ status: 'authenticated', user, menus })
      return user
    } catch (error) {
      const status = error?.response?.status
      if (status === 401 || status === 419) {
        setState({ status: 'unauthenticated', user: null, menus: [] })
        return null
      }
      throw error
    }
  }, [])

  const login = useCallback(async ({ email, password }) => {
    await loginApi({ email, password })
    return refresh()
  }, [refresh])

  const register = useCallback(
    async ({ name, email, password, passwordConfirmation }) => {
      await registerApi({ name, email, password, passwordConfirmation })
      return refresh()
    },
    [refresh],
  )

  const logout = useCallback(async () => {
    await logoutApi()
    setState({ status: 'unauthenticated', user: null, menus: [] })
  }, [])

  const setMenus = useCallback((menus) => {
    setState((prev) => ({
      ...prev,
      menus: Array.isArray(menus) ? menus : [],
    }))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        await refresh()
      } catch {
        if (!cancelled) setState({ status: 'unauthenticated', user: null })
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [refresh])

  const value = useMemo(
    () => ({
      status: state.status,
      user: state.user,
      menus: state.menus,
      setMenus,
      login,
      register,
      logout,
      refresh,
    }),
    [
      login,
      logout,
      refresh,
      register,
      setMenus,
      state.menus,
      state.status,
      state.user,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
