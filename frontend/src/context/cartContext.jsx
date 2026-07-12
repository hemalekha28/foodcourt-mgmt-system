import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './authContext'; // Import your auth context

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [notificationCallback, setNotificationCallback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { user, token } = useAuth(); // Get user and token from auth context

  // API Base URL - adjust according to your backend
  const API_BASE = 'http://localhost:5000/api';

  // Helper function to make API calls
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  };

  // Load cart from database when user logs in
  const loadCartFromDB = async () => {
    if (!user || !token) return;

    setIsLoading(true);
    try {
      const result = await apiCall('/cart');
      if (result.success && result.cart) {
        setCartItems(result.cart.items || []);
      }
    } catch (error) {
      console.error('Error loading cart from database:', error);
      showNotification('Error loading cart', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Sync local cart with database when user logs in
  const syncCartWithDB = async () => {
    if (!user || !token) return;

    const localCart = JSON.parse(localStorage.getItem('cart') || '[]');

    if (localCart.length === 0) {
      // No local cart to sync, just load from DB
      await loadCartFromDB();
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiCall('/cart/sync', {
        method: 'POST',
        body: JSON.stringify({ localCartItems: localCart }),
      });

      if (result.success && result.cart) {
        setCartItems(result.cart.items || []);
        // Clear localStorage after successful sync
        localStorage.removeItem('cart');
        showNotification('Cart synced successfully!', 'success');
      }
    } catch (error) {
      console.error('Error syncing cart:', error);
      showNotification('Error syncing cart', 'error');
      // Fallback to loading from DB
      await loadCartFromDB();
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize cart - load from localStorage or DB
  useEffect(() => {
    const initializeCart = async () => {
      if (user && token) {
        // User is logged in - sync with database
        await syncCartWithDB();
      } else {
        // User not logged in - load from localStorage
        try {
          const savedCart = localStorage.getItem('cart');
          if (savedCart) {
            const parsedCart = JSON.parse(savedCart);
            setCartItems(parsedCart);
          }
        } catch (error) {
          console.error('Error loading cart from localStorage:', error);
          localStorage.removeItem('cart');
        }
      }
    };

    initializeCart();
  }, [user, token]);



  // Save cart to localStorage when user is not logged in
  useEffect(() => {
    if (!user) {
      try {
        localStorage.setItem('cart', JSON.stringify(cartItems));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [cartItems, user]);



  // Allow notification context to register its callback
  const registerNotificationCallback = (callback) => {
    setNotificationCallback(() => callback);
  };

  // Helper function to get consistent product ID
  const getProductId = (product) => {
    // For database items, use productId field, for local items use _id or id
    if (product.productId) {
      return product.productId.toString();
    }
    return (product._id || product.id)?.toString();
  };

  // Helper function to show notifications
  const showNotification = (message, type = 'info') => {
    if (notificationCallback) {
      switch (type) {
        case 'success':
          notificationCallback.showSuccess(message);
          break;
        case 'error':
          notificationCallback.showError(message);
          break;
        case 'warning':
          notificationCallback.showWarning(message);
          break;
        default:
          notificationCallback.showInfo(message);
      }
    }
  };

  const addToCart = async (product, quantity = 1) => {
    const productId = getProductId(product);

    // Validate productId
    if (!productId || productId === 'undefined') {
      console.error('Invalid product ID for addToCart:', product);
      showNotification('Error adding item to cart - invalid product', 'error');
      return;
    }

    if (user && token) {
      // User logged in - add to database
      setIsLoading(true);
      try {
        const result = await apiCall('/cart/add', {
          method: 'POST',
          body: JSON.stringify({
            productId,
            name: product.name,
            price: product.price,
            image: product.image,
            category: product.category,
            quantity,
          }),
        });

        if (result.success && result.cart) {
          setCartItems(result.cart.items || []);
          showNotification(`"${product.name}" has been added to your cart!`, 'success');
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Error adding item to cart', 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      // User not logged in - use localStorage
      const existingItem = cartItems.find(item => getProductId(item) === productId);

      if (existingItem) {
        showNotification(
          `"${product.name}" is already in your cart. Quantity updated from ${existingItem.quantity} to ${existingItem.quantity + quantity}.`,
          'warning'
        );

        setCartItems(prevItems =>
          prevItems.map(item =>
            getProductId(item) === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        );
      } else {
        const normalizedProduct = {
          ...product,
          id: productId,
          _id: productId
        };

        setCartItems(prevItems => [...prevItems, { ...normalizedProduct, quantity }]);

        showNotification(`"${product.name}" has been added to your cart!`, 'success');
      }
    }
  };

  const removeFromCart = async (productId) => {
    // Validate productId
    if (!productId || productId === 'undefined') {
      console.error('Invalid product ID for removeFromCart:', productId);
      showNotification('Error removing item from cart - invalid product ID', 'error');
      return;
    }

    if (user && token) {
      // User logged in - remove from database
      setIsLoading(true);
      try {
        const result = await apiCall(`/cart/remove/${productId}`, {
          method: 'DELETE',
        });

        if (result.success && result.cart) {
          setCartItems(result.cart.items || []);
          showNotification('Item removed from cart', 'info');
        }
      } catch (error) {
        console.error('Error removing from cart:', error);
        showNotification('Error removing item from cart', 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      // User not logged in - remove from localStorage
      const itemToRemove = cartItems.find(item => getProductId(item) === productId);

      setCartItems(prevItems =>
        prevItems.filter(item => getProductId(item) !== productId)
      );

      if (itemToRemove) {
        showNotification(`"${itemToRemove.name}" has been removed from your cart.`, 'info');
      }
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    // Validate productId
    if (!productId || productId === 'undefined') {
      console.error('Invalid product ID for updateQuantity:', productId);
      showNotification('Error updating cart - invalid product ID', 'error');
      return;
    }

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (user && token) {
      // User logged in - update in database
      setIsLoading(true);
      try {
        console.log('Updating cart item:', productId, 'to quantity:', newQuantity);

        const result = await apiCall(`/cart/update/${productId}`, {
          method: 'PUT',
          body: JSON.stringify({ quantity: newQuantity }),
        });

        if (result.success && result.cart) {
          setCartItems(result.cart.items || []);
          // Find the item for notification
          const item = result.cart.items.find(item =>
            (item.productId && item.productId.toString() === productId) ||
            (item._id && item._id.toString() === productId) ||
            (item.id && item.id.toString() === productId)
          );
          if (item) {
            showNotification(`"${item.name}" quantity updated to ${newQuantity}.`, 'info');
          }
        }
      } catch (error) {
        console.error('Error updating cart:', error);
        showNotification('Error updating cart', 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      // User not logged in - update localStorage
      const item = cartItems.find(item => getProductId(item) === productId);
      if (item) {
        setCartItems(prevItems =>
          prevItems.map(item =>
            getProductId(item) === productId
              ? { ...item, quantity: newQuantity }
              : item
          )
        );

        showNotification(`"${item.name}" quantity updated to ${newQuantity}.`, 'info');
      }
    }
  };

  const clearCart = async () => {
    const itemCount = cartItems.length;

    if (user && token) {
      // User logged in - clear database
      setIsLoading(true);
      try {
        const result = await apiCall('/cart/clear', {
          method: 'DELETE',
        });

        if (result.success) {
          setCartItems([]);
          if (itemCount > 0) {
            showNotification(
              `Cart cleared! ${itemCount} ${itemCount === 1 ? 'item' : 'items'} removed.`,
              'info'
            );
          }
        }
      } catch (error) {
        console.error('Error clearing cart:', error);
        showNotification('Error clearing cart', 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      // User not logged in - clear localStorage
      setCartItems([]);

      if (itemCount > 0) {
        showNotification(
          `Cart cleared! ${itemCount} ${itemCount === 1 ? 'item' : 'items'} removed.`,
          'info'
        );
      }
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getItemQuantityInCart = (productId) => {
    if (!productId || productId === 'undefined') return 0;
    const item = cartItems.find(item => getProductId(item) === productId);
    return item ? item.quantity : 0;
  };

  const isInCart = (productId) => {
    if (!productId || productId === 'undefined') return false;
    return cartItems.some(item => getProductId(item) === productId);
  };

  const value = {
    cartItems,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isInCart,
    getCartTotal,
    getCartItemsCount,
    getItemQuantityInCart,
    registerNotificationCallback,
    loadCartFromDB, // Exposed for manual refresh if needed
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};