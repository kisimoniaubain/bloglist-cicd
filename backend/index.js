require('dotenv').config();
const fs = require('fs');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const paymentRoutes = require('./routes/payment');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviews');
const couponRoutes = require('./routes/coupons');
const uploadRoutes = require('./routes/upload');
const contactRoutes = require('./routes/contact');
const wishlistRoutes = require('./routes/wishlist');

const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "img-src": ["'self'", 'data:', 'blob:', 'https:'],
      "media-src": ["'self'", 'data:', 'blob:', 'https:'],
      "connect-src": ["'self'", 'https:', 'wss:'],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100,
  message: 'Too many requests from this IP, please try again later.',
  skip: (req) => (
    req.path === '/api/health'
    || req.path === '/api/auth/login'
    || req.path === '/api/auth/register'
    || req.path === '/api/auth/forgot-password'
  ),
});
app.use('/api/', limiter);

const configuredOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (configuredOrigins.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV === 'development' && /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (configuredOrigins.includes(origin)) return callback(null, true);
      if (process.env.NODE_ENV === 'development' && /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  },
});

io.on('connection', (socket) => {
  socket.on('support:join', (userId) => {
    const safeUserId = String(userId || '').trim();
    if (!safeUserId) return;
    socket.join(`user:${safeUserId}`);
  });

  socket.on('support:join-admin', () => {
    socket.join('admin:support');
  });
});

app.set('io', io);

// Stripe webhook needs raw body
app.use('/api/payment/stripe/webhook', express.raw({ type: 'application/json' }));

// M-Pesa callback needs raw body for signature verification (optional but recommended)
app.use('/api/payment/mpesa/callback', express.raw({ type: 'application/json' }));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/wishlist', wishlistRoutes);

app.get('/api/storage/status', (req, res) => {
  const requiredEnv = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missingVars = requiredEnv.filter((name) => {
    const value = process.env[name];
    return !value || value.startsWith('your_');
  });

  const cloudinaryReady = missingVars.length === 0;

  res.json({
    success: true,
    provider: cloudinaryReady ? 'cloudinary' : 'local',
    activeMode: cloudinaryReady ? 'cloudinary' : 'local',
    ready: true,
    missingVars,
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Soldy.Shop API is running',
    dbConnected: Boolean(global.__DB_CONNECTED__),
    mode: process.env.NODE_ENV || 'development',
    timestamp: new Date(),
  });
});

const frontendDistCandidates = [
  path.resolve(__dirname, '../frontend/dist'),
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(__dirname, '../../client/dist'),
];

const frontendDistPath = frontendDistCandidates.find((candidate) => fs.existsSync(candidate));
const hasFrontendBuild = Boolean(frontendDistPath);

if (hasFrontendBuild) {
  console.log(`✅ Serving frontend build from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    return res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  console.warn('⚠️ Frontend build not found. Checked paths:', frontendDistCandidates);
  // Root route for quick browser checks when frontend is not built.
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Welcome to Soldy.Shop API',
      docs: '/api/health',
    });
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
  } catch (error) {
    global.__DB_CONNECTED__ = false;
    console.error(`⚠️ Database not connected: ${error.message}`);
  }

  server.listen(PORT, () => {
    console.log(`🚀 Soldy.Shop server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
};

startServer();
