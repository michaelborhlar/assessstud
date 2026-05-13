import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'

// Clear expired tokens on app load
const token = localStorage.getItem('token')
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  } catch {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
}

// Wake up backend
fetch(`${import.meta.env.VITE_API_URL}/classes/`).catch(() => {})

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
  </AuthProvider>
)
