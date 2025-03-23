const express = require('express');
const { initDB } = require('./models');
const healthRoutes = require('./routes/health');
const uploadRoutes = require('./routes/upload');
const { logger, statsd } = require('./logger');

const app = express();
const PORT = process.env.PORT || 8080;

logger.info("Application startup initiated.");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Metrics & Logging Middleware
app.use((req, res, next) => {
    // Use a correlation ID from header or generate one
    const correlationId = req.headers['x-correlation-id'] || Math.random().toString(36).substring(2, 15);
    req.correlationId = correlationId;
    logger.info("Incoming request", { method: req.method, url: req.url, ip: req.ip, correlationId });
    const startTime = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.info("Completed request", { method: req.method, url: req.url, status: res.statusCode, duration, correlationId });
        statsd.increment(`api.${req.method.toLowerCase()}.call_count`, 1, { correlationId });
        statsd.timing(`api.${req.method.toLowerCase()}.duration`, duration, { correlationId });
    });
    next();
});

// Initialize database and log results
initDB()
    .then(() => {
        logger.info("Database initialized successfully.");
    })
    .catch((error) => {
        logger.error("Database initialization error", { error, correlationId: "N/A" });
    });

app.use('/v1/file', uploadRoutes);
app.use('/', healthRoutes);

// Global error handler
app.use((err, req, res, next) => {
    const correlationId = req.correlationId || 'N/A';
    logger.error("Unhandled error", { error: err, correlationId });
    res.status(500).json({ message: "Internal Server Error", correlationId });
});

const runApp = app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});

module.exports = runApp;
