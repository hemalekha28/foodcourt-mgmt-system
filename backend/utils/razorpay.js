const Razorpay = require('razorpay');

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('Razorpay credentials are missing. Please check your .env file');
  console.error('Current RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID || 'undefined');
  throw new Error('Razorpay credentials are missing');
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

module.exports = razorpay;