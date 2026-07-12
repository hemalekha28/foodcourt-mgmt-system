import React, { useState, useEffect } from 'react';
import { FiUsers, FiEye, FiEdit, FiSearch, FiAlertCircle, FiShoppingCart, FiDollarSign } from 'react-icons/fi';
import { api } from '../utils/api';
import { formatPrice, formatDate } from "../utils/helpers";
import '../styles/admin.css';

const UserManagement = () => {
  // ... existing state ...
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Fetch users and orders in parallel
      const [userData, ordersData] = await Promise.all([
        api.getUsers(),
        api.getOrders()
      ]);
      
      // Create a map to count orders per user
      const orderCounts = {};
      const totalSpent = {};
      
      // Process orders to count per user
      ordersData.forEach(order => {
        const userId = order.user?._id || order.user || order.userId;
        if (userId) {
          if (!orderCounts[userId]) {
            orderCounts[userId] = 0;
            totalSpent[userId] = 0;
          }
          orderCounts[userId] += 1;
          totalSpent[userId] += order.totalAmount || 0;
        }
      });
      
      // Transform users with order data
      const transformedUsers = userData.map(user => {
        const userId = user._id || user.id;
        return {
          id: userId,
          name: user.name || 'Unknown',
          email: user.email || 'No email',
          joinDate: user.createdAt || user.joinDate || new Date().toISOString(),
          orders: orderCounts[userId] || 0,
          totalSpent: totalSpent[userId] || 0,
          status: user.status || 'active',
          role: user.role || 'user'
        };
      });
      
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setError(error.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserStatusUpdate = async (userId, newStatus) => {
    try {
      setUpdateLoading(true);
      setError(null);
      await api.updateUser(userId, { status: newStatus });
      setUsers(prevUsers =>
        prevUsers.map(user => user.id === userId ? { ...user, status: newStatus } : user)
      );
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(prev => ({ ...prev, status: newStatus }));
      }
      alert('Updated.');
    } catch (error) {
      console.error('Error:', error);
      alert(`Failed: ${error.message}`);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    revenue: users.reduce((sum, u) => sum + (u.totalSpent || 0), 0),
    orders: users.reduce((sum, u) => sum + (u.orders || 0), 0)
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}><div className="spinner"></div></div>;

  return (
    <div className="admin-users-page">
      <header className="admin-header-bar">
        <div>
          <h1>User Administration</h1>
          <p style={{ color: '#64748b' }}>Audit and manage platform participants</p>
        </div>
        <div style={{ fontWeight: '600', color: '#0066cc', background: '#eef6ff', padding: '0.5rem 1rem', borderRadius: '10px' }}>
          Registered: {stats.total}
        </div>
      </header>

      {/* Audit Stats */}
      <section className="admin-stats-container">
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#f0fdf4', color: '#22c55e' }}><FiUsers /></div>
          <div className="admin-stat-info"><h3>Active Pulse</h3><p>{stats.active}</p></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><FiShoppingCart /></div>
          <div className="admin-stat-info"><h3>Cycle Orders</h3><p>{stats.orders}</p></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon icon-revenue"><FiDollarSign /></div>
          <div className="admin-stat-info"><h3>Lifetime Val</h3><p>{formatPrice(stats.revenue)}</p></div>
        </div>
      </section>

      {/* Finder Container */}
      <div className="admin-card" style={{ marginBottom: '2rem' }}>
        <div className="admin-card-body" style={{ padding: '1.25rem 2rem' }}>
          <div style={{ position: 'relative', width: '400px' }}>
            <input
              type="text"
              placeholder="Search by name, email or ID..."
              className="auth-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '3rem', background: '#f8fafc' }}
            />
            <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>
        </div>
      </div>

      {/* Database View */}
      <div className="admin-card">
        <div className="admin-card-body" style={{ padding: '0' }}>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Participant</th>
                  <th>Contact Registry</th>
                  <th>Permission Hub</th>
                  <th>Joined</th>
                  <th>Metrics</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#0066cc', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: '#1e293b' }}>{user.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ID: {String(user.id).slice(-6).toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#475569', fontSize: '0.85rem' }}>{user.email}</td>
                    <td>
                      <span className={`admin-badge badge-${user.role === 'admin' ? 'red' : 'blue'}`}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td>{formatDate(user.joinDate)}</td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{user.orders} orders</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formatPrice(user.totalSpent)} total</div>
                    </td>
                    <td>
                      <span className={`admin-badge badge-${user.status === 'active' ? 'green' : (user.status === 'banned' ? 'red' : 'orange')}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleViewUser(user)} className="admin-quick-btn" style={{ padding: '0.5rem', borderRadius: '8px' }}>
                          <FiEye style={{ color: '#3b82f6' }} />
                        </button>
                        <select
                          className="auth-input"
                          style={{ minWidth: '100px', fontSize: '0.75rem', padding: '0.25rem 0.5rem', height: '32px' }}
                          value={user.status}
                          onChange={(e) => handleUserStatusUpdate(user.id, e.target.value)}
                        >
                          {['active', 'inactive', 'banned'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">User Details - {selectedUser.name}</h3>
              <button onClick={() => setShowModal(false)} className="modal-close">
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="grid grid-2" style={{ gap: '2rem' }}>
                <div>
                  <h4>Personal Information</h4>
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div><strong>Name:</strong> {selectedUser.name}</div>
                    <div><strong>Email:</strong> {selectedUser.email}</div>
                    <div><strong>User ID:</strong> {selectedUser.id}</div>
                    <div><strong>Role:</strong> {selectedUser.role}</div>
                    <div>
                      <strong>Status:</strong>{' '}
                      <span className={`badge ${selectedUser.status === 'active' ? 'badge-success' : selectedUser.status === 'banned' ? 'badge-danger' : 'badge-warning'}`}>
                        {selectedUser.status}
                      </span>
                    </div>
                    <div><strong>Join Date:</strong> {formatDate(selectedUser.joinDate)}</div>
                  </div>
                </div>

                <div>
                  <h4>Activity Summary</h4>
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div><strong>Total Orders:</strong> {selectedUser.orders}</div>
                    <div><strong>Total Spent:</strong> {formatPrice(selectedUser.totalSpent)}</div>
                    <div><strong>Average Order Value:</strong> {formatPrice(selectedUser.totalSpent / Math.max(selectedUser.orders, 1))}</div>
                  </div>

                  <div style={{ marginTop: '2rem' }}>
                    <h5>Quick Stats</h5>
                    <div className="stats-grid" style={{ marginTop: '1rem', gridTemplateColumns: '1fr' }}>
                      <div className="stat-card">
                        <span className="stat-number">{selectedUser.orders}</span>
                        <span className="stat-label">Orders Placed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'var(--gray-50)', borderRadius: 'var(--border-radius)' }}>
                <h5>Account Actions</h5>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-sm btn-primary">Send Message</button>
                  <button className="btn btn-sm btn-warning">Reset Password</button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleUserStatusUpdate(selectedUser.id, selectedUser.status === 'active' ? 'banned' : 'active')}
                    disabled={updateLoading}
                  >
                    {updateLoading ? 'Updating...' : (selectedUser.status === 'active' ? 'Ban User' : 'Activate User')}
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;