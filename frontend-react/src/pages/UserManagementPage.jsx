import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { Users, Shield, User, Trash2, Plus, Mail, Lock, X } from 'lucide-react'

const API_URL = 'http://localhost:8000/api'

function UserManagementPage() {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState('users')
  const [admins, setAdmins] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Add Admin Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ full_name: '', email: '', password: '' })
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const [adminsRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/auth/users/admins`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/auth/users/regular`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])
      
      if (adminsRes.ok) setAdmins(await adminsRes.json())
      if (usersRes.ok) setUsers(await usersRes.json())
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return
    
    try {
      const res = await fetch(`${API_URL}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        fetchUsers()
      } else {
        const data = await res.json()
        alert(data.detail || 'Gagal menghapus')
      }
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  const handleAddAdmin = async (e) => {
    e.preventDefault()
    setAddError('')
    setAddLoading(true)

    try {
      const res = await fetch(`${API_URL}/auth/users/admin`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(newAdmin)
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.detail || 'Gagal menambah admin')
      }
      
      setShowAddModal(false)
      setNewAdmin({ full_name: '', email: '', password: '' })
      fetchUsers()
    } catch (err) {
      setAddError(err.message)
    } finally {
      setAddLoading(false)
    }
  }

  const renderUserTable = (userList, isAdmin = false) => (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
          <th style={{ padding: '12px 16px' }}>Nama</th>
          <th style={{ padding: '12px 16px' }}>Email</th>
          {!isAdmin && <th style={{ padding: '12px 16px' }}>WhatsApp</th>}
          <th style={{ padding: '12px 16px' }}>Terdaftar</th>
          <th style={{ padding: '12px 16px', textAlign: 'right' }}>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {userList.map((user) => (
          <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
            <td style={{ padding: '12px 16px', fontWeight: '500' }}>{user.full_name}</td>
            <td style={{ padding: '12px 16px', color: '#64748b' }}>{user.email}</td>
            {!isAdmin && <td style={{ padding: '12px 16px', color: '#64748b' }}>{user.whatsapp || '-'}</td>}
            <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '14px' }}>
              {format(new Date(user.created_at), 'dd MMM yyyy')}
            </td>
            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
              <button
                onClick={() => handleDelete(user.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <Trash2 size={18} />
              </button>
            </td>
          </tr>
        ))}
        {userList.length === 0 && (
          <tr>
            <td colSpan={isAdmin ? 4 : 5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
              Tidak ada data
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>👥 Manajemen Pengguna</h1>
          <p>Kelola akun admin dan pengguna chatbot</p>
        </div>
        {activeTab === 'admins' && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> Tambah Admin
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeTab === 'users' ? '#1e3a5f' : '#f1f5f9',
            color: activeTab === 'users' ? 'white' : '#64748b'
          }}
        >
          <User size={18} />
          Pengguna ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('admins')}
          style={{
            padding: '10px 20px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: activeTab === 'admins' ? '#1e3a5f' : '#f1f5f9',
            color: activeTab === 'admins' ? 'white' : '#64748b'
          }}
        >
          <Shield size={18} />
          Admin ({admins.length})
        </button>
      </div>

      {/* Content */}
      <div className="card">
        {activeTab === 'users' ? renderUserTable(users, false) : renderUserTable(admins, true)}
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ 
            background: 'white', 
            padding: '24px', 
            borderRadius: '12px', 
            width: '400px', 
            maxWidth: '90%' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Tambah Admin Baru</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            {addError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '10px',
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {addError}
              </div>
            )}

            <form onSubmit={handleAddAdmin}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Nama Lengkap</label>
                <input
                  type="text"
                  className="form-control"
                  value={newAdmin.full_name}
                  onChange={(e) => setNewAdmin({...newAdmin, full_name: e.target.value})}
                  required
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  required
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  required
                  minLength={6}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={addLoading}>
                  {addLoading ? 'Loading...' : 'Tambah Admin'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagementPage
