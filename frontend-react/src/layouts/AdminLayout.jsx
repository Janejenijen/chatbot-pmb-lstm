import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, History, Settings, Menu, X, BarChart3, Users, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './AdminLayout.css'

function AdminLayout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Redirect non-admin users
  if (user && !isAdmin()) {
    navigate('/')
    return null
  }

  return (
    <div className="admin-container">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="menu-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <h2>PMB Admin</h2>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>PMB Admin</h2>
          <span className="badge">v2.0</span>
          <button className="close-btn" onClick={closeSidebar}>
            <X size={20} />
          </button>
        </div>
        
        {/* User Info */}
        {user && (
          <div style={{ 
            padding: '12px 16px', 
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.7)'
          }}>
            <div style={{ fontWeight: '600', color: 'white' }}>{user.full_name}</div>
            <div style={{ opacity: 0.7 }}>{user.email}</div>
          </div>
        )}
        
        <nav className="sidebar-nav">
          <NavLink 
            to="/admin" 
            end 
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            onClick={closeSidebar}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink 
            to="/admin/intents" 
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            onClick={closeSidebar}
          >
            <MessageSquare size={20} />
            <span>Dataset & Intents</span>
          </NavLink>
          <NavLink 
            to="/admin/history" 
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            onClick={closeSidebar}
          >
            <History size={20} />
            <span>Chat History</span>
          </NavLink>
          <NavLink 
            to="/admin/training" 
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            onClick={closeSidebar}
          >
            <BarChart3 size={20} />
            <span>Training History</span>
          </NavLink>
          <NavLink 
            to="/admin/users" 
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            onClick={closeSidebar}
          >
            <Users size={20} />
            <span>Pengguna</span>
          </NavLink>
          <div className="nav-divider"></div>
          <NavLink 
            to="/" 
            target="_blank" 
            className="nav-item"
            onClick={closeSidebar}
          >
            <Settings size={20} />
            <span>Live Chatbot</span>
          </NavLink>
          <button 
            className="nav-item"
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              textAlign: 'left', 
              background: 'none', 
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer'
            }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
