import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, History, Settings } from 'lucide-react'
import './AdminLayout.css'

function AdminLayout() {
  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h2>PMB Admin</h2>
          <span className="badge">v2.0</span>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/admin" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/intents" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <MessageSquare size={20} />
            <span>Dataset & Intents</span>
          </NavLink>
          <NavLink to="/admin/history" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
            <History size={20} />
            <span>Chat History</span>
          </NavLink>
          <div className="nav-divider"></div>
          <NavLink to="/" target="_blank" className="nav-item">
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
