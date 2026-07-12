import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { api } from '../utils/api';
import { formatPrice } from '../utils/helpers';
import { constructImageUrl } from '../utils/imageUtils';
import '../styles/admin.css';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    image: '',
    stock: '99',
    isVeg: true
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 5000);
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading menu:', error);
      showNotification('error', 'Failed to load menu items.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const validateForm = () => {
    const { name, price, category, description, image, stock } = formData;
    if (!name.trim()) return 'Dish name is required';
    if (!price || parseFloat(price) < 0) return 'Valid price is required';
    if (!category) return 'Category is required';
    if (!description.trim()) return 'Description is required';
    if (!image.trim()) return 'Image URL is required';
    if (!stock || parseInt(stock) < 0) return 'Valid portion count is required';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      showNotification('error', validationError);
      return;
    }
    setSubmitting(true);
    try {
      const dishData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        isVeg: formData.isVeg
      };

      console.log('🚀 Sending Dish Data to Backend:', dishData);

      if (editingProduct) {
        await api.updateProduct(editingProduct._id || editingProduct.id, dishData);
        showNotification('success', 'Menu item updated successfully!');
      } else {
        await api.addProduct(dishData);
        showNotification('success', 'New dish added to menu!');
      }

      await loadProducts();
      resetForm();
    } catch (error) {
      console.error('Error saving dish:', error);
      const backendMessage = error.response?.data?.message;
      const validationErrors = error.response?.data?.errors;

      let errorDisplay = backendMessage || error.message || 'Failed to save menu item.';

      if (validationErrors && validationErrors.length > 0) {
        errorDisplay = `Validation Error: ${validationErrors.map(e => e.msg).join(', ')}`;
      }

      showNotification('error', errorDisplay);

      // Temporary alert for definitive debugging
      if (error.response?.status === 400) {
        alert(`Server Error 400 Details:\n\n${JSON.stringify(error.response.data, null, 2)}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      description: product.description,
      image: product.image,
      stock: product.stock.toString(),
      isVeg: product.isVeg ?? true
    });
    setShowModal(true);
  };

  const handleDelete = async (productId, productName) => {
    if (window.confirm(`Remove "${productName}" from the menu?`)) {
      try {
        await api.deleteProduct(productId);
        await loadProducts();
        showNotification('success', 'Item removed from menu.');
      } catch (error) {
        console.error('Error deleting item:', error);
        showNotification('error', 'Failed to delete.');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', category: '', description: '', image: '', stock: '99', isVeg: true });
    setEditingProduct(null);
    setShowModal(false);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['breakfast', 'lunch', 'snacks', 'juices', 'north-indian', 'south-indian', 'beverages', 'desserts'];

  return (
    <div className="admin-products-page">
      {notification.show && (
        <div className={`admin-notification ${notification.type}`} style={{
          position: 'fixed', top: '2rem', right: '2rem', zIndex: 9999,
          padding: '1rem 1.5rem', borderRadius: '12px', background: notification.type === 'success' ? '#10b981' : '#f43f5e',
          color: 'white', fontWeight: '600', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '0.75rem'
        }}>
          {notification.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
          {notification.message}
        </div>
      )}

      <header className="admin-header-bar">
        <div>
          <h1>KEC Menu Management</h1>
          <p style={{ color: '#64748b' }}>Update dishes, prices, and daily availability</p>
        </div>
        <button onClick={() => setShowModal(true)} className="admin-btn-primary">
          <FiPlus /> <span>Add New Dish</span>
        </button>
      </header>

      <div className="admin-card" style={{ marginBottom: '2rem' }}>
        <div className="admin-card-body" style={{ padding: '1.25rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '400px' }}>
              <input
                type="text"
                placeholder="Search dishes by name or category..."
                className="auth-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '3rem', background: '#f8fafc' }}
              />
              <FiSearch style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '1.1rem' }} />
            </div>
            <div style={{ fontWeight: '600', color: '#64748b', fontSize: '0.9rem' }}>
              {filteredProducts.length} dishes in current view
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-body" style={{ padding: '0' }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}><div className="spinner"></div></div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Dish / Item Name</th>
                    <th>Diet</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Daily Units</th>
                    <th>Availability</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product._id || product.id}>
                      <td style={{ minWidth: '250px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                          <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                            <img
                              src={constructImageUrl(product.image)}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'; }}
                            />
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#1e293b' }}>{product.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.125rem' }}>ID: {String(product._id || product.id).toUpperCase().slice(-6)}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          border: `2px solid ${product.isVeg ? '#10b981' : '#ef4444'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '2px'
                        }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: product.isVeg ? '#10b981' : '#ef4444' }}></div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-badge badge-blue" style={{ textTransform: 'capitalize' }}>{product.category}</span>
                      </td>
                      <td style={{ fontWeight: '700', color: '#0f172a' }}>
                        {formatPrice(product.price)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: '600' }}>{product.stock} servings</span>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-badge badge-${(product.stock ?? 0) > 0 ? 'green' : 'red'}`}>
                          {(product.stock ?? 0) > 0 ? 'In Stock' : 'Sold Out'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleEdit(product)} className="admin-quick-btn" style={{ padding: '0.5rem', borderRadius: '8px' }}>
                            <FiEdit style={{ color: '#0066cc' }} />
                          </button>
                          <button onClick={() => handleDelete(product._id || product.id, product.name)} className="admin-quick-btn" style={{ padding: '0.5rem', borderRadius: '8px' }}>
                            <FiTrash2 style={{ color: '#ef4444' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingProduct ? 'Edit Dish Details' : 'Add New Dish to Menu'}
              </h3>
              <button onClick={resetForm} className="modal-close">×</button>
            </div>

            <div className="modal-body">
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Dish Name *</label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column' }}>
                  <label className="form-label">Classification</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem 0' }}>
                    <input
                      type="checkbox"
                      name="isVeg"
                      checked={formData.isVeg}
                      onChange={handleInputChange}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ fontWeight: '600', color: formData.isVeg ? '#059669' : '#b91c1c' }}>
                      {formData.isVeg ? 'Pure Vegetarian 🍏' : 'Contains Non-Veg 🍗'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    className="form-input"
                    step="1"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Daily Servings/Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    className="form-input"
                    min="0"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Menu Category *</label>
                <select
                  name="category"
                  className="form-select"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">High-Quality Dish Image URL *</label>
                <input
                  type="url"
                  name="image"
                  className="form-input"
                  placeholder="Paste URL from Unsplash or Google"
                  value={formData.image}
                  onChange={handleInputChange}
                  required
                />
                {formData.image && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <img
                      src={formData.image}
                      alt="Preview"
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '12px'
                      }}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Dish Description (Taste profile, Ingredients) *</label>
                <textarea
                  name="description"
                  className="form-textarea"
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Discard
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn btn-primary"
              >
                {submitting
                  ? (editingProduct ? 'Updating Menu...' : 'Cooking...')
                  : (editingProduct ? 'Update Dish' : 'Publish to Menu')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;