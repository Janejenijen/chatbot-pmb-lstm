import { Routes, Route } from 'react-router-dom'
import ChatPage from './pages/ChatPage'
import AdminLayout from './layouts/AdminLayout'
import IntentPage from './pages/IntentPage'
import HistoryPage from './pages/HistoryPage'
import './index.css'

function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<ChatPage />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<div className="card" style={{padding: '24px'}}><h2>Selamat Datang di Admin Dashboard</h2><p>Pilih menu disebelah kiri untuk mengelola data.</p></div>} />
        <Route path="intents" element={<IntentPage />} />
        <Route path="history" element={<HistoryPage />} />
      </Route>
    </Routes>
  )
}

export default App
