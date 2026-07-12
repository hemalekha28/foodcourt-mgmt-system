import React, { useState, useEffect } from 'react';
import { FiEye, FiFilter, FiRefreshCw, FiPackage, FiTruck, FiCheckCircle, FiXCircle, FiAlertCircle, FiDollarSign, FiShoppingCart } from 'react-icons/fi';
import { api } from '../utils/api';
import { formatPrice, formatDate, getStatusColor } from '../utils/helpers';
import { constructImageUrl } from '../utils/imageUtils';
import '../styles/admin.css';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  const STATUS_OPTIONS = ['Preparing', 'Ready', 'OutForDelivery', 'Delivered', 'Cancelled'];

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      const data = await api.getOrders();

      const filteredData = statusFilter !== 'all'
        ? data.filter(o => o.orderStatus === statusFilter)
        : data;

      setOrders(filteredData);
    } catch (error) {
      console.error('Error loading orders:', error);
      setError(error.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (window.confirm(`Update order status to "${newStatus}"?`)) {
      try {
        setError(null);
        
        // Optimistic UI update - immediately update the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { ...order, orderStatus: newStatus }
              : order
          )
        );
        
        // Update stats optimistically
        const updatedStats = { ...stats };
        const orderToUpdate = orders.find(o => o._id === orderId);
        if (orderToUpdate) {
          // Decrease count of old status
          const oldStatusKey = orderToUpdate.orderStatus.toLowerCase();
          if (updatedStats.hasOwnProperty(oldStatusKey)) {
            updatedStats[oldStatusKey]--;
          }
          
          // Increase count of new status
          const newStatusKey = newStatus.toLowerCase();
          if (updatedStats.hasOwnProperty(newStatusKey)) {
            updatedStats[newStatusKey]++;
          }
        }
        
        // Make API call
        await api.updateOrderStatus(orderId, { orderStatus: newStatus });
        
        // Refresh data to ensure consistency
        await loadOrders(true);
      } catch (error) {
        console.error('Error updating status:', error);
        setError(error.message || 'Update failed.');
        // Revert the optimistic update on error
        await loadOrders(true);
      }
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleRefresh = () => loadOrders(true);

  // Calculate stats from current orders state
  const stats = {
    preparing: orders.filter(o => o.orderStatus === 'Preparing').length,
    ready: orders.filter(o => o.orderStatus === 'Ready').length,
    outForDelivery: orders.filter(o => o.orderStatus === 'OutForDelivery').length,
    delivered: orders.filter(o => o.orderStatus === 'Delivered').length,
    cancelled: orders.filter(o => o.orderStatus === 'Cancelled').length,
    totalRevenue: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    totalOrders: orders.length
  };

  if (loading && !refreshing) return <div style={{ padding: '4rem', textAlign: 'center' }}><div className="spinner"></div></div>;

  return (
    <div className="admin-orders-page">
      <header className="admin-header-bar">
        <div>
          <h1>KEC Kitchen Management</h1>
          <p style={{ color: '#64748b' }}>Live order tracking and fulfillment system</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleRefresh} disabled={refreshing} className="admin-btn-primary" style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0' }}>
            <FiRefreshCw className={refreshing ? 'loading' : ''} /> <span>{refreshing ? 'Refresh Dashboard' : 'Refresh Dashboard'}</span>
          </button>
          <div style={{ position: 'relative' }}>
            <select
              className="auth-input"
              style={{ minWidth: '180px', paddingLeft: '2.5rem', background: '#fff' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Kitchen States</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <FiFilter style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>
        </div>
      </header>

      {/* Operation Stats */}
      <section className="admin-stats-container" style={{ marginBottom: '2rem' }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#fff7ed', color: '#f59e0b' }}><FiPackage /></div>
          <div className="admin-stat-info"><h3>Preparing</h3><p>{stats.preparing}</p></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><FiRefreshCw /></div>
          <div className="admin-stat-info"><h3>Ready</h3><p>{stats.ready}</p></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#f0f9ff', color: '#0ea5e9' }}><FiTruck /></div>
          <div className="admin-stat-info"><h3>Out for Delivery</h3><p>{stats.outForDelivery}</p></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#f0fdf4', color: '#22c55e' }}><FiCheckCircle /></div>
          <div className="admin-stat-info"><h3>Delivered</h3><p>{stats.delivered}</p></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#fef2f2', color: '#ef4444' }}><FiXCircle /></div>
          <div className="admin-stat-info"><h3>Cancelled</h3><p>{stats.cancelled}</p></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon icon-revenue"><FiDollarSign /></div>
          <div className="admin-stat-info"><h3>Total Revenue</h3><p>{formatPrice(stats.totalRevenue)}</p></div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}><FiShoppingCart /></div>
          <div className="admin-stat-info"><h3>Total Orders</h3><p>{stats.totalOrders}</p></div>
        </div>
      </section>

      {/* Main Registry */}
      <div className="admin-card">
        <div className="admin-card-body" style={{ padding: '0' }}>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Token #</th>
                  <th>Student/User</th>
                  <th>Ordered At</th>
                  <th>Mode</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td style={{ fontWeight: '800', color: '#0066cc', fontSize: '1.1rem' }}>{order.tokenNumber}</td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{order.user?.name || 'Guest'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{order.user?.email || 'N/A'}</div>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <span className={`admin-badge badge-${order.deliveryType === 'FoodCourt' ? 'blue' : 'orange'}`}>
                        {order.deliveryType}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600' }}>{formatPrice(order.totalAmount || 0)}</td>
                    <td>
                      <span className={`admin-badge badge-${(order.orderStatus || 'Preparing').toLowerCase()}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleViewOrder(order)} className="admin-quick-btn" style={{ padding: '0.5rem', borderRadius: '8px' }}>
                          <FiEye style={{ color: '#3b82f6' }} />
                        </button>
                        <select
                          className="auth-input"
                          style={{ minWidth: '120px', fontSize: '0.75rem', padding: '0.25rem 0.5rem', height: '32px' }}
                          value={order.orderStatus}
                          onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
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

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">
                Token: {selectedOrder.tokenNumber}
              </h3>
              <button onClick={() => setShowModal(false)} className="modal-close">
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
                <div>
                  <h4>Customer Information</h4>
                  <div style={{ marginTop: '1rem' }}>
                    <strong>Name:</strong> {selectedOrder.user?.name || 'Unknown'}<br />
                    <strong>Email:</strong> {selectedOrder.user?.email || 'No email'}<br />
                    <strong>Time:</strong> {formatDate(selectedOrder.createdAt)}<br />
                    <strong>Status:</strong> <span className={`badge`}>{selectedOrder.orderStatus}</span>
                  </div>
                </div>

                <div>
                  <h4>Dining/Delivery Details</h4>
                  <div style={{ marginTop: '1rem' }}>
                    <strong>Type:</strong> {selectedOrder.deliveryType}<br />
                    {selectedOrder.deliveryType === 'FoodCourt' ? (
                      <>
                        <strong>Table:</strong> {selectedOrder.deliveryDetails?.tableNumber || 'N/A'}<br />
                      </>
                    ) : (
                      <>
                        <strong>Block:</strong> {selectedOrder.deliveryDetails?.block}<br />
                        <strong>Room:</strong> {selectedOrder.deliveryDetails?.classroomInfo}<br />
                        <strong>Dept:</strong> {selectedOrder.deliveryDetails?.department}<br />
                      </>
                    )}
                    <strong>Payment:</strong> {selectedOrder.paymentMethod} ({selectedOrder.paymentStatus})
                  </div>
                </div>
              </div>

              <h4>Food Items</h4>
              <div style={{ marginTop: '1rem' }}>
                {(selectedOrder.items || []).map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      marginBottom: '0.5rem'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <strong>{item.foodName}</strong><br />
                      <span style={{ color: '#64748b', fontSize: '0.875rem' }}>
                        Qty: {item.quantity} × {formatPrice(item.price || 0)}
                      </span>
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                      {formatPrice((item.price || 0) * (item.quantity || 0))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: '1.5rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>Bill Amount:</span>
                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0066cc' }}>
                  {formatPrice(selectedOrder.totalAmount || 0)}
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                Close
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => handleStatusUpdate(selectedOrder._id, 'Ready')} className="admin-btn-primary" style={{ background: '#22c55e' }}>Mark Ready</button>
                <button onClick={() => handleStatusUpdate(selectedOrder._id, 'Delivered')} className="admin-btn-primary">Mark Delivered</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;