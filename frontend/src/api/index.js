import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Public api — no token attached
export const publicApi = axios.create({
  baseURL: BASE,
})

// Private api — token attached
const api = axios.create({
  baseURL: BASE,
})

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export default api
