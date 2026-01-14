const logger = require('../config/logger');

/**
 * Performance Monitoring Middleware
 * Tracks response times, memory usage, and logs slow queries
 */

/**
 * Track request performance
 */
const performanceMonitor = (req, res, next) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();

    // Store original end function
    const originalEnd = res.end;

    // Override end function to capture metrics
    res.end = function (...args) {
        // Calculate duration
        const duration = Date.now() - startTime;
        const endMemory = process.memoryUsage();

        // Calculate memory delta
        const memoryDelta = {
            heapUsed: endMemory.heapUsed - startMemory.heapUsed,
            external: endMemory.external - startMemory.external
        };

        // Log performance metrics
        const metrics = {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            memoryDelta: {
                heapUsed: `${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB`,
                external: `${(memoryDelta.external / 1024 / 1024).toFixed(2)}MB`
            },
            ip: req.ip,
            userAgent: req.get('user-agent')
        };

        // Log slow requests (> 1000ms)
        if (duration > 1000) {
            logger.warn('Slow request detected', {
                ...metrics,
                query: req.query,
                params: req.params
            });
        } else if (duration > 500) {
            // Log moderately slow requests
            logger.info('Moderate request duration', metrics);
        } else {
            // Log normal requests in debug mode
            logger.debug('Request completed', metrics);
        }

        // Add performance headers
        res.setHeader('X-Response-Time', `${duration}ms`);
        res.setHeader('X-Memory-Delta', `${(memoryDelta.heapUsed / 1024 / 1024).toFixed(2)}MB`);

        // Call original end function
        originalEnd.apply(res, args);
    };

    next();
};

/**
 * Memory usage monitor
 */
const memoryMonitor = (req, res, next) => {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memoryUsage.heapTotal / 1024 / 1024;
    const heapPercentage = (heapUsedMB / heapTotalMB) * 100;

    // Warn if memory usage is high (> 80%)
    if (heapPercentage > 80) {
        logger.warn('High memory usage detected', {
            heapUsed: `${heapUsedMB.toFixed(2)}MB`,
            heapTotal: `${heapTotalMB.toFixed(2)}MB`,
            percentage: `${heapPercentage.toFixed(2)}%`,
            path: req.path
        });
    }

    // Add memory usage header
    res.setHeader('X-Memory-Usage', `${heapUsedMB.toFixed(2)}MB`);

    next();
};

/**
 * Database query performance tracker
 */
const queryPerformanceTracker = () => {
    const mongoose = require('mongoose');

    // Track slow queries
    mongoose.set('debug', (collectionName, method, query, doc, options) => {
        const startTime = Date.now();

        // Log query execution
        logger.debug('MongoDB Query', {
            collection: collectionName,
            method,
            query: JSON.stringify(query),
            options: JSON.stringify(options)
        });

        // Note: This is a simplified version. In production, you'd want to use
        // mongoose query hooks or a more sophisticated monitoring solution
    });
};

/**
 * Request rate tracker (for analytics)
 */
const requestRateTracker = (() => {
    const requestCounts = new Map();
    const windowSize = 60000; // 1 minute window

    return (req, res, next) => {
        const endpoint = `${req.method} ${req.path}`;
        const now = Date.now();

        // Get or create endpoint stats
        if (!requestCounts.has(endpoint)) {
            requestCounts.set(endpoint, []);
        }

        const timestamps = requestCounts.get(endpoint);

        // Remove old timestamps outside the window
        const recentTimestamps = timestamps.filter(ts => now - ts < windowSize);
        recentTimestamps.push(now);

        requestCounts.set(endpoint, recentTimestamps);

        // Calculate requests per minute
        const requestsPerMinute = recentTimestamps.length;

        // Log high traffic endpoints
        if (requestsPerMinute > 100) {
            logger.info('High traffic endpoint', {
                endpoint,
                requestsPerMinute,
                window: `${windowSize / 1000}s`
            });
        }

        // Add rate header
        res.setHeader('X-Request-Rate', `${requestsPerMinute}/min`);

        next();
    };
})();

/**
 * Health check metrics
 */
const getHealthMetrics = () => {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: {
            seconds: uptime,
            formatted: formatUptime(uptime)
        },
        memory: {
            heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
            heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
            external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)}MB`,
            rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`
        },
        process: {
            pid: process.pid,
            version: process.version,
            platform: process.platform
        }
    };
};

/**
 * Format uptime in human-readable format
 */
const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);

    return parts.join(' ') || '0s';
};

/**
 * Alert on performance degradation
 */
const performanceAlert = (threshold = 2000) => {
    return (req, res, next) => {
        const startTime = Date.now();

        res.on('finish', () => {
            const duration = Date.now() - startTime;

            if (duration > threshold) {
                logger.error('Performance degradation detected', {
                    method: req.method,
                    path: req.path,
                    duration: `${duration}ms`,
                    threshold: `${threshold}ms`,
                    query: req.query,
                    params: req.params,
                    ip: req.ip
                });

                // In production, you might want to send alerts to monitoring services
                // like Sentry, DataDog, New Relic, etc.
            }
        });

        next();
    };
};

module.exports = {
    performanceMonitor,
    memoryMonitor,
    queryPerformanceTracker,
    requestRateTracker,
    getHealthMetrics,
    performanceAlert
};
