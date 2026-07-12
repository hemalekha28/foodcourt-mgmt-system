const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ✅ Order items
  items: [
    {
      foodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      foodName: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      }
    }
  ],

  // ✅ TOTAL ORDER FIELDS (NOT inside items)
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },

  // 🧠 ETA — ORDER LEVEL
  estimatedWait: {
    type: Number,
    default: 0
  },

  // 🍽️ ALTERNATE FOOD — ORDER LEVEL
  alternateFood: {
    name: String,
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }
  },

  orderStatus: {
    type: String,
    enum: ['Preparing', 'Ready', 'OutForDelivery', 'Delivered', 'Cancelled'],
    default: 'Preparing'
  },

  deliveryType: {
    type: String,
    enum: ['FoodCourt', 'Classroom'],
    default: 'FoodCourt'
  },

  deliveryDetails: {
    tableNumber: String,
    classroomInfo: String,
    department: String,
    block: String
  },

  paymentMethod: {
    type: String,
    enum: ['CASH', 'ONLINE', 'WALLETPAY'],
    default: 'CASH'
  },

  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },

  tokenNumber: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// 🔢 Auto-generate token number
orderSchema.pre('save', function (next) {
  if (!this.tokenNumber) {
    this.tokenNumber = 'KEC-' + Math.floor(1000 + Math.random() * 9000);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
