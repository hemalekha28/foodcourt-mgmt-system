const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  isVerifiedPurchase: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to ensure one review per user per product per order
reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);