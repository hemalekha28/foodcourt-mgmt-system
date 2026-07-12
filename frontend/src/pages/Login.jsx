import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiCheck, FiShield, FiClock, FiUsers, FiStar, FiTrendingUp, FiZap, FiHeart, FiAward } from 'react-icons/fi';
import '../styles/auth.css';

const Login = () => {
  const { login, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [focusedInput, setFocusedInput] = useState('');

  const from = location.state?.from?.pathname || '/';

  // Hero slider images - beautiful food court images
  const heroSlides = [
    {
      url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=2000&auto=format&fit=crop',
      title: 'Fresh & Delicious',
      subtitle: 'Quality meals made with love'
    },
    {
      url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2000&auto=format&fit=crop',
      title: 'Variety of Choices',
      subtitle: 'From biryani to fresh juices'
    },
    {
      url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=2000&auto=format&fit=crop',
      title: 'Healthy Options',
      subtitle: 'Nutritious meals for students'
    },
    {
      url: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?q=80&w=2000&auto=format&fit=crop',
      title: 'Quick Service',
      subtitle: 'Fast delivery between classes'
    }
  ];

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password, userRole);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-auth-page">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .premium-auth-page {
          height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          position: relative;
          overflow: hidden;
        }

        /* Animated Background Particles */
        .premium-auth-page::before {
          content: '';
          position: absolute;
          width: 100%;
          height: 100%;
          background-image: 
            radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
          animation: particleFloat 20s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes particleFloat {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(10px, -10px); }
          50% { transform: translate(-5px, 5px); }
          75% { transform: translate(5px, 10px); }
        }

        /* Left Side - Hero Slider */
        .premium-hero-section {
          position: relative;
          background: linear-gradient(135deg, #3B82F6 0%, #2563eb 50%, #1d4ed8 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          overflow: hidden;
          box-shadow: 20px 0 60px rgba(0, 0, 0, 0.3);
        }

        /* Hero Slider Container */
        .hero-slider {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .hero-slide {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hero-slide.active {
          opacity: 1;
        }

        .hero-slide img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: brightness(0.7);
        }

        /* Overlay Gradient */
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, 
            rgba(59, 130, 246, 0.95) 0%, 
            rgba(37, 99, 235, 0.9) 50%, 
            rgba(29, 78, 216, 0.85) 100%
          );
          z-index: 1;
        }

        /* Hero Content */
        .hero-content {
          position: relative;
          z-index: 2;
          text-align: center;
          color: white;
          max-width: 600px;
          animation: fadeInUp 1s ease-out;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hero-logo-section {
          margin-bottom: 1.25rem;
          animation: bounceIn 1.2s ease-out;
        }

        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }

        .hero-logo {
          width: 70px;
          height: 70px;
          margin: 0 auto 0.875rem;
          background: white;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          border: 4px solid rgba(255, 255, 255, 0.2);
        }

        .hero-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .hero-title {
          font-size: 2.25rem;
          font-weight: 900;
          margin-bottom: 0.375rem;
          line-height: 1.2;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          letter-spacing: -0.02em;
        }

        .hero-subtitle {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.375rem;
          opacity: 0.95;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }

        .hero-description {
          font-size: 0.875rem;
          line-height: 1.5;
          opacity: 0.9;
          margin-bottom: 1.25rem;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        /* Stats Section */
        .hero-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          margin-top: 1.25rem;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .stat-item {
          text-align: center;
          animation: fadeInUp 1s ease-out backwards;
        }

        .stat-item:nth-child(1) { animation-delay: 0.2s; }
        .stat-item:nth-child(2) { animation-delay: 0.3s; }
        .stat-item:nth-child(3) { animation-delay: 0.4s; }

        .stat-icon {
          width: 42px;
          height: 42px;
          margin: 0 auto 0.625rem;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.375rem;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: transform 0.3s ease;
        }

        .stat-item:hover .stat-icon {
          transform: translateY(-5px);
        }

        .stat-number {
          font-size: 1.875rem;
          font-weight: 900;
          margin-bottom: 0.25rem;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }

        .stat-label {
          font-size: 0.8125rem;
          opacity: 1;
          font-weight: 600;
          color: white;
        }

        /* Slider Indicators */
        .slider-indicators {
          position: absolute;
          bottom: 2.5rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 0.625rem;
          z-index: 3;
        }

        .indicator {
          width: 35px;
          height: 3.5px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .indicator.active {
          background: white;
          width: 55px;
        }

        /* Right Side - Form */
        .premium-form-section {
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .premium-form-section::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.03) 0%, transparent 70%);
          animation: rotateGradient 15s linear infinite;
        }

        @keyframes rotateGradient {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .premium-form-card {
          width: 100%;
          max-width: 460px;
          position: relative;
          z-index: 1;
          animation: slideInRight 0.8s ease-out;
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Role Switch - Top Position */
        .premium-role-switch {
          margin-bottom: 1.125rem;
          padding: 0.75rem 0.875rem;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 2px solid #3B82F6;
          gap: 1rem;
        }

        .premium-role-switch p {
          color: #1e40af;
          font-weight: 600;
          margin: 0;
          font-size: 0.8125rem;
        }

        .role-switch-btn {
          padding: 0.5rem 0.875rem;
          background: #3B82F6;
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.8125rem;
          white-space: nowrap;
        }

        .role-switch-btn:hover {
          background: #2563eb;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
        }

        /* Form Header */
        .premium-form-header {
          margin-bottom: 1.125rem;
          text-align: center;
        }

        .form-header-icon {
          width: 52px;
          height: 52px;
          margin: 0 auto 0.75rem;
          background: linear-gradient(135deg, #3B82F6 0%, #2563eb 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.375rem;
          color: white;
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .premium-form-header h1 {
          font-size: 1.875rem;
          font-weight: 900;
          color: #1e293b;
          margin-bottom: 0.375rem;
          letter-spacing: -0.02em;
        }

        .premium-form-header p {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }

        /* Demo Credentials */
        .premium-demo-box {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 2px solid #3B82F6;
          border-radius: 11px;
          padding: 0.875rem;
          margin-bottom: 1.125rem;
          position: relative;
          overflow: hidden;
        }

        .premium-demo-box::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3.5px;
          background: linear-gradient(90deg, #3B82F6, #2563eb, #3B82F6);
          background-size: 200% 100%;
          animation: shimmer 2s linear infinite;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .premium-demo-box h4 {
          font-size: 0.75rem;
          font-weight: 700;
          color: #1e40af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.625rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .demo-credential {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.5rem;
          background: white;
          border-radius: 7px;
          margin-bottom: 0.5rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          font-size: 0.8125rem;
        }

        .demo-credential:last-child {
          margin-bottom: 0;
        }

        .demo-credential:hover {
          transform: translateX(5px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }

        .demo-credential strong {
          color: #1e40af;
          font-weight: 700;
          min-width: 55px;
          font-size: 0.75rem;
        }

        .demo-credential span {
          color: #475569;
          font-weight: 500;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.75rem;
        }

        /* Input Groups */
        .premium-input-group {
          margin-bottom: 1rem;
        }

        .premium-input-group label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.5rem;
          transition: color 0.3s ease;
        }

        .premium-input-wrapper {
          position: relative;
        }

        .premium-input-wrapper.focused label {
          color: #3B82F6;
        }

        .input-icon {
          position: absolute;
          left: 1.125rem;
          top: 50%;
          transform: translateY(-50%);
          font-size: 1.125rem;
          color: #94a3b8;
          transition: all 0.3s ease;
          z-index: 1;
        }

        .premium-input-wrapper.focused .input-icon {
          color: #3B82F6;
          transform: translateY(-50%) scale(1.1);
        }

        .premium-input {
          width: 100%;
          padding: 0.8125rem 0.875rem 0.8125rem 2.875rem;
          border: 2px solid #e2e8f0;
          border-radius: 9px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #1e293b;
          background: white;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
        }

        .premium-input:hover {
          border-color: #cbd5e1;
        }

        .premium-input:focus {
          border-color: #3B82F6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
          background: #f8fafc;
        }

        .premium-input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .eye-toggle-btn {
          position: absolute;
          right: 1.125rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 1.125rem;
          padding: 0.5rem;
          border-radius: 7px;
          transition: all 0.2s ease;
          z-index: 1;
        }

        .eye-toggle-btn:hover {
          color: #3B82F6;
          background: #eff6ff;
        }

        /* Options Row */
        .premium-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .premium-checkbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.8125rem;
          font-weight: 500;
          color: #475569;
          transition: color 0.2s ease;
        }

        .premium-checkbox:hover {
          color: #1e293b;
        }

        .premium-checkbox input[type="checkbox"] {
          width: 15px;
          height: 15px;
          cursor: pointer;
          accent-color: #3B82F6;
        }

        .premium-link {
          color: #3B82F6;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.8125rem;
          transition: all 0.2s ease;
          position: relative;
        }

        .premium-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: #3B82F6;
          transition: width 0.3s ease;
        }

        .premium-link:hover {
          color: #2563eb;
        }

        .premium-link:hover::after {
          width: 100%;
        }

        /* Submit Button */
        .premium-submit-btn {
          width: 100%;
          padding: 0.9375rem;
          background: linear-gradient(135deg, #3B82F6 0%, #2563eb 100%);
          border: none;
          border-radius: 9px;
          color: white;
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
          position: relative;
          overflow: hidden;
        }

        .premium-submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }

        .premium-submit-btn:hover::before {
          transform: translateX(100%);
        }

        .premium-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(59, 130, 246, 0.4);
        }

        .premium-submit-btn:active {
          transform: translateY(0);
        }

        .premium-submit-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .btn-loader {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Error Alert */
        .premium-alert-error {
          background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
          border: 2px solid #ef4444;
          border-radius: 11px;
          padding: 0.875rem 1rem;
          margin-bottom: 1.125rem;
          color: #991b1b;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.625rem;
          animation: shake 0.5s ease;
          font-size: 0.8125rem;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .premium-auth-page {
            grid-template-columns: 1fr;
          }

          .premium-hero-section {
            display: none;
          }

          .premium-form-section {
            padding: 2rem 1.5rem;
          }
        }

        @media (max-width: 640px) {
          .premium-form-section {
            padding: 2rem 1rem;
          }

          .premium-form-header h1 {
            font-size: 1.75rem;
          }

          .hero-stats {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }

          .premium-options {
            flex-direction: column;
            gap: 0.875rem;
            align-items: flex-start;
          }
        }
      `}</style>

      {/* Left Hero Section */}
      <div className="premium-hero-section">
        {/* Slider */}
        <div className="hero-slider">
          {heroSlides.map((slide, index) => (
            <div key={index} className={`hero-slide ${index === currentSlide ? 'active' : ''}`}>
              <img src={slide.url} alt={slide.title} />
            </div>
          ))}
        </div>
        
        <div className="hero-overlay"></div>

        {/* Content */}
        <div className="hero-content">
          <div className="hero-logo-section">
            <div className="hero-logo">
              <img src="/logo.png" alt="KEC Food Court" />
            </div>
            <h1 className="hero-title">KEC Food Court</h1>
            <p className="hero-subtitle">Fueling Engineering Excellence</p>
          </div>

          <p className="hero-description">
            Experience the finest dining at Kongu Engineering College. 
            Fresh, delicious, and nutritious meals crafted with care for our engineering community.
          </p>

          {/* Stats */}
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-icon"><FiUsers /></div>
              <div className="stat-number">5000+</div>
              <div className="stat-label">Happy Students</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon"><FiStar /></div>
              <div className="stat-number">4.8</div>
              <div className="stat-label">Rating</div>
            </div>
            <div className="stat-item">
              <div className="stat-icon"><FiZap /></div>
              <div className="stat-number">50+</div>
              <div className="stat-label">Menu Items</div>
            </div>
          </div>
        </div>

        {/* Slider Indicators */}
        <div className="slider-indicators">
          {heroSlides.map((_, index) => (
            <div
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>

      {/* Right Form Section */}
      <div className="premium-form-section">
        <div className="premium-form-card">
          {/* Role Switch - Now at Top */}
          <div className="premium-role-switch">
            <p>Switch to {userRole === 'user' ? 'Admin' : 'User'} mode</p>
            <button
              className="role-switch-btn"
              onClick={() => {
                localStorage.removeItem('userRole');
                window.location.reload();
              }}
            >
              Switch
            </button>
          </div>

          {/* Header */}
          <div className="premium-form-header">
            <div className="form-header-icon">
              <FiShield />
            </div>
            <h1>Welcome Back!</h1>
            <p>Sign in to access your Food Court account</p>
          </div>

          {/* Demo Credentials */}
          <div className="premium-demo-box">
            <h4><FiZap /> Quick Demo Access</h4>
            <div className="demo-credential">
              <strong>User:</strong>
              <span>user@example.com / user123</span>
            </div>
            <div className="demo-credential">
              <strong>Admin:</strong>
              <span>admin@example.com / admin123</span>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="premium-alert-error">
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="premium-input-group">
              <label>Email Address</label>
              <div className={`premium-input-wrapper ${focusedInput === 'email' ? 'focused' : ''}`}>
                <FiMail className="input-icon" />
                <input
                  type="email"
                  name="email"
                  className="premium-input"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput('')}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="premium-input-group">
              <label>Password</label>
              <div className={`premium-input-wrapper ${focusedInput === 'password' ? 'focused' : ''}`}>
                <FiLock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="premium-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput('')}
                  required
                />
                <button
                  type="button"
                  className="eye-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="premium-options">
              <label className="premium-checkbox">
                <input type="checkbox" />
                Remember me
              </label>
              <Link to="#" className="premium-link">Forgot password?</Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="premium-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="btn-loader"></div>
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <FiArrowRight />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;