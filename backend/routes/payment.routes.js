const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  createRazorpayOrder,
  verifyPayment,
  handleWebhook,
} = require('../controllers/paymentController');

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
router.post('/create-order', protect, createRazorpayOrder);

// @desc    Verify payment and create order
// @route   POST /api/payments/verify
// @access  Private
router.post('/verify', protect, verifyPayment);

// @desc    Webhook handler for Razorpay events
// @route   POST /api/payments/webhook
// @access  Public (called by Razorpay)
router.post('/webhook', handleWebhook);

module.exports = router;
