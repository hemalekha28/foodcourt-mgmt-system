import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    return true;
  }
};

export const AuthProvider = ({ children, initialRole }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [userRole, setUserRole] = useState(initialRole || 'user');
  const [loading, setLoading] = useState(true);

  // Function to clear auth data
  const clearAuthData = () => {
    setUser(null);
    setToken(null);
    setUserRole('user'); // Reset to default role
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
  };

  useEffect(() => {
    // Load user and token from localStorage on app start
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('userRole');

    if (savedUser && savedToken) {
      // Check if token is expired
      if (isTokenExpired(savedToken)) {
        console.log('Token expired, clearing auth data');
        clearAuthData();
      } else {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setToken(savedToken);
          // Set role from user data or saved role
          setUserRole(userData.role || savedRole || 'user');
        } catch (error) {
          console.error('Error parsing saved user data:', error);
          clearAuthData();
        }
      }
    } else if (savedRole) {
      setUserRole(savedRole);
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        const { user, token } = responseData.data;
        
        setUser(user);
        setToken(token);
        setUserRole(user.role); // Set the user role from the response
        
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        localStorage.setItem('userRole', user.role); // Store user role
        
        return { success: true, user };
      } else {
        return { success: false, message: responseData.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        const { user, token } = responseData.data;
        
        setUser(user);
        setToken(token);
        setUserRole(user.role); // Set the user role from the response
        
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        localStorage.setItem('userRole', user.role); // Store user role
        
        return { success: true, user };
      } else {
        return { success: false, message: responseData.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Registration failed. Please try again.' };
    }
  };

  const logout = () => {
    clearAuthData();
  };

  const updateProfile = async (userData) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        const updatedUser = responseData.data.user;

        setUser(updatedUser);

        localStorage.setItem('user', JSON.stringify(updatedUser));

        return { success: true, user: updatedUser };
      } else {
        return { success: false, message: responseData.message };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: 'Profile update failed. Please try again.' };
    }
  };

  // Function to validate current session
  const validateSession = () => {
    if (token && isTokenExpired(token)) {
      console.log('Session expired, logging out');
      logout();
      return false;
    }
    return true;
  };

  const value = {
    user,
    token,
    userRole,
    loading,
    login,
    register,
    logout,
    updateProfile,
    setUserRole,
    validateSession,
    setUser: (userData) => {
      setUser(userData);
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        localStorage.removeItem('user');
      }
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};