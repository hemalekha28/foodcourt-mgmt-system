const Razorpay = require('razorpay');

/**
 * Returns a Razorpay instance, lazily initialized.
 * Throws a descriptive error at call-time (not at module load) so that
 * the server starts successfully even when Razorpay keys are not set,
 * and payment routes simply return 503 when called without credentials.
 */
let _instance = null;

const getRazorpay = () => {
  if (_instance) return _instance;

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error(
      'Razorpay credentials are missing. ' +
      'Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.'
    );
  }

  _instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  return _instance;
};

module.exports = getRazorpay;