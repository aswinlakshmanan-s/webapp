const fs = require('fs');
const path = require('path');
const winston = require('winston');
const { format } = winston;
const { combine, timestamp, errors, printf, colorize } = format;
const { StatsD } = require('hot-shots');

// Determine the log directory using LOG_DIR env variable, defaulting to '/var/log/webapp'
let logDir = process.env.LOG_DIR || '/var/log/webapp';

// Check if the log directory exists; if not, use a fallback directory that we can create
if (!fs.existsSync(logDir)) {
    console.warn(`Log directory ${logDir} does not exist. Using fallback directory './logs'.`);
    logDir = path.join(process.cwd(), 'logs'); // Fallback to a local directory
    if (!fs.existsSync(logDir)) {
        // Create fallback directory if it doesn't exist
        fs.mkdirSync(logDir, { recursive: true });
    }
}

// Configure StatsD (customize host/port if needed)
const statsd = new StatsD({
    host: process.env.STATSD_HOST || 'localhost',
    port: process.env.STATSD_PORT || 8125,
});

// Custom log format with details
const customFormat = printf(({ timestamp, level, message, stack, ...meta }) => {
    const env = process.env.NODE_ENV || 'development';
    return `${timestamp} [${env.toUpperCase()}] ${level.toUpperCase()}: ${message}${stack ? `\nStack: ${stack}` : ''}${Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''}`;
});

// File transport writing to the determined log file path
const fileTransport = new winston.transports.File({
    filename: path.join(logDir, 'csye6225.service'),
    level: 'info',
    format: combine(timestamp(), customFormat)
});

const logger = winston.createLogger({
    level: 'info',
    format: combine(timestamp(), errors({ stack: true }), customFormat),
    transports: [
        new winston.transports.Console({
            format: combine(colorize(), timestamp(), customFormat)
        }),
        fileTransport
    ]
});

module.exports = { logger, statsd };
