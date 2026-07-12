import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUser, FiShoppingCart, FiHeart, FiPackage,
  FiEdit, FiEye, FiMessageSquare, FiStar, FiLogOut, FiSettings,
  FiDollarSign, FiClock, FiCheckCircle, FiTruck, FiAward, FiXCircle
} from 'react-icons/fi';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';
import { useAuth } from '../context/authContext';
import { useCart } from '../context/cartContext';
import { useWishlist } from '../context/wishlistContext';
import { api } from "../utils/api";
import { formatPrice, formatDate, getStatusColor } from '../utils/helpers';
import Chatbot from '../components/Chatbot';
import Image from '../components/Image';
import { constructImageUrl } from '../utils/imageUtils';
import '../styles/dashboard.css';

const MIN_REVIEW_LENGTH = 20;

const UserDashboard = () => {
  const { user, updateProfile, logout } = useAuth();
  const { getCartItemsCount } = useCart();
  const { wishlist } = useWishlist();

  const [activeTab, setActiveTab] = useState('overview'); // overview, profile, orders, reviews
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [reviewableProducts, setReviewableProducts] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [reviewModal, setReviewModal] = useState(null);

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    isSubmitting: false
  });

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      const [ordersData, profileDataResponse, reviewableData, reviewsData] = await Promise.all([
        api.getUserOrders().catch(() => []),
        api.getProfile().catch(() => ({})),
        api.getReviewableProducts().catch(() => []),
        api.getUserReviews().catch(() => [])
      ]);

      setOrders(ordersData || []);
      setReviewableProducts(reviewableData || []);
      setUserReviews(reviewsData || []);

      const pSource = profileDataResponse?.data?.user || profileDataResponse?.user;
      if (pSource) {
        setProfileData(prev => ({
          ...prev,
          name: pSource.name || prev.name,
          email: pSource.email || prev.email,
          phone: pSource.phone || prev.phone,
          address: pSource.address || prev.address
        }));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateProfile(profileData);
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      alert(error.message || 'Failed to update profile');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (reviewForm.isSubmitting) return;

    const trimmedComment = reviewForm.comment.trim();
    if (trimmedComment.length < MIN_REVIEW_LENGTH) {
      alert(`Review must be at least ${MIN_REVIEW_LENGTH} characters.`);
      return;
    }

    setReviewForm(prev => ({ ...prev, isSubmitting: true }));
    try {
      if (reviewModal.isEditing) {
        await api.updateReview(reviewModal.reviewId, { rating: reviewForm.rating, comment: trimmedComment });
      } else {
        await api.createReview({
          productId: reviewModal.product._id,
          orderId: reviewModal.orderId,
          rating: reviewForm.rating,
          comment: trimmedComment
        });
      }
      setReviewModal(null);
      setReviewForm({ rating: 5, comment: '', isSubmitting: false });
      loadUserData();
      alert('Review submitted successfully!');
    } catch (error) {
      alert(error.message || 'Failed to submit review');
    } finally {
      setReviewForm(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const openReviewModal = (product, orderId) => {
    setReviewModal({ product, orderId, isEditing: false });
    setReviewForm({ rating: 5, comment: '', isSubmitting: false });
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      i < rating ? <AiFillStar key={i} color="#F59E0B" /> : <AiOutlineStar key={i} color="#cbd5e1" />
    ));
  };

  if (loading && orders.length === 0) {
    return <div className="dashboard-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="spinner"></div></div>;
  }

  return (
    <div className="dashboard-wrapper">
      <aside className="dashboard-sidebar">
        <div style={{ padding: '0 2rem 2rem' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: '#0066cc', fontWeight: '800', marginBottom: '1rem' }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>{user?.name || 'Account Settings'}</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>{user?.email}</p>
        </div>

        <nav>
          <button onClick={() => setActiveTab('overview')} className={`dash-nav-item ${activeTab === 'overview' ? 'active' : ''}`} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
            <FiPackage size={18} /> Overview
          </button>
          <button onClick={() => setActiveTab('orders')} className={`dash-nav-item ${activeTab === 'orders' ? 'active' : ''}`} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
            <FiShoppingCart size={18} /> My Orders
          </button>
          <button onClick={() => setActiveTab('reviews')} className={`dash-nav-item ${activeTab === 'reviews' ? 'active' : ''}`} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
            <FiStar size={18} /> Reviews
          </button>
          <button onClick={() => setActiveTab('profile')} className={`dash-nav-item ${activeTab === 'profile' ? 'active' : ''}`} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
            <FiSettings size={18} /> Profile Settings
          </button>
          <button onClick={logout} className="dash-nav-item" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', marginTop: 'auto', color: '#ef4444' }}>
            <FiLogOut size={18} /> Logout
          </button>
        </nav>
      </aside>

      <main className="dashboard-content">
        <header className="dash-header">
          <h1>{activeTab === 'overview' ? 'Account Overview' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          <p>Manage your account, orders, and review history from one place.</p>
        </header>

        {activeTab === 'overview' && (
          <>
            <section className="dash-stats-grid">
              <div className="dash-stat-card">
                <div className="dash-stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}><FiShoppingCart /></div>
                <div className="dash-stat-info"><h3>Total Orders</h3><p>{orders.length}</p></div>
              </div>
              <div className="dash-stat-card">
                <div className="dash-stat-icon" style={{ background: '#f0fdf4', color: '#22c55e' }}><FiDollarSign /></div>
                <div className="dash-stat-info">
                  <h3>Total Spent</h3>
                  <p>{formatPrice(orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0))}</p>
                  {/* Debug info - remove in production */}
                  <small style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    ({orders.length} orders)
                  </small>
                </div>
              </div>
              <div className="dash-stat-card">
                <div className="dash-stat-icon" style={{ background: '#fef2f2', color: '#ef4444' }}><FiHeart /></div>
                <div className="dash-stat-info"><h3>Wishlist</h3><p>{wishlist.length}</p></div>
              </div>
              <div className="dash-stat-card">
                <div className="dash-stat-icon" style={{ background: '#f0fdf4', color: '#22c55e' }}><FiMessageSquare /></div>
                <div className="dash-stat-info"><h3>Pending Reviews</h3><p>{reviewableProducts.length}</p></div>
              </div>
            </section>
            
            {/* Order Status Summary */}
            <section className="dash-stats-grid" style={{ marginTop: '1rem', gridTemplateColumns: 'repeat(5, 1fr)' }}>
              <div className="dash-stat-card" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                <div className="dash-stat-icon" style={{ background: '#f59e0b', color: 'white' }}><FiClock /></div>
                <div className="dash-stat-info">
                  <h3 style={{ fontSize: '0.875rem' }}>Preparing</h3>
                  <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>{orders.filter(o => o.orderStatus === 'Preparing').length}</p>
                </div>
              </div>
              <div className="dash-stat-card" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                <div className="dash-stat-icon" style={{ background: '#3b82f6', color: 'white' }}><FiCheckCircle /></div>
                <div className="dash-stat-info">
                  <h3 style={{ fontSize: '0.875rem' }}>Ready</h3>
                  <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>{orders.filter(o => o.orderStatus === 'Ready').length}</p>
                </div>
              </div>
              <div className="dash-stat-card" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                <div className="dash-stat-icon" style={{ background: '#0ea5e9', color: 'white' }}><FiTruck /></div>
                <div className="dash-stat-info">
                  <h3 style={{ fontSize: '0.875rem' }}>Delivery</h3>
                  <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>{orders.filter(o => o.orderStatus === 'OutForDelivery').length}</p>
                </div>
              </div>
              <div className="dash-stat-card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div className="dash-stat-icon" style={{ background: '#22c55e', color: 'white' }}><FiAward /></div>
                <div className="dash-stat-info">
                  <h3 style={{ fontSize: '0.875rem' }}>Delivered</h3>
                  <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>{orders.filter(o => o.orderStatus === 'Delivered').length}</p>
                </div>
              </div>
              <div className="dash-stat-card" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <div className="dash-stat-icon" style={{ background: '#ef4444', color: 'white' }}><FiXCircle /></div>
                <div className="dash-stat-info">
                  <h3 style={{ fontSize: '0.875rem' }}>Cancelled</h3>
                  <p style={{ fontSize: '1.25rem', fontWeight: '700' }}>{orders.filter(o => o.orderStatus === 'Cancelled').length}</p>
                </div>
              </div>
            </section>

            <div className="dash-main-grid">
              <div className="dash-card">
                <div className="dash-card-header">
                  <h2>Recent Orders</h2>
                  <button onClick={() => setActiveTab('orders')} className="dash-btn dash-btn-outline" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>View All</button>
                </div>
                <div className="dash-card-body" style={{ padding: 0 }}>
                  <div className="dash-table-container">
                    <table className="dash-table">
                      <thead>
                        <tr><th>ID</th><th>Date</th><th>Amount</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map(o => (
                          <tr key={o._id}>
                            <td style={{ fontWeight: 600 }}>#{o.tokenNumber || String(o._id).slice(-6).toUpperCase()}</td>
                            <td>{formatDate(o.createdAt)}</td>
                            <td style={{ fontWeight: 700 }}>{formatPrice(o.totalAmount)}</td>
                            <td><span className={`dash-badge badge-${(o.orderStatus || 'Preparing').toLowerCase()}`}>{o.orderStatus || 'Preparing'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                      {/* Debug: Show raw order data */}
                      {process.env.NODE_ENV === 'development' && (
                        <tfoot>
                          <tr>
                            <td colSpan="4" style={{ fontSize: '0.7rem', color: '#64748b', padding: '1rem' }}>
                              Debug: First order totalAmount = {orders[0]?.totalAmount || 'N/A'}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </div>
              <div className="dash-card">
                <div className="dash-card-header"><h2>Profile</h2></div>
                <div className="dash-card-body">
                  <p style={{ margin: 0, fontWeight: 700 }}>{user?.name}</p>
                  <p style={{ margin: '4px 0 20px', fontSize: '0.85rem', color: '#64748b' }}>{user?.email}</p>
                  <button onClick={() => setActiveTab('profile')} className="dash-btn dash-btn-primary" style={{ width: '100%' }}>Edit Profile</button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'orders' && (
          <div className="dash-card">
            <div className="dash-table-container">
              <table className="dash-table">
                <thead>
                  <tr><th>Order Ref</th><th>Date</th><th>Purchased Items</th><th>Total</th><th>Status</th><th>View</th></tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o._id}>
                      <td style={{ fontWeight: 700, color: '#0066cc' }}>#{o.tokenNumber || String(o._id).slice(-8).toUpperCase()}</td>
                      <td>{formatDate(o.createdAt)}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                          {(o.items || []).map(item => item.foodName).slice(0, 2).join(', ')}
                          {(o.items || []).length > 2 ? ' ...' : ''}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{(o.items || []).length} dish(es) total</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatPrice(o.totalAmount)}</td>
                      <td><span className={`dash-badge badge-${(o.orderStatus || 'Preparing').toLowerCase()}`}>{o.orderStatus || 'Preparing'}</span></td>
                      <td><button className="dash-btn dash-btn-outline" style={{ padding: '6px' }} title="View Order Details"><FiEye /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="dash-main-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="dash-card">
              <div className="dash-card-header"><h2>Pending Reviews</h2></div>
              <div className="dash-card-body">
                {reviewableProducts.length === 0 ? <p>No products to review yet!</p> :
                  reviewableProducts.map(item => (
                    <div key={item.product._id} className="dash-list-item">
                      <div className="dash-item-img"><img src={constructImageUrl(item.product.image)} alt="" style={{ maxWidth: '100%' }} /></div>
                      <div className="dash-item-content">
                        <h4 className="dash-item-title">{item.product.name}</h4>
                        <button onClick={() => openReviewModal(item.product, item.orderId)} className="dash-btn dash-btn-primary" style={{ padding: '4px 12px', fontSize: '0.75rem', marginTop: '8px' }}>Rate Product</button>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
            <div className="dash-card">
              <div className="dash-card-header"><h2>Your Feedback</h2></div>
              <div className="dash-card-body">
                {userReviews.map(r => (
                  <div key={r._id} style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>{renderStars(r.rating)}</div>
                    <p style={{ margin: 0, fontWeight: 600 }}>{r.product?.name}</p>
                    <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#475569' }}>{r.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="dash-card" style={{ maxWidth: '600px' }}>
            <div className="dash-card-body">
              <form onSubmit={handleProfileUpdate}>
                <div className="dash-form-group">
                  <label className="dash-label">Full Name</label>
                  <input type="text" name="name" className="dash-input" value={profileData.name} onChange={handleInputChange} />
                </div>
                <div className="dash-form-group">
                  <label className="dash-label">Email Address</label>
                  <input type="email" name="email" className="dash-input" value={profileData.email} disabled />
                </div>
                <div className="dash-form-group">
                  <label className="dash-label">Phone Number</label>
                  <input type="tel" name="phone" className="dash-input" value={profileData.phone} onChange={handleInputChange} />
                </div>
                <div className="dash-form-group">
                  <label className="dash-label">Shipping Address</label>
                  <textarea name="address" className="dash-input" rows="3" value={profileData.address} onChange={handleInputChange}></textarea>
                </div>
                <button type="submit" className="dash-btn dash-btn-primary">Update Profile Information</button>
              </form>
            </div>
          </div>
        )}
      </main>

      {reviewModal && (
        <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="dash-card" style={{ width: '100%', maxWidth: '450px' }}>
            <div className="dash-card-header">
              <h2>Rate Product</h2>
              <button onClick={() => setReviewModal(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <div className="dash-card-body">
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <img src={constructImageUrl(reviewModal.product.image)} width="60" height="60" style={{ borderRadius: '8px', objectFit: 'cover' }} />
                <h4 style={{ margin: 0, fontSize: '1rem' }}>{reviewModal.product.name}</h4>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setReviewForm(p => ({ ...p, rating: s }))} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    {s <= reviewForm.rating ? <FiStar size={24} fill="#F59E0B" color="#F59E0B" /> : <FiStar size={24} color="#cbd5e1" />}
                  </button>
                ))}
              </div>
              <textarea className="dash-input" rows="4" placeholder="Share your experience..." value={reviewForm.comment} onChange={(e) => setReviewForm(p => ({ ...p, comment: e.target.value }))}></textarea>
              <button onClick={handleReviewSubmit} className="dash-btn dash-btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={reviewForm.isSubmitting}>
                {reviewForm.isSubmitting ? 'Syncing...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Chatbot />
    </div>
  );
};

export default UserDashboard;