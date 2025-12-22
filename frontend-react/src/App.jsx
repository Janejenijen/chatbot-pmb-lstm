import { Routes, Route } from 'react-router-dom'
import ChatPage from './pages/ChatPage'
import AdminLayout from './layouts/AdminLayout'
import IntentPage from './pages/IntentPage'
import IntentDetailPage from './pages/IntentDetailPage'
import HistoryPage from './pages/HistoryPage'
import TrainingHistoryPage from './pages/TrainingHistoryPage'
import TrainingDetailPage from './pages/TrainingDetailPage'
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
        <Route path="intents/:id" element={<IntentDetailPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="training" element={<TrainingHistoryPage />} />
        <Route path="training/:id" element={<TrainingDetailPage />} />
      </Route>
    </Routes>
  )
}

export default App

