const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

// Swagger (optional)
let swaggerUi = null;
let swaggerFile = null;

try {
  swaggerUi = require('swagger-ui-express');
  const swaggerPath = path.join(__dirname, 'swagger-output.json');
  if (fs.existsSync(swaggerPath)) {
    swaggerFile = require(swaggerPath);
  }
} catch (error) {
  // Swagger not available - continue without it
  swaggerUi = null;
  swaggerFile = null;
}

// Import routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const videoRoutes = require('./src/routes/videos');
const errorHandler = require('./src/middlewares/error');

const app = express();

// Trust proxy (useful for rate-limit/proxies)
app.set('trust proxy', 1);

// Middlewares
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true,
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

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

// Root endpoint
app.get('/', (req, res) => {
  res.send('EcoLearn Loja API');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
