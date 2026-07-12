import { useState } from 'react';
import { loadScript } from '@razorpay/checkout';
import axios from 'axios';

const RazorpayPayment = ({ amount, onSuccess, onError, buttonText = 'Pay Now' }) => {
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = async () => {
    return loadScript('https://checkout.razorpay.com/v1/checkout.js');
  };

  const createOrder = async () => {
    try {
      const { data } = await axios.post('http://localhost:5000/api/payments/create-order', {
        amount: amount,
        currency: 'INR',
      });
      return data.order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const handlePayment = async () => {
    try {
      setLoading(true);
      
      // Load Razorpay script
      await loadRazorpayScript();
      
      // Create order on backend
      const order = await createOrder();

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Your Store Name',
        description: 'Payment for your order',
        order_id: order.id,
        handler: async function(response) {
          try {
            // Verify payment on your server
            await axios.post('http://localhost:5000/api/payments/verify-payment', {
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });
            
            onSuccess(response);
          } catch (error) {
            console.error('Payment verification failed:', error);
            onError('Payment verification failed');
          }
        },
        prefill: {
          name: 'Customer Name', // You can get this from user input
          email: 'customer@example.com', // You can get this from user input
          contact: '9999999999' // You can get this from user input
        },
        theme: {
          color: '#3399cc'
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on('payment.failed', function(response) {
        onError(`Payment failed: ${response.error.description}`);
      });
      
      paymentObject.open();
    } catch (error) {
      console.error('Payment error:', error);
      onError('Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handlePayment}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
    >
      {loading ? 'Processing...' : buttonText}
    </button>
  );
};

export default RazorpayPayment;
