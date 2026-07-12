import { useState, useEffect } from 'react';
import { loadScript } from '@razorpay/checkout';

export default function RazorpayButton({ 
  amount, 
  currency = 'INR',
  onSuccess, 
  onError,
  buttonText = 'Pay Now',
  userEmail = '',
  userName = '',
  contact = ''
}) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    loadScript('https://checkout.razorpay.com/v1/checkout.js')
      .then(() => setScriptLoaded(true))
      .catch(err => {
        console.error('Razorpay SDK failed to load', err);
        onError('Failed to load payment gateway. Please try again later.');
      });
  }, []);

  const createOrder = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: currency,
          receipt: 'order_' + Math.random().toString(36).substring(2, 15)
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create order');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const handlePayment = async () => {
    if (!scriptLoaded) {
      onError('Payment gateway is still loading. Please try again in a moment.');
      return;
    }

    setLoading(true);
    
    try {
      const { order } = await createOrder();
      
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Your Store Name',
        description: 'Order Payment',
        order_id: order.id,
        handler: function (response) {
          onSuccess({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          });
        },
        prefill: {
          name: userName,
          email: userEmail,
          contact: contact
        },
        theme: {
          color: '#4F46E5'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', function(response) {
        onError(response.error.description || 'Payment failed. Please try again.');
        setLoading(false);
      });
      
      paymentObject.open();
    } catch (error) {
      console.error('Payment error:', error);
      onError(error.message || 'Failed to process payment');
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePayment}
      disabled={loading || !scriptLoaded}
      className="btn btn-primary"
      style={{
        width: '100%',
        padding: '0.75rem 1.5rem',
        fontSize: '1rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
      }}
    >
      {loading ? (
        <>
          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          Processing...
        </>
      ) : (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="currentColor"/>
          </svg>
          {buttonText}
        </>
      )}
    </button>
  );
}
