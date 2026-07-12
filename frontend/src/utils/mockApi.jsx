// Mock data for the e-commerce application
export const mockProducts = [
  {
    id: 1,
    name: "Premium Wireless Headphones",
    price: 299.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop",
    category: "Electronics",
    rating: 4.5,
    reviews: 128,
    description: "High-quality wireless headphones with noise cancellation and premium sound quality.",
    inStock: true,
    stock: 25
  },
  {
    id: 2,
    name: "Smart Fitness Watch",
    price: 199.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop",
    category: "Electronics",
    rating: 4.3,
    reviews: 89,
    description: "Track your fitness goals with this advanced smartwatch featuring heart rate monitoring.",
    inStock: true,
    stock: 15
  },
  {
    id: 3,
    name: "Organic Cotton T-Shirt",
    price: 29.99,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=200&fit=crop",
    category: "Clothing",
    rating: 4.2,
    reviews: 45,
    description: "Comfortable and sustainable organic cotton t-shirt in various colors.",
    inStock: true,
    stock: 50
  },
  {
    id: 4,
    name: "Modern Desk Lamp",
    price: 79.99,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop",
    category: "Home",
    rating: 4.4,
    reviews: 67,
    description: "Sleek and modern desk lamp with adjustable brightness and USB charging port.",
    inStock: true,
    stock: 30
  },
  {
    id: 5,
    name: "Leather Crossbody Bag",
    price: 149.99,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=200&fit=crop",
    category: "Fashion",
    rating: 4.6,
    reviews: 92,
    description: "Elegant leather crossbody bag perfect for daily use and special occasions.",
    inStock: true,
    stock: 20
  },
  {
    id: 6,
    name: "Wireless Gaming Mouse",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=300&h=200&fit=crop",
    category: "Electronics",
    rating: 4.1,
    reviews: 156,
    description: "High-precision wireless gaming mouse with customizable RGB lighting.",
    inStock: true,
    stock: 40
  },
  {
    id: 7,
    name: "Yoga Mat Premium",
    price: 39.99,
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&h=200&fit=crop",
    category: "Sports",
    rating: 4.3,
    reviews: 73,
    description: "Non-slip premium yoga mat with excellent cushioning for all yoga practices.",
    inStock: true,
    stock: 35
  },
  {
    id: 8,
    name: "Ceramic Coffee Mug Set",
    price: 24.99,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=300&h=200&fit=crop",
    category: "Home",
    rating: 4.0,
    reviews: 34,
    description: "Beautiful ceramic coffee mug set of 4, perfect for morning coffee or tea.",
    inStock: true,
    stock: 60
  }
];

export const mockOrders = [
  {
    id: 1001,
    userId: 1,
    userName: "John Doe",
    userEmail: "john@example.com",
    date: "2024-01-15",
    status: "delivered",
    total: 329.98,
    items: [
      { id: 1, name: "Premium Wireless Headphones", price: 299.99, quantity: 1 },
      { id: 3, name: "Organic Cotton T-Shirt", price: 29.99, quantity: 1 }
    ]
  },
  {
    id: 1002,
    userId: 2,
    userName: "Jane Smith",
    userEmail: "jane@example.com", 
    date: "2024-01-16",
    status: "shipped",
    total: 199.99,
    items: [
      { id: 2, name: "Smart Fitness Watch", price: 199.99, quantity: 1 }
    ]
  },
  {
    id: 1003,
    userId: 3,
    userName: "Mike Johnson",
    userEmail: "mike@example.com",
    date: "2024-01-17",
    status: "pending",
    total: 229.97,
    items: [
      { id: 4, name: "Modern Desk Lamp", price: 79.99, quantity: 1 },
      { id: 5, name: "Leather Crossbody Bag", price: 149.99, quantity: 1 }
    ]
  }
];

export const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    role: "user",
    joinDate: "2023-06-15",
    status: "active",
    orders: 5,
    totalSpent: 1250.00
  },
  {
    id: 2,
    name: "Jane Smith", 
    email: "jane@example.com",
    role: "user",
    joinDate: "2023-08-22",
    status: "active",
    orders: 3,
    totalSpent: 650.00
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike@example.com", 
    role: "user",
    joinDate: "2023-12-10",
    status: "active",
    orders: 1,
    totalSpent: 229.97
  }
];

// API simulation functions
export const mockApi = {
  // Products
  getProducts: (filters = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filteredProducts = [...mockProducts];
        
        if (filters.category && filters.category !== 'all') {
          filteredProducts = filteredProducts.filter(p => 
            p.category.toLowerCase() === filters.category.toLowerCase()
          );
        }
        
        if (filters.minPrice) {
          filteredProducts = filteredProducts.filter(p => p.price >= filters.minPrice);
        }
        
        if (filters.maxPrice) {
          filteredProducts = filteredProducts.filter(p => p.price <= filters.maxPrice);
        }
        
        if (filters.search) {
          filteredProducts = filteredProducts.filter(p =>
            p.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            p.description.toLowerCase().includes(filters.search.toLowerCase())
          );
        }
        
        if (filters.sortBy) {
          switch (filters.sortBy) {
            case 'price-low':
              filteredProducts.sort((a, b) => a.price - b.price);
              break;
            case 'price-high':
              filteredProducts.sort((a, b) => b.price - a.price);
              break;
            case 'rating':
              filteredProducts.sort((a, b) => b.rating - a.rating);
              break;
            case 'name':
              filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
              break;
            default:
              break;
          }
        }
        
        resolve(filteredProducts);
      }, 500);
    });
  },

  getProduct: (id) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const product = mockProducts.find(p => p.id === parseInt(id));
        if (product) {
          resolve(product);
        } else {
          reject(new Error('Product not found'));
        }
      }, 300);
    });
  },

  addProduct: (productData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newProduct = {
          id: Date.now(),
          ...productData,
          rating: 0,
          reviews: 0,
          inStock: true
        };
        mockProducts.push(newProduct);
        resolve(newProduct);
      }, 500);
    });
  },

  updateProduct: (id, productData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockProducts.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
          mockProducts[index] = { ...mockProducts[index], ...productData };
          resolve(mockProducts[index]);
        } else {
          reject(new Error('Product not found'));
        }
      }, 500);
    });
  },

  deleteProduct: (id) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockProducts.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
          const deleted = mockProducts.splice(index, 1)[0];
          resolve(deleted);
        } else {
          reject(new Error('Product not found'));
        }
      }, 500);
    });
  },

  // Orders
  getOrders: (filters = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let filteredOrders = [...mockOrders];
        
        if (filters.status && filters.status !== 'all') {
          filteredOrders = filteredOrders.filter(o => o.status === filters.status);
        }
        
        if (filters.userId) {
          filteredOrders = filteredOrders.filter(o => o.userId === filters.userId);
        }
        
        resolve(filteredOrders);
      }, 500);
    });
  },

  updateOrderStatus: (orderId, status) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const order = mockOrders.find(o => o.id === parseInt(orderId));
        if (order) {
          order.status = status;
          resolve(order);
        } else {
          reject(new Error('Order not found'));
        }
      }, 500);
    });
  },

  createOrder: (orderData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newOrder = {
          id: Date.now(),
          date: new Date().toISOString().split('T')[0],
          status: 'pending',
          ...orderData
        };
        mockOrders.push(newOrder);
        resolve(newOrder);
      }, 500);
    });
  },

  // Users
  getUsers: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...mockUsers]);
      }, 500);
    });
  },

  updateUser: (id, userData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = mockUsers.findIndex(u => u.id === parseInt(id));
        if (index !== -1) {
          mockUsers[index] = { ...mockUsers[index], ...userData };
          resolve(mockUsers[index]);
        } else {
          reject(new Error('User not found'));
        }
      }, 500);
    });
  },

  // Analytics
  getAnalytics: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const analytics = {
          totalProducts: mockProducts.length,
          totalOrders: mockOrders.length,
          totalUsers: mockUsers.length,
          totalRevenue: mockOrders.reduce((sum, order) => sum + order.total, 0),
          recentOrders: mockOrders.slice(-5).reverse(),
          topProducts: mockProducts
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 5),
          salesByMonth: [
            { month: 'Jan', sales: 12500 },
            { month: 'Feb', sales: 15200 },
            { month: 'Mar', sales: 18900 },
            { month: 'Apr', sales: 22100 },
            { month: 'May', sales: 19800 },
            { month: 'Jun', sales: 25300 }
          ]
        };
        resolve(analytics);
      }, 500);
    });
  }
};

// Helper functions
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'warning';
    case 'shipped': return 'primary';
    case 'delivered': return 'success';
    case 'cancelled': return 'danger';
    default: return 'secondary';
  }
};