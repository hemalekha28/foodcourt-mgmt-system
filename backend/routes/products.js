const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Product = require('../models/Product');
const { protect, admin } = require('../middlewares/auth');

const router = express.Router();

// ====================
// Get All Products (with pagination + search + filter)
// ====================
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          currentPage: page,
          totalPages,
          totalProducts,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching products' });
  }
});

// ====================
// Get Single Product
// ====================
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: { product } });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(500).json({ success: false, message: 'Error fetching product' });
  }
});

// ====================
// Create Product (Admin Only)
// ====================
router.post('/', protect, admin, [
  body('name').trim().notEmpty().withMessage('Food name is required'),
  body('description').trim().notEmpty().withMessage('Food description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('image').notEmpty().withMessage('Food image URL is required'),
  body('category').isIn(['breakfast', 'lunch', 'snacks', 'juices', 'north-indian', 'south-indian', 'beverages', 'desserts']).withMessage('Invalid food category'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('isVeg').isBoolean().withMessage('isVeg must be a boolean')
], async (req, res) => {
  try {
    console.log('📦 Create Product Request Body:', JSON.stringify(req.body, null, 2));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation Errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const product = await Product.create(req.body);
    console.log('✅ Product Created:', product._id);

    res.status(201).json({ success: true, data: { product } });
  } catch (error) {
    console.error('❌ Mongoose/Server Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating food item',
      error: error.message
    });
  }
});

// ====================
// Update Product (Admin Only)
// ====================
router.put('/:id', protect, admin, [
  body('name').optional().trim().notEmpty().withMessage('Food name cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Food description cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('image').optional().notEmpty().withMessage('Food image URL cannot be empty'),
  body('category').optional().isIn(['breakfast', 'lunch', 'snacks', 'juices', 'north-indian', 'south-indian', 'beverages', 'desserts']).withMessage('Invalid food category'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('isVeg').optional().isBoolean().withMessage('isVeg must be a boolean')
], async (req, res) => {
  try {
    console.log(`📦 Update Product Request [${req.params.id}]:`, JSON.stringify(req.body, null, 2));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation Errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    console.log('✅ Product Updated:', product._id);
    res.json({ success: true, data: { product } });
  } catch (error) {
    console.error('❌ Mongoose/Server Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
});
// Add this to your backend routes

// ====================
// Get Products by IDs (for comparison)
// ====================
router.get('/by-ids', async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({ success: false, message: 'Product IDs are required' });
    }

    // Convert to array if single ID is passed
    const idArray = Array.isArray(ids) ? ids : ids.split(',');

    // Validate IDs format (basic ObjectId validation)
    const invalidIds = idArray.filter(id => !/^[0-9a-fA-F]{24}$/.test(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ success: false, message: `Invalid product IDs: ${invalidIds.join(', ')}` });
    }

    // Fetch products by IDs
    const products = await Product.find({
      _id: { $in: idArray }
    }).select('_id name price rating numReviews stock description image category isVeg');

    // Return only products that were found
    res.json({ success: true, data: { products } });
  } catch (error) {
    console.error('Error fetching products by IDs:', error);
    res.status(500).json({ success: false, message: 'Error fetching products by IDs' });
  }
});

// ====================
// Delete Product (Admin Only)
// ====================
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting product' });
  }
});

module.exports = router;
