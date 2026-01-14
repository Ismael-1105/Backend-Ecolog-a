const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Connect to MongoDB with enhanced error handling and monitoring
 */
const connectDB = async () => {
  try {
    // Connection options optimized for production
    const options = {
      maxPoolSize: process.env.NODE_ENV === 'production' ? 50 : 10, // Increased for production
      minPoolSize: 5, // Minimum connections to maintain
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Timeout for socket operations
      family: 4, // Use IPv4, skip trying IPv6
      maxIdleTimeMS: 30000, // Close idle connections after 30s
      compressors: 'zlib', // Enable compression for network traffic
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    logger.info('MongoDB connected successfully', {
      host: conn.connection.host,
      database: conn.connection.name,
      port: conn.connection.port,
      poolSize: options.maxPoolSize,
    });

    // Enable query logging in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', (collectionName, method, query, doc) => {
        logger.debug('MongoDB Query', {
          collection: collectionName,
          method,
          query: JSON.stringify(query),
        });
      });
    }

    // Monitor connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', {
        message: err.message,
        stack: err.stack,
      });
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
    });

    mongoose.connection.on('close', () => {
      logger.info('MongoDB connection closed');
    });

    // Monitor slow queries (> 100ms in production, > 500ms in development)
    const slowQueryThreshold = process.env.NODE_ENV === 'production' ? 100 : 500;

    mongoose.plugin((schema) => {
      schema.pre(/^find/, function () {
        this._startTime = Date.now();
      });

      schema.post(/^find/, function (result) {
        if (this._startTime) {
          const duration = Date.now() - this._startTime;
          if (duration > slowQueryThreshold) {
            logger.warn('Slow query detected', {
              model: this.model.modelName,
              duration: `${duration}ms`,
              query: this.getQuery(),
              options: this.getOptions(),
            });
          }
        }
      });
    });

    // Connection health check
    setInterval(async () => {
      try {
        await mongoose.connection.db.admin().ping();
        logger.debug('MongoDB health check: OK');
      } catch (error) {
        logger.error('MongoDB health check failed', {
          message: error.message,
        });
      }
    }, 60000); // Check every minute

    // Log connection pool stats periodically
    if (process.env.NODE_ENV === 'production') {
      setInterval(() => {
        const poolStats = {
          totalConnections: mongoose.connection.client.topology?.s?.pool?.totalConnectionCount || 0,
          availableConnections: mongoose.connection.client.topology?.s?.pool?.availableConnectionCount || 0,
          pendingRequests: mongoose.connection.client.topology?.s?.pool?.waitQueueSize || 0,
        };

        logger.info('MongoDB connection pool stats', poolStats);
      }, 300000); // Log every 5 minutes
    }

  } catch (error) {
    logger.error('MongoDB connection failed:', {
      message: error.message,
      stack: error.stack,
      uri: process.env.MONGODB_URI ? 'URI provided' : 'URI missing',
    });

    // Exit process with failure
    process.exit(1);
  }
};

/**
 * Graceful shutdown
 */
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed gracefully');
  } catch (error) {
    logger.error('Error closing MongoDB connection', {
      message: error.message,
    });
  }
};

/**
 * Get database health status
 */
const getDBHealth = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    status: states[state] || 'unknown',
    database: mongoose.connection.name,
    host: mongoose.connection.host,
    port: mongoose.connection.port,
  };
};

module.exports = {
  connectDB,
  closeDB,
  getDBHealth
};
