// routes/users.js
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/auth');
const User = require('../models/User');

// Get all users (admin only)
router.get('/', protect, admin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('❌ Get Users Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get single user by ID (admin only)
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('❌ Get User Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Update user (admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    
    const updatedUser = await user.save();
    
    res.json({
      success: true,
      data: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    console.error('❌ Update User Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Delete user (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    await user.deleteOne();
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete User Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get user stats (admin only)
router.get('/stats/overview', protect, admin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const regularUsers = await User.countDocuments({ role: 'user' });
    
    res.json({
      success: true,
      data: {
        totalUsers,
        adminUsers,
        regularUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;