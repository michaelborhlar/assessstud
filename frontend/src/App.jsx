import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import StudentRegister  from './pages/student/Register'
import StudentLogin     from './pages/student/Login'
import StudentDashboard from './pages/student/Dashboard'
import TakeAssessment   from './pages/student/TakeAssessment'
import LearnPage        from './pages/student/LearnPage'
import AdminLogin       from './pages/admin/Login'
import AdminRegister    from './pages/admin/Register'
import AdminDashboard   from './pages/admin/Dashboard'
import CreateAssessment from './pages/admin/CreateAssessment'
import AddQuestion      from './pages/admin/AddQuestion'
import Submissions      from './pages/admin/Submissions'
import UploadContent    from './pages/admin/UploadContent'
import ManageUsers      from './pages/admin/ManageUsers'
import { useAuth }      from './context/AuthContext'
import BulkUploadQuestions from './pages/admin/BulkUploadQuestions'
import Visitors from './pages/admin/Visitors'


function PrivateRoute({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} />
  if (user.role !== role) return <Navigate to="/" />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Student */}
        <Route path="/"               element={<Navigate to="/login" />} />
        <Route path="/register"       element={<StudentRegister />} />
        <Route path="/login"          element={<StudentLogin />} />
        <Route path="/dashboard"      element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />
        <Route path="/assessment/:id" element={<PrivateRoute role="student"><TakeAssessment /></PrivateRoute>} />
        <Route path="/learn"          element={<PrivateRoute role="student"><LearnPage /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin"               element={<Navigate to="/admin/login" />} />
        <Route path="/admin/register"      element={<AdminRegister />} />
        <Route path="/admin/login"         element={<AdminLogin />} />
        <Route path="/admin/dashboard"     element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
        <Route path="/admin/create"        element={<PrivateRoute role="admin"><CreateAssessment /></PrivateRoute>} />
        <Route path="/admin/questions"     element={<PrivateRoute role="admin"><AddQuestion /></PrivateRoute>} />
        <Route path="/admin/bulk-upload" element={<PrivateRoute role="admin"><BulkUploadQuestions /></PrivateRoute>} />
        <Route path="/admin/submissions/:id" element={<PrivateRoute role="admin"><Submissions /></PrivateRoute>} />
        <Route path="/admin/content"       element={<PrivateRoute role="admin"><UploadContent /></PrivateRoute>} />
        <Route path="/admin/users"         element={<PrivateRoute role="admin"><ManageUsers /></PrivateRoute>} />
        <Route path="/admin/visitors" element={<PrivateRoute role="admin"><Visitors /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}
