import axios from 'axios'
import { API_BASE_URL, AUTH_MODE } from '../config'
import { getAuthToken } from './tokenStorage'

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: AUTH_MODE === 'sanctum',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (AUTH_MODE === 'token') {
    const token = getAuthToken()
    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

