import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import { useCart } from '../context/cartContext';
import { useWishlist } from '../context/wishlistContext';
import { useNotification } from '../context/notificationContext';
import { formatPrice } from '../utils/helpers';
import { constructImageUrl } from '../utils/imageUtils';

const Wishlist = () => {
  const { addToCart } = useCart();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { showSuccess, showInfo } = useNotification();

  // Helper function to get consistent product ID
  const getProductId = (product) => {
    return product?._id || product?.id;
  };

  const handleRemoveFromWishlist = (productId, productName) => {
    removeFromWishlist(productId);
    showInfo(`Removed "${productName}" from wishlist`);
  };

  const handleMoveToCart = (product) => {
    const productId = getProductId(product);
    addToCart(product);
    removeFromWishlist(productId);
    showSuccess(`Moved "${product.name}" to cart`);
  };

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  if (wishlist.length === 0) {
    return (
      <div className="container" style={{ padding: '2rem 0', minHeight: '60vh' }}>
        <div className="card" style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #eef6ff 0%, #f0f9ff 100%)',
          border: '1px solid #e0f2fe',
          boxShadow: '0 8px 20px rgba(0, 102, 204, 0.05)'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            margin: '0 auto 2rem',
            background: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(0, 102, 204, 0.25)'
          }}>
            <FiHeart size={48} color="white" />
          </div>
          <h2 style={{
            marginBottom: '1rem',
            color: '#1f2937',
            fontSize: '2rem',
            fontWeight: '700'
          }}>Your wishlist is empty</h2>
          <p style={{
            marginBottom: '2rem',
            color: '#6b7280',
            fontSize: '1.125rem'
          }}>
            Save items you love for later by clicking the heart icon on any product.
          </p>
          <Link
            to="/products"
            className="btn btn-primary btn-lg"
            style={{
              background: '#0066cc',
              border: 'none',
              padding: '1rem 2rem',
              borderRadius: '12px',
              fontWeight: '600',
              boxShadow: '0 8px 20px rgba(0, 102, 204, 0.2)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 102, 204, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 102, 204, 0.2)';
            }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        color: 'white',
        boxShadow: '0 10px 25px rgba(0, 102, 204, 0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}>
              <FiHeart size={28} color="white" />
            </div>
            <div>
              <h1 style={{ margin: '0 0 0.25rem 0', fontSize: '2rem', fontWeight: '700', color: 'white' }}>My Wishlist</h1>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '1rem' }}>
                {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
          </div>
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

      <div className="grid grid-3">
        {wishlist.map((product) => {
          const productId = getProductId(product);
          return (
            <div key={productId} className="card">
              <Link to={`/product/${productId}`}>
                <img
                  src={constructImageUrl(product.image)}
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.src = '/assets/no-image-placeholder.svg';
                  }}
                />
              </Link>

              <div className="card-body">
                <Link to={`/product/${productId}`} style={{ textDecoration: 'none' }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: 'var(--dark)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {product.name}
                  </h3>
                </Link>

                <div style={{ marginBottom: '0.5rem' }}>
                  <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                    {product.category}
                  </span>
                </div>

                <div style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: 'var(--primary)',
                  marginBottom: '1rem'
                }}>
                  {formatPrice(product.price)}
                </div>

                {product.rating && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', color: '#f59e0b' }}>
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          style={{
                            color: i < Math.floor(product.rating) ? '#f59e0b' : '#e5e7eb'
                          }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                      {product.rating} ({product.numreviews || 0} reviews)
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleMoveToCart(product)}
                    className="btn btn-primary btn-full"
                    disabled={!product.stock}
                    style={{
                      background: product.stock ? '#0066cc' : '#e5e7eb',
                      border: 'none',
                      color: product.stock ? 'white' : '#9ca3af',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      fontWeight: '600',
                      boxShadow: product.stock ? '0 4px 6px rgba(0, 102, 204, 0.15)' : 'none',
                      transition: 'all 0.3s ease',
                      cursor: product.stock ? 'pointer' : 'not-allowed'
                    }}
                    onMouseEnter={(e) => {
                      if (product.stock) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 102, 204, 0.25)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (product.stock) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 102, 204, 0.15)';
                      }
                    }}
                  >
                    <FiShoppingCart />
                    {product.stock ? 'Move to Cart' : 'Out of Stock'}
                  </button>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="btn btn-secondary"
                      disabled={!product.stock}
                      style={{
                        flex: 1,
                        background: product.stock ? '#ffffff' : '#e5e7eb',
                        border: product.stock ? '2px solid #0066cc' : 'none',
                        color: product.stock ? '#0066cc' : '#9ca3af',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        fontWeight: '600',
                        boxShadow: product.stock ? '0 4px 6px rgba(0, 102, 204, 0.1)' : 'none',
                        transition: 'all 0.3s ease',
                        cursor: product.stock ? 'pointer' : 'not-allowed'
                      }}
                      onMouseEnter={(e) => {
                        if (product.stock) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.background = '#f0f9ff';
                          e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 102, 204, 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (product.stock) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 102, 204, 0.1)';
                        }
                      }}
                    >
                      Add to Cart
                    </button>

                    <button
                      onClick={() => handleRemoveFromWishlist(productId, product.name)}
                      className="btn btn-danger"
                      title="Remove from wishlist"
                      style={{
                        minWidth: '44px',
                        background: '#fee2e2',
                        border: 'none',
                        color: '#ef4444',
                        padding: '0.75rem',
                        borderRadius: '10px',
                        fontWeight: '600',
                        boxShadow: '0 4px 6px rgba(239, 68, 68, 0.1)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fecaca';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 12px rgba(239, 68, 68, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fee2e2';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(239, 68, 68, 0.1)';
                      }}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center" style={{ marginTop: '3rem' }}>
        <Link
          to="/products"
          className="btn btn-primary"
          style={{
            background: '#0066cc',
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '12px',
            fontWeight: '600',
            boxShadow: '0 8px 20px rgba(0, 102, 204, 0.2)',
            transition: 'all 0.3s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 102, 204, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 102, 204, 0.2)';
          }}
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default Wishlist;