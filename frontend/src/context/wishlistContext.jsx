import React, { createContext, useContext, useReducer } from 'react';

const WishlistStateContext = createContext();
const WishlistDispatchContext = createContext();

const wishlistReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_WISHLIST':
      // Check if item already exists in wishlist
      const existingItemIndex = state.findIndex(item => 
        item._id === action.payload._id || item.id === action.payload.id
      );
      
      if (existingItemIndex !== -1) {
        // Item already in wishlist, return state unchanged
        return state;
      }
      
      return [...state, action.payload];
    
    case 'REMOVE_FROM_WISHLIST':
      return state.filter(item => 
        item._id !== action.payload && item.id !== action.payload
      );
    
    case 'SET_WISHLIST':
      return action.payload || [];
    
    case 'CLEAR_WISHLIST':
      return [];
    
    default:
      return state;
  }
};

const WishlistProvider = ({ children }) => {
  const [wishlist, dispatch] = useReducer(wishlistReducer, []);

  // Load wishlist from localStorage on initial render
  React.useEffect(() => {
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      try {
        const parsedWishlist = JSON.parse(savedWishlist);
        dispatch({ type: 'SET_WISHLIST', payload: parsedWishlist });
      } catch (error) {
        console.error('Error parsing wishlist from localStorage:', error);
      }
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = (product) => {
    dispatch({ type: 'ADD_TO_WISHLIST', payload: product });
  };

  const removeFromWishlist = (productId) => {
    dispatch({ type: 'REMOVE_FROM_WISHLIST', payload: productId });
  };

  const clearWishlist = () => {
    dispatch({ type: 'CLEAR_WISHLIST' });
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => 
      item._id === productId || item.id === productId
    );
  };

  const getWishlistCount = () => {
    return wishlist.length;
  };

  return (
    <WishlistStateContext.Provider value={{ 
      wishlist, 
      isInWishlist, 
      getWishlistCount 
    }}>
      <WishlistDispatchContext.Provider value={{ 
        addToWishlist, 
        removeFromWishlist, 
        clearWishlist 
      }}>
        {children}
      </WishlistDispatchContext.Provider>
    </WishlistStateContext.Provider>
  );
};

const useWishlist = () => {
  const state = useContext(WishlistStateContext);
  const dispatch = useContext(WishlistDispatchContext);
  
  if (state === undefined || dispatch === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  
  return {
    ...state,
    ...dispatch
  };
};

export { WishlistProvider, useWishlist };