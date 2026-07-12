const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: Number,
      required: true,
      unique: true
    },
    capacity: {
      type: Number,
      enum: [2, 4, 6, 8],
      required: true
    },
    location: {
      type: String,
      enum: ['indoor', 'outdoor'],
      default: 'indoor'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    currentStatus: {
      type: String,
      enum: ['available', 'reserved', 'occupied'],
      default: 'available'
    },
    lockedUntil: {
      type: Date,
      default: null,
      index: { expireAfterSeconds: 0 } // TTL index for automatic lock expiration
    },
    lockedBy: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Table', tableSchema);
