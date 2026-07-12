const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true
    },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    timeSlot: {
      type: String,
      required: true // e.g. "12:00-13:00"
    },
    numberOfSeats: {
      type: Number,
      required: true,
      min: 1
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'confirmed'
    },
    confirmationCode: {
      type: String,
      unique: true,
      uppercase: true,
      index: true
    },
    sessionId: {
      type: String
    }
  },
  { timestamps: true }
);

// Auto-generate a unique 6-char alphanumeric confirmation code before save
reservationSchema.pre('save', function (next) {
  if (!this.confirmationCode) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.confirmationCode = code;
  }
  next();
});

module.exports = mongoose.model('Reservation', reservationSchema);
