import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, History, Settings, Menu, X } from 'lucide-react'
import './AdminLayout.css'

function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
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
