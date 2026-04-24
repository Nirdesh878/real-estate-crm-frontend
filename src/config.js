export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8000'
  // import.meta.env.VITE_API_BASE_URL?.trim() || 'https://blossomfarms150.com/api_public'

export const AUTH_MODE = import.meta.env.VITE_AUTH_MODE?.trim() || 'token'

export const WHATSAPP_REFRESH_TEMPLATE_NAME =
  import.meta.env.VITE_WHATSAPP_REFRESH_TEMPLATE_NAME?.trim() || 'lead_refresh'
