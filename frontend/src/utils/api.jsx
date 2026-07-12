import axios from "axios";

// Create a single axios instance with base URL
const API = axios.create({ 
  baseURL: "http://localhost:5000/api",
  timeout: 10000
});

// Attach token automatically for every request if available
API.interceptors.request.use((req) => {
  // Try to get token from localStorage first (for browser compatibility)
  let token = null;
  try {
    token = localStorage.getItem("token");
  } catch (e) {
    // If localStorage is not available, set token to null
    token = null;
  }
  
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Smart product extractor function
const extractProducts = (data) => {
  console.log('Extracting products from:', data);
  console.log('Data type:', typeof data);
  console.log('Is array:', Array.isArray(data));
  
  // If it's already an array, return it
  if (Array.isArray(data)) {
    console.log('Data is array, returning directly');
    return data;
  }
  
  // If it's null or undefined
  if (!data) {
    console.log('Data is null/undefined, returning empty array');
    return [];
  }
  
  // If it's not an object, we can't extract from it
  if (typeof data !== 'object') {
    console.log('Data is not object, returning empty array');
    return [];
  }
  
  console.log('Object keys:', Object.keys(data));
  
  // Handle your specific case: { success: true, data: { products: [...] } }
  if (data.success && data.data && Array.isArray(data.data.products)) {
    console.log('Found products at data.data.products');
    return data.data.products;
  }
  
  // Handle case without success flag: { data: { products: [...] } }
  if (data.data && Array.isArray(data.data.products)) {
    console.log('Found products at data.data.products (no success flag)');
    return data.data.products;
  }
  
  // Try common property names for products array
  const productKeys = ['products', 'data', 'items', 'result', 'docs', 'product'];
  for (const key of productKeys) {
    if (data[key] && Array.isArray(data[key])) {
      console.log(`Found products array at key: ${key}`);
      return data[key];
    }
  }
  
  // Look for nested objects that might contain arrays
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      console.log(`Checking nested object at key: ${key}`, value);
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        if (Array.isArray(nestedValue)) {
          console.log(`Found nested array at ${key}.${nestedKey}`);
          return nestedValue;
        }
      }
    }
  }
  
  // Look for any array in the object
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      console.log(`Found array at key: ${key}, using it`);
      return value;
    }
  }
  
  // If no arrays found, return empty array
  console.log('No arrays found in object, returning empty array');
  return [];
};

// Smart user extractor function (similar to products)
const extractUsers = (data) => {
  console.log('Extracting users from:', data);
  
  // If it's already an array, return it
  if (Array.isArray(data)) {
    return data;
  }
  
  // If it's null or undefined
  if (!data) {
    return [];
  }
  
  // If it's not an object, we can't extract from it
  if (typeof data !== 'object') {
    return [];
  }
  
  // Handle your backend response: { success: true, data: [...] }
  if (data.success && Array.isArray(data.data)) {
    return data.data;
  }
  
  // Handle case without success flag: { data: [...] }
  if (Array.isArray(data.data)) {
    return data.data;
  }
  
  // Try common property names for users array
  const userKeys = ['users', 'data', 'items', 'result', 'docs'];
  for (const key of userKeys) {
    if (data[key] && Array.isArray(data[key])) {
      return data[key];
    }
  }
  
  // If no arrays found, return empty array
  return [];
};

// Smart order extractor function (similar to products)
const extractOrders = (data) => {
  console.log('Extracting orders from:', data);
  
  // If it's already an array, return it
  if (Array.isArray(data)) {
    return data;
  }
  
  // If it's null or undefined
  if (!data) {
    return [];
  }
  
  // If it's not an object, we can't extract from it
  if (typeof data !== 'object') {
    return [];
  }
  
  // Handle your specific case: { success: true, data: { orders: [...] } }
  if (data.success && data.data && Array.isArray(data.data.orders)) {
    return data.data.orders;
  }
  
  // Handle case without success flag: { data: { orders: [...] } }
  if (data.data && Array.isArray(data.data.orders)) {
    return data.data.orders;
  }
  
  // Try common property names for orders array
  const orderKeys = ['orders', 'data', 'items', 'result', 'docs'];
  for (const key of orderKeys) {
    if (data[key] && Array.isArray(data[key])) {
      return data[key];
    }
  }
  
  // If no arrays found, return empty array
  return [];
};

const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

const makeRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  // Handle body data properly
  if (options.body) {
    config.data = options.body;
    delete config.body;
  }

  try {
    const response = await API.request({
      url: endpoint,
      ...config
    });
    return response.data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Cart API methods - Define BEFORE using in the main api object
const cartAPI = {
  // Get user's cart
  getCart: async () => {
    try {
      const response = await API.get('/cart');
      return response.data;
    } catch (err) {
      console.error("API error fetching cart:", err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to fetch cart');
    }
  },

  // Add item to cart
  addToCart: async (cartItem) => {
    try {
      const response = await API.post('/cart/add', cartItem);
      return response.data;
    } catch (err) {
      console.error("API error adding to cart:", err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to add item to cart');
    }
  },

  // Update cart item quantity
  updateCartItem: async (productId, quantity) => {
    try {
      // Validate productId
      if (!productId || productId === 'undefined') {
        throw new Error('Invalid product ID');
      }
      
      console.log('API: Updating cart item:', productId, 'quantity:', quantity);
      
      const response = await API.put(`/cart/update/${productId}`, { quantity });
      return response.data;
    } catch (err) {
      console.error("API error updating cart item:", err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to update cart item');
    }
  },

  // Remove item from cart
  removeFromCart: async (productId) => {
    try {
      // Validate productId
      if (!productId || productId === 'undefined') {
        throw new Error('Invalid product ID');
      }
      
      console.log('API: Removing cart item:', productId);
      
      const response = await API.delete(`/cart/remove/${productId}`);
      return response.data;
    } catch (err) {
      console.error("API error removing from cart:", err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to remove item from cart');
    }
  },

  // Clear entire cart
  clearCart: async () => {
    try {
      const response = await API.delete('/cart/clear');
      return response.data;
    } catch (err) {
      console.error("API error clearing cart:", err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to clear cart');
    }
  },

  // Sync local cart with server cart (for login)
  syncCart: async (localCartItems) => {
    try {
      const response = await API.post('/cart/sync', { localCartItems });
      return response.data;
    } catch (err) {
      console.error("API error syncing cart:", err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to sync cart');
    }
  },

  // Get cart item count
  getCartCount: async () => {
    try {
      const response = await API.get('/cart/count');
      return response.data;
    } catch (err) {
      console.error("API error getting cart count:", err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to get cart count');
    }
  }
};

// Main API export object
export const api = {
  // Products API methods
  getProducts: async (filters = {}) => {
    try {
      console.log('Fetching products with filters:', filters);
      
      const params = {};
      if (filters.category && filters.category !== "all") {
        params.category = filters.category;
      }
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.sortBy) params.sortBy = filters.sortBy;
      if (filters.search) params.search = filters.search;
      
      const response = await API.get("/products", { params });
      console.log('Raw response:', response);
      console.log('Response data:', response.data);
      
      const products = extractProducts(response.data);
      console.log('Extracted products:', products);
      console.log('Products count:', products.length);
      
      return products;
      
    } catch (err) {
      console.error("API error fetching products:", err);
      
      if (err.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to server. Make sure the backend is running on port 5000.');
      } else if (err.response?.status === 404) {
        throw new Error('Products endpoint not found. Check your backend routes.');
      } else if (err.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(err.message || 'Failed to fetch products');
      }
    }
  },

  getProduct: async (id) => {
    const response = await API.get(`/products/${id}`);
    return response.data;
  },

  addProduct: async (productData) => {
    const response = await API.post("/products", productData);
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await API.put(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await API.delete(`/products/${id}`);
    return response.data;
  },

  // Get products by IDs for comparison
  getProductsByIds: async (ids) => {
    try {
      const idString = Array.isArray(ids) ? ids.join(',') : ids;
      const response = await API.get(`/products/by-ids?ids=${idString}`);
      
      // Extract products from response
      const products = extractProducts(response.data);
      return products;
    } catch (err) {
      console.error('API error fetching products by IDs:', err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to fetch products by IDs');
    }
  },

  // Users API methods
  getUsers: async () => {
    try {
      console.log('Fetching users...');
      const response = await API.get("/users");
      console.log('Raw users response:', response);
      console.log('Users response data:', response.data);
      
      const users = extractUsers(response.data);
      console.log('Extracted users:', users);
      console.log('Users count:', users.length);
      
      return users;
      
    } catch (err) {
      console.error("API error fetching users:", err);
      
      if (err.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to server. Make sure the backend is running on port 5000.');
      } else if (err.response?.status === 404) {
        throw new Error('Users endpoint not found. Check your backend routes.');
      } else if (err.response?.status === 401) {
        throw new Error('Unauthorized. Please login as an admin.');
      } else if (err.response?.status === 403) {
        throw new Error('Forbidden. Admin access required.');
      } else if (err.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(err.message || 'Failed to fetch users');
      }
    }
  },

  getUser: async (id) => {
    try {
      const response = await API.get(`/users/${id}`);
      // Handle the backend response format { success: true, data: user }
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (err) {
      console.error("API error fetching user:", err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to fetch user');
    }
  },

  updateUser: async (id, userData) => {
    try {
      const response = await API.put(`/users/${id}`, userData);
      // Handle the backend response format { success: true, data: user }
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (err) {
      console.error("API error updating user:", err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to update user');
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await API.delete(`/users/${id}`);
      return response.data;
    } catch (err) {
      console.error("API error deleting user:", err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to delete user');
    }
  },

  getUserStats: async () => {
    try {
      const response = await API.get('/users/stats/overview');
      // Handle the backend response format { success: true, data: stats }
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return response.data;
    } catch (err) {
      console.error("API error fetching user stats:", err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to fetch user stats');
    }
  },

  getOrders: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    
    // Add filters to query params
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== 'all') {
        queryParams.append(key, filters[key]);
      }
    });
    
    const queryString = queryParams.toString();
    const endpoint = `/orders/all${queryString ? `?${queryString}` : ''}`;
    
    return makeRequest(endpoint);
  },

  // Get user's own orders
  getUserOrders: async () => {
    const response = await makeRequest('/orders');
    // The user orders endpoint wraps data, so extract the orders array
    return response.data?.orders || response.orders || response;
  },

  // Get single order
  getOrder: async (orderId) => {
    const response = await makeRequest(`/orders/${orderId}`);
    return response.data?.order || response.order || response;
  },

  // Create new order
  createOrder: async (orderData) => {
    const response = await makeRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    return response.order || response;
  },

  // Update order status
  updateOrderStatus: async (orderId, statusData) => {
    const response = await makeRequest(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
    return response.order || response;
  },

  // Login
  login: async (credentials) => {
    return makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Register
  register: async (userData) => {
    return makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getProfile: async () => {
    return makeRequest('/auth/me');
  },

  // Update user profile
  updateProfile: async (userData) => {
    return makeRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // Get Analytics - FRONTEND API CALL (not backend controller)
  getAnalytics: async () => {
    try {
      console.log('Fetching analytics data...');
      const response = await API.get('/analytics');
      console.log('Analytics response:', response.data);
      return response.data;
    } catch (err) {
      console.error("API error fetching analytics:", err);
      
      if (err.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to server. Make sure the backend is running on port 5000.');
      } else if (err.response?.status === 404) {
        throw new Error('Analytics endpoint not found. Check your backend routes.');
      } else if (err.response?.status === 401) {
        throw new Error('Unauthorized. Please login as an admin.');
      } else if (err.response?.status === 403) {
        throw new Error('Forbidden. Admin access required.');
      } else if (err.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(err.message || 'Failed to fetch analytics');
      }
    }
  },

  // Get Daily Dish-wise Analytics for a specific date
  getDailyDishAnalytics: async (date) => {
    try {
      console.log('Fetching daily dish analytics for:', date);
      const response = await API.get(`/analytics/daily/${date}`);
      console.log('Daily analytics response:', response.data);
      return response.data;
    } catch (err) {
      console.error("API error fetching daily analytics:", err);
      if (err.response?.status === 401) {
        throw new Error('Unauthorized. Please login as an admin.');
      } else if (err.response?.status === 403) {
        throw new Error('Forbidden. Admin access required.');
      } else if (err.response?.status === 400) {
        throw new Error('Invalid date format. Use YYYY-MM-DD');
      } else {
        throw new Error(err.message || 'Failed to fetch daily analytics');
      }
    }
  },

  // Cart methods - Now these reference the properly defined cartAPI
  getCart: cartAPI.getCart,
  addToCart: cartAPI.addToCart,
  updateCartItem: cartAPI.updateCartItem,
  removeFromCart: cartAPI.removeFromCart,
  clearCart: cartAPI.clearCart,
  syncCart: cartAPI.syncCart,
  getCartCount: cartAPI.getCartCount,

  // Chatbot methods
  post: async (endpoint, data) => {
    try {
      const response = await API.post(endpoint, data);
      return response;
    } catch (err) {
      console.error("API error:", err);
      throw err;
    }
  },

  get: async (endpoint) => {
    try {
      const response = await API.get(endpoint);
      return response;
    } catch (err) {
      console.error("API error:", err);
      throw err;
    }
  },

  // Reviews API methods
  createReview: async (reviewData) => {
    try {
      const response = await API.post('/reviews', reviewData);
      return response.data;
    } catch (err) {
      console.error("API error creating review:", err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to create review');
    }
  },

  updateReview: async (reviewId, reviewData) => {
    try {
      const response = await API.put(`/reviews/${reviewId}`, reviewData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (err) {
      if (err.response?.status === 404) {
        throw new Error('The review you are trying to edit does not exist or has been deleted.');
      }
      console.error("API error updating review:", err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to update review');
    }
  },

  getProductReviews: async (productId) => {
    try {
      const response = await API.get(`/reviews/product/${productId}`);
      return response.data.data || [];
    } catch (err) {
      console.error("API error fetching product reviews:", err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to fetch reviews');
    }
  },

  getUserReviews: async () => {
    try {
      const response = await API.get('/reviews/user');
      return response.data.data || [];
    } catch (err) {
      console.error("API error fetching user reviews:", err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to fetch user reviews');
    }
  },

  getReviewableProducts: async () => {
    try {
      const response = await API.get('/reviews/user/reviewable-products');
      return response.data.data || [];
    } catch (err) {
      console.error("API error fetching reviewable products:", err);
      throw new Error(err.response?.data?.message || err.message || 'Failed to fetch reviewable products');
    }
  },
};

// Export both the main api and cartAPI separately
export { cartAPI };
export default API;