const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const logger = require('./src/config/logger');
const { apiLimiter } = require('./src/middlewares/rateLimiter');
const { mongoSanitizeMiddleware, xssMiddleware } = require('./src/middlewares/sanitize');

// Swagger (optional)
let swaggerUi = null;
let swaggerFile = null;

try {
  swaggerUi = require('swagger-ui-express');
  const swaggerPath = path.join(__dirname, 'swagger-output.json');
  if (fs.existsSync(swaggerPath)) {
    swaggerFile = require(swaggerPath);
  }
} catch {
  // Ignore swagger loading errors
  // Swagger not available - continue without it
  swaggerUi = null;
  swaggerFile = null;
}

// Import routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const videoRoutes = require('./src/routes/videos');
const categoryRoutes = require('./src/routes/categories');
const badgeRoutes = require('./src/routes/badges');
const commentVideoRoutes = require('./src/routes/comments'); // Existing video comments
const postRoutes = require('./src/routes/post.routes'); // New forum posts
const commentPostRoutes = require('./src/routes/comment.routes'); // New forum comments
const uploadRoutes = require('./src/routes/upload.routes'); // File uploads
const errorHandler = require('./src/middlewares/error');

const app = express();

// Trust proxy (useful for rate-limit/proxies)
app.set('trust proxy', 1);

// Security Middlewares
// Helmet - Set security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// CORS - Dynamic whitelist from environment
const corsOptions = {
  origin: function (origin, callback) {
    const whitelist = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((url) => url.trim())
      : ['http://localhost:3000'];

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || whitelist.indexOf(origin) !== -1 || whitelist.includes('*')) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Rate limiting - Apply to all API routes (DISABLED FOR TESTING)
// app.use('/api', apiLimiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Data sanitization against NoSQL injection
app.use(mongoSanitizeMiddleware);

// Data sanitization against XSS
app.use(xssMiddleware);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Static: serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger UI (optional - only if swagger-output.json exists)
if (swaggerUi && swaggerFile) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/video-comments', commentVideoRoutes.standalone); // Video comment routes
app.use('/api/posts', postRoutes); // Forum posts
app.use('/api/post-comments', commentPostRoutes); // Forum post comments
app.use('/api/uploads', uploadRoutes); // File uploads

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'EcoLearn Loja API',
    version: '1.0.0',
    documentation: '/api-docs',
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    path: req.originalUrl,
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;

