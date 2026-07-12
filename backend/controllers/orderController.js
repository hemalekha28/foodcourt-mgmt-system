const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail
} = require("../utils/emailService");

// CREATE ORDER
exports.createOrder = async (req, res) => {
  try {
    // 🔐 SAFETY CHECK
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    const {
      items,
      deliveryType,
      deliveryDetails,
      paymentMethod
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No items in order"
      });
    }

    // Normalize payment method
    const normalizedPaymentMethod =
      paymentMethod === "ONLINE" ? "ONLINE" : "CASH";

    let totalAmount = 0;
    const orderItems = [];

    // Validate products & calculate total
    for (let item of items) {
      const product = await Product.findById(item.foodId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Dish not found`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name}`
        });
      }

      orderItems.push({
        foodId: product._id,
        foodName: product.name,
        price: product.price,
        quantity: item.quantity
      });

      totalAmount += product.price * item.quantity;

      // Reduce stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Create order
    const newOrder = new Order({
      user: req.user._id,
      items: orderItems,
      totalAmount,
      deliveryType: deliveryType || "FoodCourt",
      deliveryDetails: deliveryDetails || {},
      orderStatus: "Preparing",
      paymentMethod: normalizedPaymentMethod,
      paymentStatus:
        normalizedPaymentMethod === "ONLINE" ? "Paid" : "Pending"
    });

    await newOrder.save();

    // Send confirmation email
    const user = await User.findById(req.user._id);
    if (user) {
      try {
        await sendOrderConfirmationEmail(
          user.email,
          user.name,
          {
            orderId: newOrder._id.toString().slice(-8),
            tokenNumber: newOrder.tokenNumber,
            orderDate: newOrder.createdAt,
            total: totalAmount,
            items: orderItems,
            deliveryType: newOrder.deliveryType
          }
        );
      } catch (emailError) {
        console.error("Email failed:", emailError.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: `Order placed successfully! Token No: ${newOrder.tokenNumber}`,
      data: {
        order: newOrder,
        token: newOrder.tokenNumber
      }
    });

  } catch (err) {
    console.error("Order creation error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create order"
    });
  }
};

// GET USER ORDERS
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET ALL ORDERS (ADMIN)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.foodId", "name price image category isVeg")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE ORDER STATUS (ADMIN)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    order.orderStatus = orderStatus;
    await order.save();

    const user = await User.findById(order.user);
    if (user) {
      try {
        await sendOrderStatusUpdateEmail(
          user.email,
          user.name,
          {
            orderId: order._id.toString().slice(-8),
            tokenNumber: order.tokenNumber,
            total: order.totalAmount,
            items: order.items
          },
          orderStatus
        );
        console.log(`Status update email sent to ${user.email} for order ${order.tokenNumber}`);
      } catch (err) {
        console.error("Status email failed:", err.message);
      }
    }

    res.json({
      success: true,
      message: `Order marked as ${orderStatus}`,
      data: order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
