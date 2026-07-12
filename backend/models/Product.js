const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Food item name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  image: {
    type: String,
    required: [true, 'Image is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['breakfast', 'lunch', 'snacks', 'juices', 'north-indian', 'south-indian', 'beverages', 'desserts']
  },
  isVeg: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    required: [true, 'Available quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 99
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5'],
    default: 0
  },
  numReviews: {
    type: Number,
    default: 0
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
}, {
  timestamps: true
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);