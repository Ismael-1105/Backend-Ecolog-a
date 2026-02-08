const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const logger = require('./src/config/logger');
const { requestIdMiddleware, httpLogger, httpLoggerWithErrors } = require('./src/middlewares/httpLogger');
const { apiLimiter } = require('./src/middlewares/rateLimiter');
const { mongoSanitizeMiddleware, xssMiddleware } = require('./src/middlewares/sanitize');
const { performanceMonitor, memoryMonitor } = require('./src/middlewares/performanceMonitor');

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
// Helmet - Minimal configuration for HTTP compatibility
// Note: Most security headers disabled for HTTP deployment on VPS
// Enable stricter policies when using HTTPS with reverse proxy
app.use(
  helmet({
    // Allow cross-origin resource loading
    crossOriginResourcePolicy: { policy: 'cross-origin' },

    // Disable all headers that can cause HTTPS upgrade issues
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    originAgentCluster: false,
    hsts: false,
    noSniff: false,
    referrerPolicy: false,
  })
);

// ============================================================================
// CORS Configuration - Production Ready
// ============================================================================
// This configuration handles:
// 1. Cross-origin requests from allowed origins
// 2. Preflight OPTIONS requests
// 3. JWT tokens in Authorization header
// 4. Cookies and credentials
// 5. Local network access (192.168.x.x)
// ============================================================================

const corsOptions = {
  // Origin validation function
  origin: function (origin, callback) {
    // Default whitelist for development (localhost + local network)
    const defaultWhitelist = [
      // Production domains - HTTPS only
      'https://ecolearning.online',
      'https://frontend-ecologia.vercel.app',
      // Development - Localhost variants
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      // Local network IPs (add your specific IPs here)
      'http://192.168.0.112:3000',
      'http://192.168.0.112:5173',
      'http://192.168.0.112:5174',
      'http://192.168.0.100:3000', // Backend server IP
      'http://192.168.0.100:5173'
    ];

    // Use environment variable if set, otherwise use default whitelist
    const whitelist = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((url) => url.trim())
      : defaultWhitelist;

    // Log for debugging (only in development, skip health checks)
    if (process.env.NODE_ENV !== 'production' && !origin?.includes('/health')) {
      logger.info('CORS check', { origin, whitelist });
    }

    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in whitelist
    if (whitelist.indexOf(origin) !== -1 || whitelist.includes('*')) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', {
        origin,
        whitelist,
        message: 'Origin not in whitelist'
      });
      callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
    }
  },

  // Allow credentials (cookies, authorization headers, TLS client certificates)
  credentials: true,

  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  // Allowed headers (IMPORTANT: include Authorization for JWT)
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],

  // Exposed headers (headers that browser can access)
  exposedHeaders: [
    'Content-Length',
    'Content-Type',
    'Authorization'
  ],

  // Preflight cache duration (in seconds)
  // Browser will cache preflight response for this duration
  maxAge: 86400, // 24 hours

  // Pass the CORS preflight response to the next handler
  preflightContinue: false,

  // Provide a status code to use for successful OPTIONS requests
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// ============================================================================
// Explicit OPTIONS handler for preflight requests
// ============================================================================
// Some browsers/networks require explicit OPTIONS handling
// This ensures preflight requests are handled correctly
// Note: Using regex /.*/ instead of '*' for compatibility with Express 5.x and path-to-regexp v8+
app.options(/.*/, cors(corsOptions));

// Log CORS configuration on startup
logger.info('CORS configured', {
  environment: process.env.NODE_ENV,
  allowedOrigins: process.env.CORS_ORIGIN || 'default whitelist',
  credentialsEnabled: true
});

// Compression middleware
app.use(compression());

// ============================================================================
// HTTP Request Logging
// ============================================================================
// Add request ID to all requests for tracing
app.use(requestIdMiddleware);

// Log all HTTP requests with Morgan + Winston
if (process.env.ENABLE_HTTP_LOGGING !== 'false') {
  app.use(httpLogger);
  app.use(httpLoggerWithErrors);
  logger.info('HTTP request logging enabled');
} else {
  logger.warn('HTTP request logging disabled');
}

// Rate limiting - Apply to all API routes
if (process.env.NODE_ENV === 'production') {
  app.use('/api', apiLimiter);
  logger.info('Rate limiting enabled for production');
} else {
  logger.warn('Rate limiting disabled for development');
}

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Data sanitization against NoSQL injection
app.use(mongoSanitizeMiddleware);

// Data sanitization against XSS
app.use(xssMiddleware);

// Performance monitoring (track all requests)
if (process.env.NODE_ENV === 'production') {
  app.use(performanceMonitor);
  app.use(memoryMonitor);
  logger.info('Performance monitoring enabled for production');
}

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

// Health check endpoint (also available at /api/health for external monitoring)
app.get('/api/health', (req, res) => {
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

