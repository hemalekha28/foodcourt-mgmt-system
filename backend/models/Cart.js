// models/Cart.js
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  image: String,
  category: String,
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, { _id: false }); // Disable _id for subdocuments to avoid conflicts

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One cart per user
  },
  items: [cartItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add methods to calculate totals
cartSchema.methods.getTotal = function() {
  return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

cartSchema.methods.getItemCount = function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
};

module.exports = mongoose.model('Cart', cartSchema);