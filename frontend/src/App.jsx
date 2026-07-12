import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { FiUser, FiShield, FiPieChart, FiLogOut, FiPackage, FiShoppingCart, FiUsers } from 'react-icons/fi';
import { AuthProvider, useAuth } from './context/authContext';
import { CartProvider, useCart } from './context/cartContext';
import { NotificationProvider, useNotification } from './context/notificationContext';
import { CompareProvider, useCompare } from './context/compareContext';
import { WishlistProvider } from './context/wishlistContext';
import Header from './components/Header';
import Footer from './components/Footer';
import NotificationToast from './components/NotificationToast';
import CompareFloatingButton from './components/CompareFloatingButton';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProductManagement from './pages/ProductManagement';
import OrderManagement from './pages/OrderManagement';
import UserManagement from './pages/UserManagement';
import Cart from './components/Cart';
import Wishlist from './pages/WishList';
import ProductListing from './pages/ProductListing';
import ComparePage from './pages/ComparePage';
import Chatbot from './components/Chatbot';
import SimpleChatbot from './components/SimpleChatbot';
import ReservationPage from './pages/ReservationPage';
import AdminReservations from './pages/AdminReservations';

// Role selection component
const RoleSelector = ({ onRoleSelect }) => {
  return (
    <div className="role-selection-wrapper">
      <div className="role-selection-container">
        <header className="role-selection-header">
          <h1>Welcome to KEC Food Court</h1>
          <p>Please select your mode to continue to the portal.</p>
        </header>

        <div className="role-cards-grid">
          <div className="role-card" onClick={() => onRoleSelect('user')}>
            <div className="role-icon-wrapper">
              <FiUser />
            </div>
            <h3>Student & Faculty</h3>
            <p>Order delicious, fresh meals and manage your food wallet.</p>
            <button className="role-btn">Enter Food Court</button>
          </div>

          <div className="role-card" onClick={() => onRoleSelect('admin')}>
            <div className="role-icon-wrapper">
              <FiShield />
            </div>
            <h3>Canteen Admin</h3>
            <p>Manage recipes, inventory, daily specials, and orders securely.</p>
            <button className="role-btn">Administration</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Updated ProtectedRoute Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, userRole, loading, token } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Fixed Admin Layout Component
const AdminLayout = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = window.location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location === path || location.startsWith(path + '/');

  return (
    <div className="admin-panel-wrapper">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo-circle">M</div>
          <h2>Admin Panel</h2>
        </div>

        <nav className="admin-sidebar-nav">
          <Link to="/admin" className={`admin-nav-link ${isActive('/admin') ? 'active' : ''}`}>
            <FiPieChart />
            <span>Dashboard</span>
          </Link>
          <Link to="/admin/products" className={`admin-nav-link ${isActive('/admin/products') ? 'active' : ''}`}>
            <FiPackage />
            <span>Dishes</span>
          </Link>
          <Link to="/admin/orders" className={`admin-nav-link ${isActive('/admin/orders') ? 'active' : ''}`}>
            <FiShoppingCart />
            <span>Orders</span>
          </Link>
          <Link to="/admin/reservations" className={`admin-nav-link ${isActive('/admin/reservations') ? 'active' : ''}`}>
            <FiPieChart />
            <span>Reservations</span>
          </Link>
          <Link to="/admin/users" className={`admin-nav-link ${isActive('/admin/users') ? 'active' : ''}`}>
            <FiUsers />
            <span>Users</span>
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <button onClick={handleLogout} className="admin-logout-btn">
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main-area">
        {children}
      </main>
    </div>
  );
};

// Component to connect cart context with notification context
const NotificationConnector = () => {
  const { registerNotificationCallback } = useCart();
  const { registerNotificationCallback: registerCompareNotifications } = useCompare();
  const notificationMethods = useNotification();

  useEffect(() => {
    registerNotificationCallback(notificationMethods);
    registerCompareNotifications(notificationMethods);
  }, [registerNotificationCallback, registerCompareNotifications, notificationMethods]);

  return null;
};

function App() {
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    // Check if role was previously selected
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      setSelectedRole(savedRole);
    }
  }, []);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    localStorage.setItem('userRole', role);
  };

  if (!selectedRole) {
    return <RoleSelector onRoleSelect={handleRoleSelect} />;
  }

  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <CompareProvider>
            <WishlistProvider>
              <Router>
                <div className="App">
                  <AppContent selectedRole={selectedRole} />
                </div>
              </Router>
            </WishlistProvider>
          </CompareProvider>
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

function AppContent({ selectedRole }) {
  const { user, userRole } = useAuth();

  return (
    <>
      {/* Connect notification system with cart */}
      <NotificationConnector />

      {userRole !== 'admin' && <Header />}

      {/* Compare floating button - available on all user pages */}
      {userRole !== 'admin' && <CompareFloatingButton />}

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User Routes */}
        {userRole === 'user' && (
          <>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductListing />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/reservation" element={<ReservationPage />} />
            <Route path="/reserve" element={<ReservationPage />} />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
          </>
        )}

        {/* Admin Routes */}
        {userRole === 'admin' && (
          <>
            <Route
              path="/"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <ProductManagement />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <OrderManagement />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reservations"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <AdminReservations />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout>
                    <UserManagement />
                  </AdminLayout>
                </ProtectedRoute>
              }
            />
          </>
        )}

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {userRole !== 'admin' && <Footer />}

      {/* Chatbot - Available for all users */}
      {user && <SimpleChatbot />}

      {/* Notification Toast Component */}
      <NotificationToast />
    </>
  );
}

export default App;

