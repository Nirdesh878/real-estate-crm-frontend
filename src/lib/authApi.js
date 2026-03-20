import { AUTH_MODE } from '../config'
import { api } from './apiClient'
import { clearAuthToken, setAuthToken } from './tokenStorage'

async function ensureSanctumCsrfCookie() {
  await api.get('/sanctum/csrf-cookie')
}

export async function login({ email, password }) {
  if (AUTH_MODE === 'sanctum') {
    await ensureSanctumCsrfCookie()
    await api.post('/login', { email, password })
    const { data: user } = await api.get('/api/user')
    return user
  }

  const { data } = await api.post('/api/login', { email, password })
  const token = data?.token
  if (typeof token === 'string' && token.trim()) {
    setAuthToken(token)
  }
  return data?.user ?? null
}

export async function register({ name, email, password, passwordConfirmation }) {
  if (AUTH_MODE === 'sanctum') {
    throw new Error(
      "Register is configured for token mode. Set VITE_AUTH_MODE=token (and restart `npm run dev`).",
    )
  }

  const { data } = await api.post('/api/register', {
    name,
    email,
    password,
    password_confirmation: passwordConfirmation,
  })

  const token = data?.token
  if (typeof token === 'string' && token.trim()) {
    setAuthToken(token)
  }
  return data?.user ?? null
}

export async function logout() {
  try {
    if (AUTH_MODE === 'sanctum') {
      await api.post('/logout')
    } else {
      await api.post('/api/logout')
    }
  } finally {
    clearAuthToken()
  }
}

export async function getMe() {
  const { data } = await api.get('/api/user')
  return data
}
