const fs = require('fs');
const path = require('path');
const winston = require('winston');
const { format } = winston;
const { combine, timestamp, errors, printf, colorize } = format;
const { StatsD } = require('hot-shots');

// Use an environment variable or default to /var/log/webapp
const logDir = process.env.LOG_DIR || '/var/log/webapp';
if (!fs.existsSync(logDir)) {
    try {
        fs.mkdirSync(logDir, { recursive: true });
    } catch (error) {
        console.error(`Could not create log directory ${logDir}:`, error);
    }
}

const statsd = new StatsD({
    host: process.env.STATSD_HOST || 'localhost',
    port: process.env.STATSD_PORT || 8125,
});

const customFormat = printf(({ timestamp, level, message, stack, ...meta }) => {
    const env = process.env.NODE_ENV || 'development';
    return `${timestamp} [${env.toUpperCase()}] ${level.toUpperCase()}: ${message}${stack ? `\nStack: ${stack}` : ''}${Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''}`;
});

const fileTransport = new winston.transports.File({
    filename: path.join(logDir, 'app.log'),
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
