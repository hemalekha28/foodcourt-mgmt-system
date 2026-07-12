// routes/cart.js
const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product'); // Assuming you have a Product model
const { protect } = require('../middlewares/auth'); // Use your existing protect middleware
const router = express.Router();

// Get user's cart
router.get('/', protect, async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      // Create empty cart if doesn't exist
      cart = new Cart({ userId: req.user._id, items: [] });
      await cart.save();
    }
    
    res.json({
      success: true,
      cart: cart
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Add item to cart
router.post('/add', protect, async (req, res) => {
  try {
    const { productId, name, price, image, category, quantity = 1 } = req.body;
    
    // Validate required fields
    if (!productId || !name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, name, and price are required'
      });
    }
    
    let cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }
    
    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );
    
    if (existingItemIndex > -1) {
      // Update quantity of existing item
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cart.items.push({
        productId,
        name,
        price,
        image,
        category,
        quantity
      });
    }
    
    await cart.save();
    
    res.json({
      success: true,
      message: 'Item added to cart',
      cart: cart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Update item quantity
router.put('/update/:productId', protect, async (req, res) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;
    
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }
    
    const cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }
    
    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    
    res.json({
      success: true,
      message: 'Cart updated',
      cart: cart
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Remove item from cart
router.delete('/remove/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    
    const cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }
    
    cart.items.splice(itemIndex, 1);
    await cart.save();
    
    res.json({
      success: true,
      message: 'Item removed from cart',
      cart: cart
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Clear entire cart
router.delete('/clear', protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    cart.items = [];
    await cart.save();
    
    res.json({
      success: true,
      message: 'Cart cleared',
      cart: cart
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Sync local cart with database (useful when user logs in)
router.post('/sync', protect, async (req, res) => {
  try {
    const { localCartItems } = req.body;
    
    let cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }
    
    // Merge local cart items with database cart
    for (const localItem of localCartItems) {
      const existingItemIndex = cart.items.findIndex(
        item => item.productId.toString() === localItem.productId || 
                item.productId.toString() === (localItem._id || localItem.id)
      );
      
      if (existingItemIndex > -1) {
        // Update quantity (take the maximum)
        cart.items[existingItemIndex].quantity = Math.max(
          cart.items[existingItemIndex].quantity,
          localItem.quantity
        );
      } else {
        // Add new item from local cart
        cart.items.push({
          productId: localItem._id || localItem.id || localItem.productId,
          name: localItem.name,
          price: localItem.price,
          image: localItem.image,
          category: localItem.category,
          quantity: localItem.quantity
        });
      }
    }
    
    await cart.save();
    
    res.json({
      success: true,
      message: 'Cart synced successfully',
      cart: cart
    });
  } catch (error) {
    console.error('Sync cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;