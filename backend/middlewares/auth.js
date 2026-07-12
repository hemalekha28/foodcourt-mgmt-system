const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    console.log('🔐 Auth middleware - Headers:', req.headers.authorization);

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('🔑 Token extracted:', token ? 'Present' : 'Missing');
    }

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = verifyToken(token);
    console.log('🔓 Token decoded:', decoded);
    
    const user = await User.findById(decoded.userId).select('-password');
    console.log('👤 User found:', user ? `${user.name} (${user.role})` : 'Not found');
    
    if (!user) {
      console.log('❌ User not found for token');
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

const admin = (req, res, next) => {
  console.log('👑 Admin middleware - User role:', req.user?.role);
  
  if (req.user && req.user.role === 'admin') {
    console.log('✅ Admin access granted');
    next();
  } else {
    console.log('❌ Admin access denied');
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
};

module.exports = { protect, admin };