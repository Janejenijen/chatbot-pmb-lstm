import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ChatPage from './pages/ChatPage'
import AdminLayout from './layouts/AdminLayout'
import IntentPage from './pages/IntentPage'
import IntentDetailPage from './pages/IntentDetailPage'
import HistoryPage from './pages/HistoryPage'
import TrainingHistoryPage from './pages/TrainingHistoryPage'
import TrainingDetailPage from './pages/TrainingDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import UserManagementPage from './pages/UserManagementPage'
import './index.css'

// Protected Route component for admin pages
function ProtectedAdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()
  
  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (!isAdmin()) {
    return <Navigate to="/" replace />
  }
  
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<ChatPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Admin Routes (Protected) */}
      <Route path="/admin" element={
        <ProtectedAdminRoute>
          <AdminLayout />
        </ProtectedAdminRoute>
      }>
        <Route index element={
          <div className="card" style={{padding: '24px'}}>
            <h2>Selamat Datang di Admin Dashboard</h2>
            <p>Pilih menu disebelah kiri untuk mengelola data.</p>
          </div>
        } />
        <Route path="intents" element={<IntentPage />} />
        <Route path="intents/:id" element={<IntentDetailPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="training" element={<TrainingHistoryPage />} />
        <Route path="training/:id" element={<TrainingDetailPage />} />
        <Route path="users" element={<UserManagementPage />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
