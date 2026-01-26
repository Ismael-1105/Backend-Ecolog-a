const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`;

        // Add stack trace for errors
        if (stack) {
            log += `\n${stack}`;
        }

        // Add metadata if present
        if (Object.keys(meta).length > 0) {
            log += `\n${JSON.stringify(meta, null, 2)}`;
        }

        return log;
    })
);

// Define log directory
const logDir = process.env.LOG_FILE_PATH || './logs';

// Create transports array
const transports = [];

// Console transport (always active)
transports.push(
    new winston.transports.Console({
        format: consoleFormat,
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    })
);

// File transports (only in production or if explicitly enabled)
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true') {
    // Error log file (errors only)
    transports.push(
        new DailyRotateFile({
            filename: path.join(logDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            format: logFormat,
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true,
        })
    );

    // Warning log file (warnings only)
    transports.push(
        new DailyRotateFile({
            filename: path.join(logDir, 'warn-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'warn',
            format: winston.format.combine(
                winston.format((info) => (info.level === 'warn' ? info : false))(),
                logFormat
            ),
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true,
        })
    );

    // Info log file (info and above, excluding http)
    transports.push(
        new DailyRotateFile({
            filename: path.join(logDir, 'info-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'info',
            format: winston.format.combine(
                winston.format((info) => (info.level !== 'http' ? info : false))(),
                logFormat
            ),
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true,
        })
    );

    // HTTP log file (HTTP requests only)
    transports.push(
        new DailyRotateFile({
            filename: path.join(logDir, 'http-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'http',
            format: winston.format.combine(
                winston.format((info) => (info.level === 'http' ? info : false))(),
                logFormat
            ),
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true,
        })
    );

    // Combined log file (all logs)
    transports.push(
        new DailyRotateFile({
            filename: path.join(logDir, 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            format: logFormat,
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true,
        })
    );
}

// Create logger instance
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4,
    },
    format: logFormat,
    transports,
    exitOnError: false,
});

// Create a stream object for Morgan HTTP logger integration
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    },
};

module.exports = logger;
