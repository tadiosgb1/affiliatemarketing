import axios from 'axios'
import { logout } from '../stores'

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace(/\/+$/, ''),
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const stored = localStorage.getItem('token')
  const token = stored ? stored.replace(/^Bearer\s+/i, '').trim() : ''
  if (token) config.headers.Authorization = `Bearer ${token}`
  else if (config.headers?.Authorization) delete config.headers.Authorization
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    const url = String(error.config?.url || '')
    const isAuthSubmission = /\/auth\/(login|register)(?:\?|$)/i.test(url)
    if (error.response?.status === 401 && !isAuthSubmission) {
      logout()
      // Avoid leaving the admin shell mounted with a cleared user and stale route.
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.assign('/login?session=expired')
      }
    }
    return Promise.reject(error)
  },
)

export default api
