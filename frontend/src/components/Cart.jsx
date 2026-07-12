import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiClock, FiMapPin, FiPhone, FiTruck, FiGift, FiTag, FiChevronRight, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useCart } from '../context/cartContext';
import { useAuth } from '../context/authContext';
import { formatPrice } from '../utils/helpers';
import Image from '../components/Image';
import { constructImageUrl } from '../utils/imageUtils';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState('pickup');

  // Helper function to get consistent product ID
  const getProductId = (item) => {
    if (item.productId) {
      return item.productId.toString();
    }
    return (item._id || item.id)?.toString();
  };

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) return;
    const productId = getProductId(item);
    if (!productId || productId === 'undefined') {
      console.error('Invalid product ID:', productId, 'for item:', item);
      return;
    }
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = (item) => {
    const productId = getProductId(item);
    if (!productId || productId === 'undefined') {
      console.error('Invalid product ID:', productId, 'for item:', item);
      return;
    }
    removeFromCart(productId);
  };

  const handleProceedToCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  const handleApplyPromo = () => {
    if (promoCode.toUpperCase() === 'FOOD10') {
      setAppliedPromo({ code: 'FOOD10', discount: 0.1, type: 'percentage' });
    } else if (promoCode.toUpperCase() === 'WELCOME20') {
      setAppliedPromo({ code: 'WELCOME20', discount: 0.2, type: 'percentage' });
    } else {
      setAppliedPromo(null);
      alert('Invalid promo code');
    }
  };

  const subtotal = getCartTotal();
  const deliveryFee = selectedDeliveryOption === 'delivery' ? 5.99 : 0;
  const promoDiscount = appliedPromo ? subtotal * appliedPromo.discount : 0;
  const tax = (subtotal - promoDiscount) * 0.08;
  const total = subtotal - promoDiscount + deliveryFee + tax;

  // Delivery time estimation
  const estimatedTime = selectedDeliveryOption === 'pickup' ? '15-20 mins' : '30-45 mins';

  if (cartItems.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '4rem 0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Background Elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '300px',
          height: '300px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '5%',
          width: '250px',
          height: '250px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '4rem 2rem',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.98)',
            borderRadius: '32px',
            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              width: '140px',
              height: '140px',
              margin: '0 auto 2rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 40px rgba(102, 126, 234, 0.4)',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <FiShoppingBag size={64} color="white" />
            </div>
            <h2 style={{
              marginBottom: '1rem',
              color: '#1a202c',
              fontSize: '2.5rem',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>Your Cart is Empty</h2>
            <p style={{
              marginBottom: '2.5rem',
              color: '#4a5568',
              fontSize: '1.125rem',
              lineHeight: '1.75'
            }}>
              Looks like you haven't added any delicious items yet.<br />
              Start exploring our amazing food court menu!
            </p>
            <Link
              to="/products"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '1.25rem 3rem',
                borderRadius: '16px',
                fontWeight: '700',
                fontSize: '1.125rem',
                boxShadow: '0 12px 24px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                textDecoration: 'none',
                border: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(102, 126, 234, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.4)';
              }}
            >
              <FiShoppingBag size={24} />
              Browse Menu
              <FiChevronRight size={20} />
            </Link>
          </div>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-30px) scale(1.05); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '2rem 0',
      position: 'relative'
    }}>
      {/* Decorative Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '400px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        clipPath: 'polygon(0 0, 100% 0, 100% 70%, 0 100%)',
        zIndex: 0
      }}></div>

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Enhanced Header Banner */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '24px',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            borderRadius: '50%',
            filter: 'blur(40px)'
          }}></div>

          <div style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(102, 126, 234, 0.4)'
              }}>
                <FiShoppingBag size={36} color="white" />
              </div>
              <div>
                <h1 style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  My Food Cart
                </h1>
                <p style={{
                  margin: 0,
                  color: '#4a5568',
                  fontSize: '1.125rem',
                  fontWeight: '500'
                }}>
                  {cartItems.length} delicious {cartItems.length === 1 ? 'item' : 'items'} ready for you
                </p>
              </div>
            </div>

            <button
              onClick={clearCart}
              style={{
                background: 'linear-gradient(135deg, #fc5c65 0%, #eb3b5a 100%)',
                border: 'none',
                color: 'white',
                padding: '1rem 2rem',
                borderRadius: '14px',
                fontWeight: '700',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(252, 92, 101, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(252, 92, 101, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(252, 92, 101, 0.3)';
              }}
            >
              <FiTrash2 size={20} />
              Clear Cart
            </button>
          </div>
        </div>

        <div className="grid grid-3" style={{ gap: '2rem', display: 'grid', gridTemplateColumns: '2fr 1fr' }}>
          {/* Cart Items Section */}
          <div>
            {/* Delivery Options */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.98)',
              borderRadius: '20px',
              padding: '1.75rem',
              marginBottom: '1.5rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <h3 style={{
                margin: '0 0 1.25rem 0',
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#2d3748',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <FiTruck size={22} />
                Choose Delivery Option
              </h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setSelectedDeliveryOption('pickup')}
                  style={{
                    flex: 1,
                    padding: '1.25rem',
                    borderRadius: '14px',
                    border: selectedDeliveryOption === 'pickup' ? '2px solid #667eea' : '2px solid #e2e8f0',
                    background: selectedDeliveryOption === 'pickup' 
                      ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                      : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedDeliveryOption !== 'pickup') {
                      e.currentTarget.style.borderColor = '#cbd5e0';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedDeliveryOption !== 'pickup') {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <FiMapPin size={28} color={selectedDeliveryOption === 'pickup' ? '#667eea' : '#718096'} />
                  <div style={{
                    fontWeight: '700',
                    fontSize: '1.1rem',
                    color: selectedDeliveryOption === 'pickup' ? '#667eea' : '#2d3748'
                  }}>
                    Pickup
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#718096' }}>FREE • {estimatedTime}</div>
                </button>

                <button
                  onClick={() => setSelectedDeliveryOption('delivery')}
                  style={{
                    flex: 1,
                    padding: '1.25rem',
                    borderRadius: '14px',
                    border: selectedDeliveryOption === 'delivery' ? '2px solid #667eea' : '2px solid #e2e8f0',
                    background: selectedDeliveryOption === 'delivery'
                      ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                      : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedDeliveryOption !== 'delivery') {
                      e.currentTarget.style.borderColor = '#cbd5e0';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedDeliveryOption !== 'delivery') {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <FiTruck size={28} color={selectedDeliveryOption === 'delivery' ? '#667eea' : '#718096'} />
                  <div style={{
                    fontWeight: '700',
                    fontSize: '1.1rem',
                    color: selectedDeliveryOption === 'delivery' ? '#667eea' : '#2d3748'
                  }}>
                    Delivery
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#718096' }}>${deliveryFee} • {estimatedTime}</div>
                </button>
              </div>
            </div>

            {/* Cart Items */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.98)',
              borderRadius: '20px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '1.5rem 2rem',
                color: 'white'
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <FiShoppingBag size={24} />
                  Your Order ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                </h3>
              </div>

              <div style={{ padding: '1.5rem' }}>
                {cartItems.map((item, index) => {
                  const productId = getProductId(item);
                  if (!productId || productId === 'undefined') {
                    console.warn('Skipping cart item with invalid ID:', item);
                    return null;
                  }
                  const itemKey = productId || `item-${index}`;

                  return (
                    <div
                      key={itemKey}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f7fafc 100%)',
                        border: '2px solid #e2e8f0',
                        borderRadius: '16px',
                        marginBottom: '1rem',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.15)';
                        e.currentTarget.style.borderColor = '#cbd5e0';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      <Link
                        to={`/product/${productId}`}
                        style={{
                          display: 'block',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          transition: 'transform 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <Image
                          src={constructImageUrl(item.image) || '/placeholder-product.svg'}
                          alt={item.name}
                          style={{
                            width: '100px',
                            height: '100px',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                      </Link>

                      <div style={{ flex: 1 }}>
                        <Link
                          to={`/product/${productId}`}
                          style={{ textDecoration: 'none' }}
                        >
                          <h4 style={{
                            fontWeight: '700',
                            fontSize: '1.25rem',
                            marginBottom: '0.5rem',
                            color: '#2d3748',
                            transition: 'color 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#667eea';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#2d3748';
                          }}
                          >
                            {item.name}
                          </h4>
                        </Link>
                        <p style={{
                          fontSize: '0.95rem',
                          color: '#718096',
                          margin: '0.25rem 0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <FiTag size={16} />
                          {item.category}
                        </p>
                        <div style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          fontWeight: '700',
                          fontSize: '1.15rem',
                          marginTop: '0.5rem'
                        }}>
                          {formatPrice(item.price)} each
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          background: 'white',
                          borderRadius: '12px',
                          padding: '0.5rem',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                          border: '2px solid #e2e8f0'
                        }}>
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            style={{
                              width: '36px',
                              height: '36px',
                              border: 'none',
                              background: item.quantity <= 1 ? '#f7fafc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              borderRadius: '8px',
                              cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.3s ease',
                              color: item.quantity <= 1 ? '#cbd5e0' : 'white',
                              opacity: item.quantity <= 1 ? 0.5 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (item.quantity > 1) {
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (item.quantity > 1) {
                                e.currentTarget.style.transform = 'scale(1)';
                              }
                            }}
                          >
                            <FiMinus size={18} />
                          </button>

                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item, parseInt(e.target.value) || 1)}
                            style={{
                              width: '60px',
                              textAlign: 'center',
                              border: 'none',
                              background: 'transparent',
                              fontSize: '1.125rem',
                              fontWeight: '700',
                              color: '#2d3748'
                            }}
                          />

                          <button
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            style={{
                              width: '36px',
                              height: '36px',
                              border: 'none',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.3s ease',
                              color: 'white'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <FiPlus size={18} />
                          </button>
                        </div>

                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <div style={{
                            fontWeight: '800',
                            fontSize: '1.35rem',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                          }}>
                            {formatPrice(item.price * item.quantity)}
                          </div>
                          <button
                            onClick={() => handleRemoveItem(item)}
                            style={{
                              background: 'linear-gradient(135deg, #fc5c65 0%, #eb3b5a 100%)',
                              border: 'none',
                              color: 'white',
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontWeight: '600',
                              fontSize: '0.875rem',
                              boxShadow: '0 4px 8px rgba(252, 92, 101, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                              e.currentTarget.style.boxShadow = '0 6px 12px rgba(252, 92, 101, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0) scale(1)';
                              e.currentTarget.style.boxShadow = '0 4px 8px rgba(252, 92, 101, 0.3)';
                            }}
                          >
                            <FiTrash2 size={16} />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div>
            <div style={{
              position: 'sticky',
              top: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              {/* Promo Code Section */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.98)',
                borderRadius: '20px',
                padding: '1.75rem',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <h3 style={{
                  margin: '0 0 1rem 0',
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#2d3748',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <FiGift size={20} />
                  Have a Promo Code?
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter code"
                    style={{
                      flex: 1,
                      padding: '0.875rem 1rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    onClick={handleApplyPromo}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      color: 'white',
                      padding: '0.875rem 1.5rem',
                      borderRadius: '12px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(102, 126, 234, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                    }}
                  >
                    Apply
                  </button>
                </div>
                {appliedPromo && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.875rem 1rem',
                    background: 'linear-gradient(135deg, rgba(72, 187, 120, 0.1) 0%, rgba(56, 161, 105, 0.1) 100%)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#2f855a',
                    fontWeight: '600',
                    fontSize: '0.95rem'
                  }}>
                    <FiCheckCircle size={18} />
                    {appliedPromo.code} applied! {(appliedPromo.discount * 100)}% off
                  </div>
                )}
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  color: '#718096'
                }}>
                  Try: <strong style={{ color: '#667eea' }}>FOOD10</strong> or <strong style={{ color: '#667eea' }}>WELCOME20</strong>
                </div>
              </div>

              {/* Order Summary */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.98)',
                borderRadius: '20px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '1.5rem 2rem',
                  color: 'white'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.5rem',
                    fontWeight: '700'
                  }}>
                    Order Summary
                  </h3>
                </div>

                <div style={{ padding: '2rem' }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.25rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '1.05rem',
                      color: '#4a5568'
                    }}>
                      <span>Subtotal:</span>
                      <span style={{ fontWeight: '600' }}>{formatPrice(subtotal)}</span>
                    </div>

                    {appliedPromo && (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '1.05rem',
                        color: '#48bb78'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FiGift size={18} />
                          Promo Discount:
                        </span>
                        <span style={{ fontWeight: '700' }}>-{formatPrice(promoDiscount)}</span>
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '1.05rem',
                      color: '#4a5568'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiTruck size={18} />
                        {selectedDeliveryOption === 'pickup' ? 'Pickup' : 'Delivery'}:
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: '600' }}>
                          {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                        </span>
                        {deliveryFee === 0 && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#48bb78',
                            fontWeight: '700',
                            marginTop: '0.25rem'
                          }}>
                            Save ${5.99}!
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '1.05rem',
                      color: '#4a5568'
                    }}>
                      <span>Tax (8%):</span>
                      <span style={{ fontWeight: '600' }}>{formatPrice(tax)}</span>
                    </div>

                    <div style={{
                      height: '2px',
                      background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)',
                      margin: '0.5rem 0'
                    }}></div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '1.5rem',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      <span>Total:</span>
                      <span>{formatPrice(total)}</span>
                    </div>

                    {/* Estimated Time */}
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                      padding: '1rem',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginTop: '0.5rem'
                    }}>
                      <FiClock size={22} color="#667eea" />
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '0.25rem' }}>
                          Estimated Time
                        </div>
                        <div style={{ fontWeight: '700', fontSize: '1.125rem', color: '#667eea' }}>
                          {estimatedTime}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '0 2rem 2rem 2rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button
                      onClick={handleProceedToCheckout}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        color: 'white',
                        padding: '1.25rem 2rem',
                        borderRadius: '16px',
                        fontWeight: '800',
                        fontSize: '1.25rem',
                        boxShadow: '0 12px 24px rgba(102, 126, 234, 0.4)',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.75rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 20px 40px rgba(102, 126, 234, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) scale(1)';
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(102, 126, 234, 0.4)';
                      }}
                    >
                      <FiCheckCircle size={24} />
                      {user ? 'Proceed to Checkout' : 'Login to Checkout'}
                      <FiChevronRight size={20} />
                    </button>

                    <Link
                      to="/products"
                      style={{
                        width: '100%',
                        background: 'white',
                        border: '2px solid #667eea',
                        color: '#667eea',
                        padding: '1rem 1.5rem',
                        borderRadius: '16px',
                        fontWeight: '700',
                        fontSize: '1.05rem',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
                        transition: 'all 0.3s ease',
                        textAlign: 'center',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(102, 126, 234, 0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
                      }}
                    >
                      <FiShoppingBag size={20} />
                      Add More Items
                    </Link>
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.98)',
                borderRadius: '20px',
                padding: '1.5rem',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)'
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  fontSize: '0.9rem',
                  color: '#718096'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FiMapPin size={18} color="#667eea" />
                    <span>College Food Court, Main Campus</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FiPhone size={18} color="#667eea" />
                    <span>+1 (555) 123-4567</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FiClock size={18} color="#667eea" />
                    <span>Open: 8:00 AM - 9:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;