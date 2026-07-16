import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiTruck, FiLock, FiCheck, FiDollarSign, FiCreditCard, FiShield, FiShoppingCart, FiClock } from 'react-icons/fi';
import { useCart } from '../context/cartContext';
import { useAuth } from '../context/authContext';
import { api } from '../utils/api';
import { formatPrice } from '../utils/helpers';
import Image from '../components/Image';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  
  // 🔥 NEW: State for Smart Queue Intelligence
  const [orderIntel, setOrderIntel] = useState(null);

  // Check for Buy Now item
  const buyNowItem = location.state?.buyNowItem;
  const isBuyNow = !!buyNowItem;

  // Use either buyNowItem (as an array) or cartItems
  const checkoutItems = isBuyNow ? [buyNowItem] : cartItems;

  useEffect(() => {
    console.log('Checkout component - Checkout items:', checkoutItems);
    console.log('Checkout component - Mode:', isBuyNow ? 'Buy Now' : 'Cart Checkout');
  }, [checkoutItems, isBuyNow]);

  const [formData, setFormData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    phone: '',
    deliveryType: 'FoodCourt', // FoodCourt or Classroom
    tableNumber: '',
    classroomInfo: '',
    department: '',
    block: '',
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Calculate totals
  const subtotal = isBuyNow
    ? (buyNowItem.price * buyNowItem.quantity)
    : getCartTotal();

  const shipping = formData.shippingMethod === 'express' ? 19.99 : subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    try {
      setLoading(true);

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Failed to load Razorpay SDK. Please check your internet connection.');
        setLoading(false);
        return;
      }

      // Create order on backend
      const orderResponse = await api.post('/payments/create-order', {
        amount: total, // Send standard units, backend handles conversion to paise
        currency: 'INR',
        receipt: `order_rcpt_${Date.now()}`
      });

      console.log('Razorpay Order Response:', orderResponse.data);

      if (!orderResponse.data || !orderResponse.data.order) {
        throw new Error('Failed to create Razorpay order');
      }

      const razorpayOrder = orderResponse.data.order;

      // Use Razorpay key from environment variables
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount, // Already in paise from backend
        currency: razorpayOrder.currency,
        name: "Starlit & Co",
        description: "Order Payment",
        order_id: razorpayOrder.id,
        handler: handleRazorpaySuccess,
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: "#0066cc"
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        }
      };


      const razorpay = new window.Razorpay(options);
      razorpay.open();
      razorpay.on('payment.failed', (response) => {
        setLoading(false);
        alert(`Payment failed: ${response.error.description}`);
      });
    } catch (error) {
      console.error('Error initializing Razorpay:', error);
      setLoading(false);
      alert('Failed to initialize payment. Please try again.');
    }
  };

  const handleRazorpaySuccess = async (paymentResponse) => {
    setLoading(true);
    try {
      // Log payment response for debugging
      console.log('Payment response:', paymentResponse);

      // Skip verification for now
      console.log('Skipping payment verification for development');

      // Create order after successful payment
      const orderData = {
        items: checkoutItems.map((item) => ({
          foodId: item.productId || item.id || item._id,
          foodName: item.name,
          price: item.price,
          quantity: item.quantity || 1
        })),
        paymentMethod: 'ONLINE',
        paymentStatus: 'Paid',
        paymentId: paymentResponse.razorpay_payment_id,
        deliveryType: formData.deliveryType,
        deliveryDetails: {
          tableNumber: formData.tableNumber,
          classroomInfo: formData.classroomInfo,
          department: formData.department,
          block: formData.block
        },
        totalAmount: total
      };

      // Create order
      const response = await api.post('/orders', orderData);
      console.log('Order created:', response.data);

      // 🔥 Capture ETA + alternate food from Razorpay order
      setOrderIntel({
        estimatedWait: response.data.data?.order?.estimatedWait || null,
        alternateFood: response.data.data?.order?.alternateFood || null
      });

      // Clear cart and show success
      // Clear cart only if it's not a direct buy now
      if (!isBuyNow) {
        clearCart();
      }
      setOrderPlaced(true);
      setLoading(false);

      // Redirect to order success page or show success message
      alert('Order placed successfully!');
      navigate('/orders');
    } catch (error) {
      console.error('Order creation failed:', error);
      setLoading(false);
      alert('Payment was successful but there was an issue creating your order. Please contact support with payment ID: ' +
        (paymentResponse.razorpay_payment_id || 'N/A'));
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    alert(`Payment error: ${error?.message || 'Something went wrong with the payment'}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (paymentMethod === 'razorpay') {
        await handleRazorpayPayment();
      } else if (paymentMethod === 'cod') {
        // ✅ CASH ON DELIVERY - Fixed payload to match backend schema
        const orderData = {
          products: checkoutItems.map((item) => ({
            product: item.productId || item.id || item._id,
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1
          })),

          totalAmount: checkoutItems.reduce(
            (sum, item) => sum + item.price * (item.quantity || 1),
            0
          ),

          paymentMethod: 'CASH',

          shippingAddress: {
            address:
              formData.deliveryType === 'FoodCourt'
                ? 'Food Court'
                : formData.classroomInfo || 'Classroom',
            city: 'Campus',
            postalCode: '000000',
            country: 'India'
          }
        };

        const response = await api.post('/orders', orderData);
        console.log('✅ COD Order created:', response.data);
        
        // 🔥 Capture ETA + alternate food from backend response
        setOrderIntel({
          estimatedWait: response.data.data?.order?.estimatedWait || null,
          alternateFood: response.data.data?.order?.alternateFood || null
        });
        
        if (!isBuyNow) {
          clearCart();
        }
        setOrderPlaced(true);
      }
      // For Razorpay, the payment flow is handled by the RazorpayButton component
    } catch (error) {
      console.error('❌ Order creation failed:', error);
      alert('There was an issue creating your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (checkoutItems.length === 0 && !orderPlaced) {
      navigate('/cart');
    }
  }, [checkoutItems.length, orderPlaced, navigate]);

  // Success screen
  if (orderPlaced) {
    return (
      <div className="container" style={{ padding: '2rem 0' }}>
        <div className="text-center" style={{ padding: '4rem 0' }}>
          <div className="card" style={{
            maxWidth: '500px',
            margin: '0 auto',
            background: 'linear-gradient(135deg, #eef6ff 0%, #f0f9ff 100%)',
            border: '1px solid #e0f2fe',
            boxShadow: '0 10px 25px rgba(0, 102, 204, 0.1)'
          }}>
            <div className="card-body" style={{ padding: '3rem 2rem' }}>
              <div style={{
                width: '100px',
                height: '100px',
                margin: '0 auto 2rem',
                background: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(0, 102, 204, 0.3)'
              }}>
                <FiCheck size={48} color="white" />
              </div>
              <h1 style={{
                color: '#059669',
                marginBottom: '1rem',
                fontSize: '2rem',
                fontWeight: '700'
              }}>
                Order Placed Successfully!
              </h1>
              <p style={{
                color: '#1f2937',
                marginBottom: '2rem',
                fontSize: '1.125rem',
                lineHeight: '1.6'
              }}>
                Thank you for your purchase. You will receive an order confirmation email shortly.
                {paymentMethod === 'cod' && ' Payment will be collected upon delivery.'}
              </p>

              {/* 🔥 SMART QUEUE INTELLIGENCE - Show after order placement */}
              {orderIntel && (
                <div style={{
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  border: '2px solid #0066cc',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '2rem',
                  textAlign: 'left'
                }}>
                  <h4 style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#0066cc',
                    marginBottom: '1rem',
                    fontSize: '1.125rem',
                    fontWeight: '600'
                  }}>
                    <FiClock size={20} /> Smart Queue Intelligence
                  </h4>

                  {orderIntel.estimatedWait && (
                    <p style={{
                      fontSize: '1rem',
                      color: '#1f2937',
                      marginBottom: '0.75rem'
                    }}>
                      <strong>Estimated Wait Time:</strong>
                      <span style={{
                        color: '#0066cc',
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        marginLeft: '0.5rem'
                      }}>
                        {orderIntel.estimatedWait} minutes
                      </span>
                    </p>
                  )}

                  {orderIntel.alternateFood && (
                    <div style={{
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginTop: '1rem'
                    }}>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        marginBottom: '0.5rem'
                      }}>
                        ⚡ Faster Option Available:
                      </p>
                      <p style={{
                        fontSize: '1rem',
                        color: '#0066cc',
                        fontWeight: '600',
                        margin: 0
                      }}>
                        {orderIntel.alternateFood.name}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-primary"
                  style={{
                    background: '#0066cc',
                    border: 'none',
                    color: 'white',
                    padding: '0.875rem 2rem',
                    borderRadius: '12px',
                    fontWeight: '600',
                    boxShadow: '0 8px 20px rgba(0, 102, 204, 0.2)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
                  }}
                >
                  View Orders
                </button>
                <button
                  onClick={() => navigate('/products')}
                  className="btn btn-secondary"
                  style={{
                    background: '#ffffff',
                    border: '2px solid #0066cc',
                    color: '#0066cc',
                    padding: '0.875rem 2rem',
                    borderRadius: '12px',
                    fontWeight: '600',
                    boxShadow: '0 8px 20px rgba(0, 102, 204, 0.1)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 12px 30px rgba(79, 172, 254, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(79, 172, 254, 0.3)';
                  }}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
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
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            margin: '0 0 0.5rem 0',
            fontSize: '2rem',
            fontWeight: '700',
            color: 'white'
          }}>Checkout</h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '1rem' }}>
            Complete your order in just a few steps
          </p>
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

      <form onSubmit={handleSubmit}>
        <div className="grid grid-3" style={{ gap: '2rem', alignItems: 'start' }}>
          {/* Left Column - Forms */}
          <div style={{ gridColumn: '1 / 3', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Shipping Information */}
            <div className="card" style={{
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb'
            }}>
              <div className="card-header" style={{
                background: '#0066cc',
                color: 'white',
                borderBottom: 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiShoppingCart size={20} color="white" />
                  <h3 style={{ margin: 0, color: 'white' }}>Dining & Delivery Options</h3>
                </div>
              </div>
              <div className="card-body">
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      className="form-input"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      className="form-input"
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      className="form-input"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Delivery Type *</label>
                  <select
                    name="deliveryType"
                    className="form-input"
                    value={formData.deliveryType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="FoodCourt">Self-Pickup (Food Court Table)</option>
                    <option value="Classroom">Classroom Delivery</option>
                  </select>
                </div>

                {formData.deliveryType === 'FoodCourt' ? (
                  <div className="form-group">
                    <label className="form-label">Table Number (If already seated) / Token Pickup</label>
                    <input
                      type="text"
                      name="tableNumber"
                      className="form-input"
                      placeholder="e.g., Table 12 or write 'Pickup'"
                      value={formData.tableNumber}
                      onChange={handleInputChange}
                    />
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0f9ff', padding: '12px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>🍽️</span>
                        <span style={{ fontSize: '0.875rem', color: '#0369a1', fontWeight: 500 }}>Want to dine in but don't have a table?</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => navigate('/reservation')}
                        style={{ 
                          background: '#0284c7', 
                          border: 'none', 
                          color: 'white', 
                          fontWeight: 600, 
                          cursor: 'pointer',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#0369a1'}
                        onMouseLeave={(e) => e.target.style.background = '#0284c7'}
                      >
                        Reserve Now
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-2">
                    <div className="form-group">
                      <label className="form-label">Block / Building *</label>
                      <input
                        type="text"
                        name="block"
                        className="form-input"
                        placeholder="e.g., MBA Block / C1"
                        value={formData.block}
                        onChange={handleInputChange}
                        required={formData.deliveryType === 'Classroom'}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Classroom / Staff Room Info *</label>
                      <input
                        type="text"
                        name="classroomInfo"
                        className="form-input"
                        placeholder="e.g., Room 204 or Physics Lab"
                        value={formData.classroomInfo}
                        onChange={handleInputChange}
                        required={formData.deliveryType === 'Classroom'}
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    name="department"
                    className="form-input"
                    placeholder="e.g., CSE / ECE / Mechanical"
                    value={formData.department}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card" style={{
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb'
            }}>
              <div className="card-header" style={{
                background: '#0052a3',
                color: 'white',
                borderBottom: 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiDollarSign size={20} color="white" />
                  <h3 style={{ margin: 0, color: 'white' }}>Payment Method</h3>
                  <FiLock size={16} color="white" style={{ marginLeft: 'auto' }} />
                </div>
              </div>
              <div className="card-body">
                <div style={{ marginBottom: '1rem' }}>

                  {/* Cash on Delivery */}
                  <div
                    onClick={() => setPaymentMethod('cod')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      backgroundColor: paymentMethod === 'cod' ? 'rgba(16, 185, 129, 0.1)' : '#f9fafb',
                      border: `2px solid ${paymentMethod === 'cod' ? '#10b981' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${paymentMethod === 'cod' ? '#10b981' : '#9ca3af'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {paymentMethod === 'cod' && (
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: '#10b981'
                        }} />
                      )}
                    </div>
                    <FiDollarSign size={24} color={paymentMethod === 'cod' ? '#10b981' : '#6b7280'} />
                    <div>
                      <h4 style={{
                        margin: '0 0 0.25rem 0',
                        color: paymentMethod === 'cod' ? '#10b981' : '#1f2937'
                      }}>
                        Cash on Delivery
                      </h4>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                        Pay when your order is delivered to your doorstep
                      </p>
                    </div>
                  </div>

                  {/* Razorpay Payment */}
                  <div
                    onClick={() => setPaymentMethod('razorpay')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      backgroundColor: paymentMethod === 'razorpay' ? 'rgba(59, 130, 246, 0.1)' : '#f9fafb',
                      border: `2px solid ${paymentMethod === 'razorpay' ? '#3b82f6' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: `2px solid ${paymentMethod === 'razorpay' ? '#3b82f6' : '#9ca3af'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {paymentMethod === 'razorpay' && (
                        <div style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: '#3b82f6'
                        }} />
                      )}
                    </div>
                    <FiCreditCard size={24} color={paymentMethod === 'razorpay' ? '#3b82f6' : '#6b7280'} />
                    <div>
                      <h4 style={{
                        margin: '0 0 0.25rem 0',
                        color: paymentMethod === 'razorpay' ? '#3b82f6' : '#1f2937'
                      }}>
                        Pay Online (Razorpay)
                      </h4>
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
                        Credit/Debit Card, UPI, Net Banking
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                {paymentMethod === 'razorpay' && (
                  <div style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginTop: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FiShield size={18} color="#3b82f6" />
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      Secure payment powered by Razorpay. Your payment information is encrypted.
                    </span>
                  </div>
                )}

                {paymentMethod === 'cod' && (
                  <div style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginTop: '1rem'
                  }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#10b981', fontSize: '0.875rem' }}>
                      How Cash on Delivery Works:
                    </h4>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                      <li>Place your order without any upfront payment</li>
                      <li>We'll process and ship your order</li>
                      <li>Pay the delivery person when you receive your order</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div>
            <div className="card" style={{
              position: 'sticky',
              top: '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              border: '1px solid #e5e7eb'
            }}>
              <div className="card-header" style={{
                background: '#0052a3',
                color: 'white',
                borderBottom: 'none'
              }}>
                <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiShoppingCart size={20} color="white" />
                  Order Summary
                </h3>
              </div>
              <div className="card-body">
                {/* Cart Items */}
                <div style={{ marginBottom: '1.5rem' }}>
                  {checkoutItems.map((item, index) => (
                    <div
                      key={item.id || item._id || `item-${index}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '1rem',
                        paddingBottom: '1rem',
                        borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      <div
                        style={{
                          width: '60px',
                          height: '60px',
                          marginRight: '1rem',
                          position: 'relative',
                          borderRadius: '0.5rem',
                          overflow: 'hidden',
                          backgroundColor: '#f3f4f6',
                        }}
                      >
                        <Image
                          productId={item.id || item._id}
                          alt={item.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            padding: '0.25rem',
                          }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          Qty: {item.quantity} × {formatPrice(item.price)}
                        </div>
                      </div>
                      <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal:</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Shipping:</span>
                    <span>{formatPrice(shipping)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tax:</span>
                    <span>{formatPrice(tax)}</span>
                  </div>

                  <hr />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '600' }}>
                    <span>Total:</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <button
                  type="submit"
                  className="btn btn-primary btn-full btn-lg"
                  disabled={loading}
                  style={{
                    background: loading
                      ? '#e5e7eb'
                      : '#0066cc',
                    border: 'none',
                    color: loading ? '#9ca3af' : 'white',
                    padding: '1rem 2rem',
                    borderRadius: '12px',
                    fontWeight: '600',
                    fontSize: '1.125rem',
                    boxShadow: loading
                      ? 'none'
                      : '0 8px 20px rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 12px 30px rgba(102, 126, 234, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
                    }
                  }}
                >
                  {loading ? (
                    'Processing...'
                  ) : paymentMethod === 'razorpay' ? (
                    <>
                      <FiCreditCard />
                      Pay {formatPrice(total)}
                    </>
                  ) : (
                    <>
                      <FiDollarSign />
                      Place Order - {formatPrice(total)}
                    </>
                  )}
                </button>

                {paymentMethod === 'cod' && (
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center', marginTop: '1rem' }}>
                    <FiDollarSign size={12} style={{ marginRight: '0.25rem' }} />
                    Pay when your order is delivered
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;