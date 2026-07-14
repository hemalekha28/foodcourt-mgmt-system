const path = require('path');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server: SocketServer } = require('socket.io');

/* -------------------------------------------------- */
/* LOAD ENV VARS (LOCAL DEV ONLY — Render uses dashboard env vars) */
/* -------------------------------------------------- */
if (process.env.NODE_ENV !== 'production') {
  const envPath = path.resolve(__dirname, '.env');
  console.log('Loading .env from:', envPath);

  const envConfig = dotenv.config({ path: envPath });
  if (envConfig.error) {
    console.warn('⚠️  No local .env file found — continuing with process.env as-is');
  } else {
    console.log('✅ .env loaded successfully');
  }
} else {
  console.log('ℹ️  Production mode — using environment variables from host (not .env file)');
}

console.log(
  'RAZORPAY_KEY_ID:',
  process.env.RAZORPAY_KEY_ID ? 'Found' : 'Not found'
);

/* -------------------------------------------------- */
/* FAIL FAST ON MISSING REQUIRED ENV VARS */
/* -------------------------------------------------- */
const requiredEnvVars = ['MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  console.error(
    `❌ Missing required environment variable(s): ${missingEnvVars.join(', ')}`
  );
  console.error(
    'Set these in Render Dashboard → your service → Environment tab.'
  );
  process.exit(1);
}

/* -------------------------------------------------- */
/* INITIALIZE EXPRESS APP (THIS MUST COME EARLY) */
/* -------------------------------------------------- */
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

/* -------------------------------------------------- */
/* SOCKET.IO SETUP                                    */
/* -------------------------------------------------- */
const io = new SocketServer(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:5173'
    ],
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Attach io to app.locals so controllers can access it via req.app.locals.io
app.locals.io = io;

/* -------------------------------------------------- */
/* MIDDLEWARES */
/* -------------------------------------------------- */
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5173'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* -------------------------------------------------- */
/* IMPORT ROUTES */
/* -------------------------------------------------- */
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const cartRoutes = require('./routes/cart');
const analyticsRoutes = require('./routes/analytics');
const reservationAnalyticsRoutes = require('./routes/analytics.routes');
const chatbotRoutes = require('./routes/chatbot');
const reviewRoutes = require('./routes/reviews');
const paymentRoutes = require('./routes/payment.routes');
const queueRoutes = require('./routes/queueRoutes');
const reservationRoutes = require('./routes/reservation.routes');
const errorHandler = require('./middlewares/error');

/* -------------------------------------------------- */
/* ROUTES */
/* -------------------------------------------------- */
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/analytics', reservationAnalyticsRoutes); // Mount first to check specific routes like /by-day
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/reservations', reservationRoutes);

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/', (req, res) => {
  res.send('✅ API is running...');
});

/* -------------------------------------------------- */
/* ERROR HANDLER (MUST BE LAST) */
/* -------------------------------------------------- */
app.use(errorHandler);

/* -------------------------------------------------- */
/* DATABASE + SERVER START */
/* -------------------------------------------------- */
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000 // fail fast instead of hanging silently
  })
  .then(() => {
    console.log('✅ MongoDB Connected');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log('Environment summary:', {
        NODE_ENV: process.env.NODE_ENV,
        RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ? 'Found' : 'Not found',
        RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET
          ? '****' + process.env.RAZORPAY_KEY_SECRET.slice(-4)
          : 'Not found'
      });
    });
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

/* -------------------------------------------------- */
/* GLOBAL SAFETY NETS (optional but recommended) */
/* -------------------------------------------------- */
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});