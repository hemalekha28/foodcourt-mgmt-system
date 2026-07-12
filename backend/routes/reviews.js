// routes/reviews.js
const express = require('express');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// POST /api/reviews - Create a new review
router.post('/', protect, async (req, res) => {
  try {
    const { productId, orderId, rating, comment } = req.body;

    // Validate required fields
    if (!productId || !orderId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if the order belongs to the user and is delivered
    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
      status: 'delivered'
    });

    if (!order) {
      return res.status(403).json({
        success: false,
        message: 'You can only review products from delivered orders'
      });
    }

    // Check if the product is in the order
    const productInOrder = order.products.find(p =>
      p.product.toString() === productId
    );

    if (!productInOrder) {
      return res.status(403).json({
        success: false,
        message: 'Product not found in your order'
      });
    }

    // Check if user already reviewed this product for this order
    const existingReview = await Review.findOne({
      user: req.user._id,
      product: productId,
      order: orderId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product for this order'
      });
    }

    // Create the review
    const review = new Review({
      user: req.user._id,
      product: productId,
      order: orderId,
      rating,
      comment,
      isVerifiedPurchase: true
    });

    await review.save();

    // Update product with new review and recalculate rating
    const product = await Product.findById(productId);
    product.reviews.push(review._id);

    // Recalculate average rating
    const allReviews = await Review.find({ product: productId });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating = totalRating / allReviews.length;
    product.numReviews = allReviews.length;

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });

  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
});

// GET /api/reviews/product/:productId - Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reviews
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
});

// GET /api/reviews/user - Get user's reviews
router.get('/user', protect, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('product', 'name image')
      .populate('order', 'id')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: reviews
    });

  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
});

// PUT /api/reviews/:id - Update a review
router.put('/:id', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    // Validate required fields
    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Rating and comment are required'
      });
    }

    // Find the review
    const review = await Review.findOne({
      _id: req.params.id,
      user: req.user._id // Ensure the review belongs to the current user
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to edit it'
      });
    }

    // Update the review
    review.rating = rating;
    review.comment = comment;
    review.isEdited = true;
    
    await review.save();

    // Update product's average rating
    const product = await Product.findById(review.product);
    const allReviews = await Review.find({ product: review.product });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating = totalRating / allReviews.length;
    await product.save();

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });

  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
});

// GET /api/reviews/user/reviewable-products - Get products user can review
router.get('/user/reviewable-products', protect, async (req, res) => {
  try {
    // Get delivered orders for the user
    const deliveredOrders = await Order.find({
      user: req.user._id,
      status: 'delivered'
    }).populate('products.product');

    const reviewableProducts = [];

    for (const order of deliveredOrders) {
      for (const orderProduct of order.products) {
        // Check if user hasn't already reviewed this product for this order
        const existingReview = await Review.findOne({
          user: req.user._id,
          product: orderProduct.product._id,
          order: order._id
        });

        if (!existingReview) {
          reviewableProducts.push({
            product: orderProduct.product,
            orderId: order._id,
            orderDate: order.createdAt,
            quantity: orderProduct.quantity,
            price: orderProduct.price
          });
        }
      }
    }

    res.json({
      success: true,
      data: reviewableProducts
    });

  } catch (error) {
    console.error('Error fetching reviewable products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviewable products',
      error: error.message
    });
  }
});

// Export the router
module.exports = router;