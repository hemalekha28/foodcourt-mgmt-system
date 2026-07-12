import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { useCart } from '../context/cartContext';
import { useWishlist } from '../context/wishlistContext';
import { FiShoppingCart, FiHeart, FiUser, FiMenu, FiSearch, FiLogOut, FiX, FiHome, FiPackage } from 'react-icons/fi';
import '../styles/header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const { getCartItemsCount } = useCart();
  const { wishlist } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowMobileMenu(false);
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setShowMobileMenu(false);
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="modern-header">
  <div className="header-container">
    <div className="header-content">
      {/* Logo */}
      <Link to="/" className="header-logo">
        <div className="logo-wrapper">
          <img
            src="/logo.png"
            alt="KEC Food Court"
            className="logo-image"
          />
          <div className="logo-text-wrapper">
            <span className="logo-text">KEC Food Court</span>
            <span className="logo-tagline">Fueling Engineers</span>
          </div>
        </div>
      </Link>


          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="header-search-form">
            <div className="search-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search for Biryani, Dosas, Juices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-button">
                Search
              </button>
            </div>
          </form>

          {/* Navigation - Desktop */}
          <nav className="header-nav">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              <FiHome />
              <span>Home</span>
            </Link>
            <Link to="/products" className={`nav-link ${isActive('/products') ? 'active' : ''}`}>
              <FiPackage />
              <span>Menu</span>
            </Link>
            <div className="status-indicator">
              <span className="status-dot"></span>
              <span className="status-text">Open Now</span>
            </div>
          </nav>

          {/* Actions */}
          <div className="header-actions">

            {/* Cart Button */}
            <Link to="/cart" className="action-btn" aria-label="Cart">
              <FiShoppingCart />
              <span className="action-label">Cart</span>
              {getCartItemsCount() > 0 && (
                <span className="action-badge">{getCartItemsCount()}</span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <div ref={userMenuRef} className="user-menu-wrapper">
                <button
                  className="action-btn user-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <FiUser />
                  <span className="action-label">{user.name}</span>
                </button>

                {showUserMenu && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <div className="user-name">{user.name}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                    <div className="user-dropdown-body">
                      <Link
                        to="/dashboard"
                        className="dropdown-item"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <FiUser />
                        <span>My Dashboard</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="dropdown-item logout-item"
                      >
                        <FiLogOut />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn-login">
                  Login
                </Link>
                <Link to="/register" className="btn-register">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="mobile-menu-toggle"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Toggle menu"
            >
              {showMobileMenu ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <form onSubmit={handleSearch} className="mobile-search-form">
          <div className="search-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search for Biryani, Dosas, Juices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </form>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="mobile-menu">
          <nav className="mobile-nav">
            <Link
              to="/"
              className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              <FiHome />
              <span>Home</span>
            </Link>
            <Link
              to="/products"
              className={`mobile-nav-link ${isActive('/products') ? 'active' : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              <FiPackage />
              <span>Menu</span>
            </Link>
            <Link
              to="/wishlist"
              className="mobile-nav-link"
              onClick={() => setShowMobileMenu(false)}
            >
              <FiHeart />
              <span>Wishlist</span>
              {wishlist.length > 0 && (
                <span className="mobile-badge">{wishlist.length}</span>
              )}
            </Link>
            <Link
              to="/cart"
              className="mobile-nav-link"
              onClick={() => setShowMobileMenu(false)}
            >
              <FiShoppingCart />
              <span>Cart</span>
              {getCartItemsCount() > 0 && (
                <span className="mobile-badge">{getCartItemsCount()}</span>
              )}
            </Link>
            {user && (
              <>
                <Link
                  to="/dashboard"
                  className="mobile-nav-link"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <FiUser />
                  <span>Dashboard</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="mobile-nav-link logout-link"
                >
                  <FiLogOut />
                  <span>Logout</span>
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;