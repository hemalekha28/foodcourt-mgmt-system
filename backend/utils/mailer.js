const nodemailer = require('nodemailer');

/* -------------------------------------------------- */
/* TRANSPORTER — reuses existing SMTP env vars        */
/* -------------------------------------------------- */
const createTransporter = () => {
  const sanitizedPass = process.env.SMTP_PASS
    ? process.env.SMTP_PASS.replace(/\s+/g, '')
    : '';

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: sanitizedPass
    },
    tls: { rejectUnauthorized: false }
  });
};

/* -------------------------------------------------- */
/* SEND RESERVATION CONFIRMATION EMAIL                */
/* -------------------------------------------------- */
const sendReservationConfirmationEmail = async (details) => {
  const {
    customerName,
    customerEmail,
    confirmationCode,
    tableNumber,
    capacity,
    location,
    date,
    timeSlot,
    numberOfSeats
  } = details;

  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: customerEmail,
      subject: `✅ Reservation Confirmed — Code: ${confirmationCode} | KEC Food Court`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="background-color:#f1f5f9;padding:20px;margin:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
          <div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);border:1px solid #edf2f7;">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px 20px;text-align:center;color:white;">
              <div style="font-size:3rem;margin-bottom:10px;">🍽️</div>
              <h1 style="margin:0;font-size:26px;letter-spacing:1px;">Table Reserved!</h1>
              <p style="opacity:0.9;margin-top:8px;font-size:15px;">KEC Food Court</p>
            </div>

            <!-- Confirmation Code Banner -->
            <div style="background:#ecfdf5;border:2px dashed #10b981;margin:24px;border-radius:12px;padding:20px;text-align:center;">
              <p style="margin:0 0 8px 0;color:#065f46;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Your Confirmation Code</p>
              <p style="margin:0;font-size:36px;font-weight:900;color:#059669;letter-spacing:6px;">${confirmationCode}</p>
              <p style="margin:8px 0 0 0;color:#6b7280;font-size:12px;">Keep this code to manage or cancel your reservation</p>
            </div>

            <!-- Booking Details -->
            <div style="padding:0 24px 24px;">
              <p style="font-size:1.1rem;margin-bottom:20px;">Hi <strong>${customerName}</strong>,</p>
              <p style="color:#4a5568;line-height:1.6;margin-bottom:24px;">Your table at <strong>KEC Food Court</strong> has been successfully reserved. Here are your booking details:</p>

              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:20px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">📅 Date</td>
                    <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-weight:700;color:#1e293b;text-align:right;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">⏰ Time Slot</td>
                    <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-weight:700;color:#1e293b;text-align:right;">${timeSlot}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">🪑 Table Number</td>
                    <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-weight:700;color:#1e293b;text-align:right;">Table ${tableNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">🏠 Location</td>
                    <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-weight:700;color:#1e293b;text-align:right;text-transform:capitalize;">${location}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;">👥 Seats Reserved</td>
                    <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-weight:700;color:#1e293b;text-align:right;">${numberOfSeats} of ${capacity}</td>
                  </tr>
                </table>
              </div>

              <div style="background:#eff6ff;border-radius:10px;padding:16px;border:1px solid #dbeafe;margin-bottom:20px;">
                <p style="margin:0;color:#1e40af;font-size:14px;line-height:1.5;">
                  <strong>To cancel your reservation</strong>, visit our reservation page and enter your confirmation code <strong>${confirmationCode}</strong>.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align:center;padding:24px;font-size:13px;color:#94a3b8;background:#f1f5f9;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 6px 0;">Thank you for choosing <strong>KEC Food Court</strong></p>
              <p style="margin:0;font-size:11px;">Kongu Engineering College, Perundurai, Erode - 638060</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Reservation confirmation email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Error sending reservation confirmation email:', error.message);
    throw error;
  }
};

/* -------------------------------------------------- */
/* SEND RESERVATION CANCELLATION EMAIL                */
/* -------------------------------------------------- */
const sendReservationCancellationEmail = async (details) => {
  const {
    customerName,
    customerEmail,
    confirmationCode,
    tableNumber,
    date,
    timeSlot
  } = details;

  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: customerEmail,
      subject: `❌ Reservation Cancelled — ${confirmationCode} | KEC Food Court`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="background-color:#f1f5f9;padding:20px;margin:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
          <div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1);border:1px solid #edf2f7;">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#ef4444 0%,#b91c1c 100%);padding:40px 20px;text-align:center;color:white;">
              <div style="font-size:3rem;margin-bottom:10px;">❌</div>
              <h1 style="margin:0;font-size:26px;letter-spacing:1px;">Reservation Cancelled</h1>
              <p style="opacity:0.9;margin-top:8px;font-size:15px;">KEC Food Court</p>
            </div>

            <!-- Content -->
            <div style="padding:30px 24px;">
              <p style="font-size:1.1rem;margin-bottom:16px;">Hi <strong>${customerName}</strong>,</p>
              <p style="color:#4a5568;line-height:1.6;margin-bottom:24px;">Your reservation has been successfully cancelled. Here are the details of the cancelled booking:</p>

              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin-bottom:20px;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #fecaca;color:#9ca3af;font-size:14px;">Confirmation Code</td>
                    <td style="padding:10px 0;border-bottom:1px solid #fecaca;font-weight:700;color:#dc2626;text-align:right;letter-spacing:3px;">${confirmationCode}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #fecaca;color:#9ca3af;font-size:14px;">Table</td>
                    <td style="padding:10px 0;border-bottom:1px solid #fecaca;font-weight:600;color:#374151;text-align:right;">Table ${tableNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #fecaca;color:#9ca3af;font-size:14px;">Date</td>
                    <td style="padding:10px 0;border-bottom:1px solid #fecaca;font-weight:600;color:#374151;text-align:right;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 0;color:#9ca3af;font-size:14px;">Time Slot</td>
                    <td style="padding:10px 0;font-weight:600;color:#374151;text-align:right;">${timeSlot}</td>
                  </tr>
                </table>
              </div>

              <p style="color:#6b7280;font-size:14px;line-height:1.6;">
                If you'd like to make a new reservation, please visit our reservation page. We hope to see you at KEC Food Court soon!
              </p>
            </div>

            <!-- Footer -->
            <div style="text-align:center;padding:24px;font-size:13px;color:#94a3b8;background:#f1f5f9;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 6px 0;"><strong>KEC Food Court</strong></p>
              <p style="margin:0;font-size:11px;">Kongu Engineering College, Perundurai, Erode - 638060</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Reservation cancellation email sent:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Error sending cancellation email:', error.message);
    throw error;
  }
};

module.exports = {
  sendReservationConfirmationEmail,
  sendReservationCancellationEmail
};
