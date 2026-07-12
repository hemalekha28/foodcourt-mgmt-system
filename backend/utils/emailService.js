const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  try {
    // Check if SMTP configuration is provided
    if (process.env.SMTP_HOST) {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('SMTP_USER and SMTP_PASS are required when using SMTP_HOST');
      }

      console.log('Creating SMTP transporter with host:', process.env.SMTP_HOST);

      // Sanitize password (Gmail app passwords often come with spaces which should be removed)
      const sanitizedPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';

      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true' || false,
        auth: {
          user: process.env.SMTP_USER,
          pass: sanitizedPass
        },
        tls: {
          rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false'
        }
      });
    } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Fallback to service-based configuration (Gmail, etc.)
      console.log('Creating service-based email transporter');
      return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      throw new Error('No valid email configuration found. Please set up SMTP or service-based email settings.');
    }
  } catch (error) {
    console.error('Error creating email transporter:', error);
    throw error;
  }
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (userEmail, userName, orderDetails) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.MAIL_FROM || process.env.EMAIL_USER,
      to: userEmail,
      subject: `Order Confirmed - #${orderDetails.orderId} | Starlit & Co`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="background-color: #f1f5f9; padding: 20px; margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #edf2f7;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white;">
              <span style="font-size: 1.5rem; font-weight: bold; margin-bottom: 10px; display: block;">Starlit & Co</span>
              <h1 style="margin: 0; font-size: 26px; letter-spacing: 1px;">Order Confirmed!</h1>
              <p style="opacity: 0.9; margin-top: 10px; font-size: 16px;">Order ID: #${orderDetails.orderId}</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="font-size: 1.2rem; margin-bottom: 20px;">Hi <strong>${userName}</strong>,</p>
              <p style="color: #4a5568; line-height: 1.6; margin-bottom: 30px;">Your journey with <strong>Starlit & Co</strong> has officially begun! We've received your order and our team is already getting everything ready for you.</p>
              
              <!-- Billing Card -->
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; background: #ebf4ff; color: #3182ce; text-transform: uppercase; margin-bottom: 15px;">Billing Information</span>
                
                <h3 style="margin: 0 0 20px 0; color: #2d3748; font-size: 18px; border-bottom: 2px solid #f7fafc; padding-bottom: 10px;">Items Summary</h3>
                
                ${orderDetails.items.map(item => `
                  <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f3f5;">
                    <div style="max-width: 70%;">
                      <div style="font-weight: 600; color: #2d3748;">${item.name}</div>
                      <div style="font-size: 13px; color: #718096; margin-top: 4px;">Qty: ${item.quantity} × ₹${Number(item.price).toFixed(2)}</div>
                    </div>
                    <div style="font-weight: 700; color: #2d3748; white-space: nowrap;">₹${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                `).join('')}
                
                <div style="margin-top: 25px; padding-top: 20px; border-top: 2px solid #edf2f7; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 16px; font-weight: 600; color: #4a5568;">Grand Total</span>
                  <span style="font-size: 22px; font-weight: 800; color: #764ba2;">₹${Number(orderDetails.total).toFixed(2)}</span>
                </div>
              </div>
              
              <!-- Shipping Card -->
              <div style="background: #f8fafc; border-radius: 12px; padding: 25px; border: 1px solid #e2e8f0;">
                <h4 style="margin: 0 0 12px 0; color: #4a5568; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">Shipping Destination</h4>
                <p style="margin: 0; color: #4a5568; line-height: 1.6; font-size: 14px;">
                  <strong style="color: #2d3748;">${userName}</strong><br>
                  ${orderDetails.shippingAddress.address}<br>
                  ${orderDetails.shippingAddress.city}, ${orderDetails.shippingAddress.postalCode}<br>
                  ${orderDetails.shippingAddress.country}
                </p>
              </div>
              
              <div style="margin-top: 40px; text-align: center;">
                <p style="margin: 0; color: #718096; font-size: 14px;">
                  Questions about your order? Reply to this email or visit our <a href="#" style="color: #764ba2; text-decoration: none; font-weight: 600;">Support Center</a>.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding: 30px; font-size: 13px; color: #a0aec0; background: #f7fafc; border-top: 1px solid #edf2f7;">
              <p style="margin: 0 0 10px 0;">Thank you for shopping with <strong>Starlit & Co</strong>.</p>
              <div style="margin: 15px 0;">
                <a href="#" style="margin: 0 10px; text-decoration: none; color: #a0aec0;">Facebook</a>
                <a href="#" style="margin: 0 10px; text-decoration: none; color: #a0aec0;">Instagram</a>
                <a href="#" style="margin: 0 10px; text-decoration: none; color: #a0aec0;">Twitter</a>
              </div>
              <p style="margin: 10px 0 0 0;">© 2026 Starlit & Co. All rights reserved.</p>
              <p style="margin: 5px 0 0 0; font-size: 11px;">Annagar, Namakkal - 637213</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    console.log('Sending email...');
    const result = await transporter.sendMail(mailOptions);
    console.log('Nodemailer response:', result.response);
    console.log('Order confirmation email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('ERROR in sendOrderConfirmationEmail:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
};

// Send order status update email
const sendOrderStatusUpdateEmail = async (userEmail, userName, orderDetails, newStatus) => {
  try {
    const transporter = createTransporter();

    const statusMessages = {
      'Preparing': 'Your order is being prepared by our kitchen staff.',
      'Ready': 'Your order is ready for pickup at the food court.',
      'OutForDelivery': 'Your order is on its way to your classroom.',
      'Delivered': 'Your order has been delivered successfully.',
      'Cancelled': 'Your order has been cancelled.'
    };

    const statusColors = {
      'Preparing': '#f59e0b',
      'Ready': '#3b82f6',
      'OutForDelivery': '#8b5cf6',
      'Delivered': '#10b981',
      'Cancelled': '#ef4444'
    };

    const statusEmojis = {
      'Preparing': '👨‍🍳',
      'Ready': '✅',
      'OutForDelivery': '🚚',
      'Delivered': '🎉',
      'Cancelled': '❌'
    };

    const mailOptions = {
      from: process.env.MAIL_FROM || process.env.EMAIL_USER,
      to: userEmail,
      subject: `KEC Food Court - Order Status Update #${orderDetails.tokenNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="background-color: #f1f5f9; padding: 20px; margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #edf2f7;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px 20px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">KEC Food Court</h1>
              <p style="opacity: 0.9; margin: 10px 0 0 0; font-size: 16px;">Order Status Update</p>
            </div>
            
            <!-- Status Banner -->
            <div style="background-color: ${statusColors[newStatus] || '#64748b'}; color: white; padding: 25px; text-align: center; margin: 20px; border-radius: 12px;">
              <div style="font-size: 3rem; margin-bottom: 10px;">${statusEmojis[newStatus] || '🔔'}</div>
              <h2 style="margin: 0 0 10px 0; font-size: 22px;">Status Updated!</h2>
              <p style="margin: 0; font-size: 18px; font-weight: 600;">${newStatus.toUpperCase()}</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px;">
              <p style="font-size: 1.1rem; margin-bottom: 20px;">Hello <strong>${userName}</strong>,</p>
              <p style="color: #475569; line-height: 1.6; margin-bottom: 25px;">We're updating you on your order status. Here are the details:</p>
              
              <!-- Order Details Card -->
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Order Details</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                  <div>
                    <p style="margin: 8px 0; color: #64748b;"><strong>Token Number:</strong></p>
                    <p style="margin: 8px 0; color: #64748b;"><strong>Order ID:</strong></p>
                    <p style="margin: 8px 0; color: #64748b;"><strong>New Status:</strong></p>
                    <p style="margin: 8px 0; color: #64748b;"><strong>Total Amount:</strong></p>
                  </div>
                  <div>
                    <p style="margin: 8px 0; color: #1e293b; font-weight: 600;">${orderDetails.tokenNumber}</p>
                    <p style="margin: 8px 0; color: #1e293b; font-weight: 600;">#${orderDetails.orderId}</p>
                    <p style="margin: 8px 0;">
                      <span style="background-color: ${statusColors[newStatus] || '#64748b'}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                        ${newStatus}
                      </span>
                    </p>
                    <p style="margin: 8px 0; color: #1e293b; font-weight: 700; font-size: 18px;">₹${Number(orderDetails.total || 0).toFixed(2)}</p>
                  </div>
                </div>
                
                <div style="background: #e2e8f0; padding: 15px; border-radius: 8px; margin-top: 15px;">
                  <h4 style="color: #1e293b; margin: 0 0 10px 0; font-size: 15px;">What's Next:</h4>
                  <p style="margin: 0; color: #475569; line-height: 1.5;">${statusMessages[newStatus] || 'Your order status has been updated.'}</p>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding: 20px; background: #eff6ff; border-radius: 12px; border: 1px solid #dbeafe;">
                <p style="margin: 0; color: #1e40af; font-weight: 500;">
                  Have questions about your order? Contact our support team at the food court counter.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding: 25px; font-size: 13px; color: #94a3b8; background: #f1f5f9; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0;">Thank you for choosing KEC Food Court</p>
              <p style="margin: 5px 0 0 0; font-size: 11px;">Kongu Engineering College Food Court</p>
              <p style="margin: 5px 0 0 0; font-size: 11px;">Perundurai, Erode - 638060</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    console.log('Sending status update email...');
    const result = await transporter.sendMail(mailOptions);
    console.log('Status update email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('ERROR in sendOrderStatusUpdateEmail:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
};

module.exports = {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail
};
