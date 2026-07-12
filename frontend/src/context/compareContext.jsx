import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const CompareContext = createContext();

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};

export const CompareProvider = ({ children }) => {
  const [compareItems, setCompareItems] = useState([]);
  const [notificationCallback, setNotificationCallback] = useState(null);
  const MAX_COMPARE_ITEMS = 3;

  // Load compare items from localStorage on mount
  useEffect(() => {
    try {
      const savedCompare = localStorage.getItem('compareItems');
      if (savedCompare) {
        const parsedItems = JSON.parse(savedCompare);
        setCompareItems(parsedItems);
      }
    } catch (error) {
      console.error('Error loading compare items from localStorage:', error);
      localStorage.removeItem('compareItems');
    }
  }, []);

  // Save compare items to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('compareItems', JSON.stringify(compareItems));
    } catch (error) {
      console.error('Error saving compare items to localStorage:', error);
    }
  }, [compareItems]);

  // Register notification callback from notification context
  const registerNotificationCallback = (callback) => {
    setNotificationCallback(() => callback);
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

  // Add product to compare
  const addToCompare = (product) => {
    // Check if already in compare
    const exists = compareItems.find(item => item._id === product._id);
    if (exists) {
      showNotification(`"${product.name}" is already in comparison`, 'warning');
      return false;
    }

    // Check max limit
    if (compareItems.length >= MAX_COMPARE_ITEMS) {
      showNotification(`You can only compare up to ${MAX_COMPARE_ITEMS} products`, 'warning');
      return false;
    }

    // Optional: Check category match (only compare products from same category)
    if (compareItems.length > 0 && product.category !== compareItems[0].category) {
      showNotification('Please compare products from the same category', 'warning');
      return false;
    }

    setCompareItems(prev => [...prev, product]);
    showNotification(`"${product.name}" added to comparison`, 'success');
    return true;
  };

  // Remove product from compare
  const removeFromCompare = (productId) => {
    const item = compareItems.find(item => item._id === productId);
    setCompareItems(prev => prev.filter(item => item._id !== productId));
    if (item) {
      showNotification(`"${item.name}" removed from comparison`, 'info');
    }
  };

  // Clear all compare items
  const clearCompare = () => {
    const count = compareItems.length;
    setCompareItems([]);
    if (count > 0) {
      showNotification(`Cleared ${count} ${count === 1 ? 'product' : 'products'} from comparison`, 'info');
    }
  };

  // Check if product is in compare
  const isInCompare = (productId) => {
    return compareItems.some(item => item._id === productId);
  };

  // Get compare count
  const getCompareCount = () => {
    return compareItems.length;
  };

  // Check if can add more products
  const canAddMore = () => {
    return compareItems.length < MAX_COMPARE_ITEMS;
  };

  // Get products for comparison (fetch from backend if needed)
  const getComparisonProducts = async (productIds) => {
    try {
      if (productIds && productIds.length > 0) {
        // If we already have the products in our local state, return them
        const cachedProducts = compareItems.filter(item => productIds.includes(item._id));
        if (cachedProducts.length === productIds.length) {
          return cachedProducts;
        }
        
        // Otherwise, fetch from backend
        return await api.getProductsByIds(productIds);
      }
      
      // If no IDs provided, return current compare items
      return compareItems;
    } catch (error) {
      console.error('Error getting comparison products:', error);
      showNotification('Error loading comparison products', 'error');
      throw error;
    }
  };

  const value = {
    compareItems,
    addToCompare,
    removeFromCompare,
    clearCompare,
    isInCompare,
    getCompareCount,
    canAddMore,
    MAX_COMPARE_ITEMS,
    registerNotificationCallback,
    getComparisonProducts,
  };

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  );
};
