import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiX, FiShoppingCart, FiStar, FiPackage, FiCheck, FiAlertCircle, FiBarChart2 } from 'react-icons/fi';
import { useCompare } from '../context/compareContext';
import { useCart } from '../context/cartContext';
import { formatPrice } from '../utils/helpers';
import { constructImageUrl } from '../utils/imageUtils';

const ComparePage = () => {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // If no items to compare, show empty state
  if (compareItems.length === 0) {
    return (
      <div className="container" style={{ padding: '2rem 0', minHeight: '60vh' }}>
        <div className="card" style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
          border: 'none',
          boxShadow: '0 8px 20px rgba(99, 102, 241, 0.2)'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            margin: '0 auto 2rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
          }}>
            <FiBarChart2 size={48} color="white" />
          </div>
          <h2 style={{
            marginBottom: '1rem',
            color: '#1f2937',
            fontSize: '2rem',
            fontWeight: '700'
          }}>
            No Products to Compare
          </h2>
          <p style={{
            marginBottom: '2rem',
            color: '#6b7280',
            fontSize: '1.125rem'
          }}>
            Start adding products to comparison from the product listing page.
          </p>
          <Link
            to="/products"
            className="btn btn-primary btn-lg"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '12px',
              fontWeight: '600',
              boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }



  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FiStar key={i} fill="currentColor" />);
    }

    if (hasHalfStar) {
      stars.push(<FiStar key="half" fill="currentColor" opacity="0.5" />);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FiStar key={`empty-${i}`} fill="none" />);
    }

    return stars;
  };

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        color: 'white',
        boxShadow: '0 10px 25px rgba(102, 126, 234, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <Link
              to="/products"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'white',
                textDecoration: 'none',
                marginBottom: '0.5rem',
                opacity: 0.9,
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0.9}
            >
              <FiArrowLeft /> Back to Products
            </Link>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '700', color: 'white' }}>
              Compare Products
            </h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '1rem' }}>
              Comparing {compareItems.length} {compareItems.length === 1 ? 'product' : 'products'}
            </p>
          </div>
          <button
            onClick={clearCompare}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '10px',
              fontWeight: '600',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <FiX />
            Clear All
          </button>
        </div>
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          zIndex: 0
        }}></div>
      </div>

      {/* Comparison Table */}
      <div className="compare-table-container">
        <div className="compare-table">
          {/* Product Images Row */}
          <div className="compare-row compare-row-images">
            <div className="compare-cell compare-cell-label">
              <strong>Product</strong>
            </div>
            {compareItems.map((product) => (
              <div key={product._id} className="compare-cell compare-cell-product">
                <button
                  className="compare-remove-btn"
                  onClick={() => removeFromCompare(product._id)}
                  aria-label="Remove from comparison"
                >
                  <FiX size={18} />
                </button>
                <div className="compare-product-image">
                  <img
                    src={constructImageUrl(product.image) || '/assets/no-image-placeholder.svg'}
                    alt={product.name}
                    onError={(e) => {
                      e.target.src = '/assets/no-image-placeholder.svg';
                    }}
                    onLoad={(e) => {
                      e.target.style.opacity = 1;
                    }}
                    style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
                  />
                </div>
                <h3 className="compare-product-name">{product.name}</h3>
              </div>
            ))}
          </div>

          {/* Price Row */}
          <div className="compare-row">
            <div className="compare-cell compare-cell-label">
              <strong>Price</strong>
            </div>
            {compareItems.map((product) => (
              <div key={product._id} className="compare-cell">
                <span className="compare-price">{formatPrice(product.price)}</span>
              </div>
            ))}
          </div>

          {/* Rating Row */}
          <div className="compare-row">
            <div className="compare-cell compare-cell-label">
              <strong>Rating</strong>
            </div>
            {compareItems.map((product) => (
              <div key={product._id} className="compare-cell">
                <div className="compare-rating">
                  <div className="stars">
                    {renderStars(product.rating)}
                  </div>
                  <span className="rating-value">
                    {product.rating ? product.rating.toFixed(1) : 'N/A'} ({product.numreviews || 0})
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Stock Row */}
          <div className="compare-row">
            <div className="compare-cell compare-cell-label">
              <strong>Availability</strong>
            </div>
            {compareItems.map((product) => (
              <div key={product._id} className="compare-cell">
                <span className={`compare-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                  {product.stock > 0 ? (
                    <>
                      <FiCheck size={16} />
                      In Stock ({product.stock})
                    </>
                  ) : (
                    <>
                      <FiAlertCircle size={16} />
                      Out of Stock
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Category Row */}
          <div className="compare-row">
            <div className="compare-cell compare-cell-label">
              <strong>Category</strong>
            </div>
            {compareItems.map((product) => (
              <div key={product._id} className="compare-cell">
                <span className="compare-category">{product.category || 'N/A'}</span>
              </div>
            ))}
          </div>

          {/* Description Row */}
          <div className="compare-row">
            <div className="compare-cell compare-cell-label">
              <strong>Description</strong>
            </div>
            {compareItems.map((product) => (
              <div key={product._id} className="compare-cell">
                <p className="compare-description">{product.description || 'No description available'}</p>
              </div>
            ))}
          </div>

          {/* Actions Row */}
          <div className="compare-row compare-row-actions">
            <div className="compare-cell compare-cell-label">
              <strong>Actions</strong>
            </div>
            {compareItems.map((product) => (
              <div key={product._id} className="compare-cell">
                <div className="compare-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    style={{
                      background: product.stock === 0 ? '#e5e7eb' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      color: product.stock === 0 ? '#9ca3af' : 'white',
                      padding: '0.625rem 1.25rem',
                      borderRadius: '8px',
                      fontWeight: '600',
                      boxShadow: product.stock === 0 ? 'none' : '0 4px 6px rgba(102, 126, 234, 0.2)',
                      transition: 'all 0.3s ease',
                      cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      marginBottom: '0.5rem'
                    }}
                    onMouseEnter={(e) => {
                      if (product.stock > 0) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 12px rgba(102, 126, 234, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (product.stock > 0) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(102, 126, 234, 0.2)';
                      }
                    }}
                  >
                    <FiShoppingCart size={16} />
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  <Link
                    to={`/product/${product._id}`}
                    className="btn btn-secondary btn-sm"
                    style={{
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      border: 'none',
                      color: 'white',
                      padding: '0.625rem 1.25rem',
                      borderRadius: '8px',
                      fontWeight: '600',
                      boxShadow: '0 4px 6px rgba(79, 172, 254, 0.2)',
                      transition: 'all 0.3s ease',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 12px rgba(79, 172, 254, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(79, 172, 254, 0.2)';
                    }}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Warning */}
      <div className="compare-mobile-warning">
        <FiAlertCircle size={20} />
        <p>For best experience, view comparison on a larger screen or rotate your device to landscape mode.</p>
      </div>
    </div>
  );
};

export default ComparePage;
