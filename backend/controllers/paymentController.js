const crypto = require('crypto');
const Order = require('../models/Order');
const razorpay = require('../utils/razorpay');
const { sendOrderConfirmationEmail } = require('../utils/emailService');

// Create Razorpay order
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;
    console.log('Received order creation request:', { amount, currency, receipt });

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      console.error('Invalid amount received:', amount);
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required',
      });
    }

    // Convert amount to paise (smallest currency unit for INR)
    // We use parseFloat to handle decimal values correctly before conversion
    const amountInPaise = Math.round(parseFloat(amount) * 100);
    console.log(`Converted amount ${amount} ${currency} to ${amountInPaise} paise`);

    const options = {
      amount: amountInPaise,
      currency,
      receipt: receipt || `order_${Date.now()}`,
      payment_capture: 1, // Auto-capture payment
    };

    console.log('Creating Razorpay order with options:', options);
    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created successfully:', order.id);

    res.status(201).json({
      success: true,
      order,
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message,
    });
  }
};

// Verify payment and update order
const verifyPayment = async (req, res) => {
  const { orderId, paymentId, signature, order: orderData } = req.body;

  try {
    // Verify the payment signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (generatedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
      });
    }

    // Create order in database
    const order = new Order({
      user: req.user._id,
      products: orderData.products,
      shippingAddress: orderData.shippingAddress,
      total: orderData.total,
      paymentMethod: 'online',
      paymentStatus: 'paid',
      paymentDetails: {
        paymentId,
        orderId,
        status: 'captured',
      },
    });

    await order.save();

    // Send order confirmation email
    await sendOrderConfirmationEmail(
      req.user.email,
      req.user.name,
      {
        orderId: order._id.toString().slice(-8),
        orderDate: order.createdAt,
        total: order.total,
        items: order.products,
        shippingAddress: order.shippingAddress
      }
    );

    res.status(200).json({
      success: true,
      message: 'Payment verified and order created successfully',
      order,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message,
    });
  }
};

// Webhook handler for payment events
const handleWebhook = async (req, res) => {
  const { event, payload } = req.body;

  // Verify the webhook signature
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (generatedSignature !== req.headers['x-razorpay-signature']) {
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  try {
    if (event === 'payment.captured') {
      const { order_id, payment_id, status } = payload.payment.entity;

      // Find and update the order
      const order = await Order.findOneAndUpdate(
        { 'paymentDetails.orderId': order_id },
        {
          'paymentDetails.status': status,
          'paymentDetails.paymentId': payment_id,
          status: status === 'captured' ? 'processing' : 'pending',
        },
        { new: true }
      );

      if (!order) {
        console.warn(`Order not found for Razorpay order ID: ${order_id}`);
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ success: false, message: 'Error processing webhook' });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyPayment,
  handleWebhook,
};
