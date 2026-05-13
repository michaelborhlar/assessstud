import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'

// Wake up the backend immediately on app load
fetch(`${import.meta.env.VITE_API_URL}/classes/`)
  .catch(() => {}) // silently ignore errors — just waking it up

ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
  </AuthProvider>
)
