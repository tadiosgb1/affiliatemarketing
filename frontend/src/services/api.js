import axios from 'axios'
import { logout } from '../stores'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  // Store the raw JWT, but normalize older values that may already contain "Bearer ".
  const stored = localStorage.getItem('token')
  const token = stored ? stored.replace(/^Bearer\s+/i, '').trim() : ''
  if (token) config.headers.Authorization = `Bearer ${token}`
  else if (config.headers?.Authorization) delete config.headers.Authorization
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Clear both the credential and reactive user state so the UI cannot look logged in
      // while protected API requests are unauthenticated.
      logout()
    }
    return Promise.reject(error)
  },
)

export default api
