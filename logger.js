const path = require('path');
const winston = require('winston');
const { format } = winston;
const { combine, timestamp, errors, printf, colorize } = format;
const { StatsD } = require('hot-shots');

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

// File transport writing to /var/log/webapp/csye6225.service
const fileTransport = new winston.transports.File({
    filename: path.join('/var/log/webapp', 'csye6225.service'),
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
