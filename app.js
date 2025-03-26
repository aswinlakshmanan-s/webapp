require('dotenv').config({ path: '/opt/csye6225/webapp/.env' });
const express = require('express');
const { initDB } = require('./models');
const healthRoutes = require('./routes/health');
const uploadRoutes = require('./routes/upload');
const logger = require('./logger');
const metricsMiddleware = require('./metricsMiddleware');

const app = express();
const PORT = process.env.PORT || 8080;

logger.info("Starting application initialization...");

// Initialize the database
initDB();

// Middleware for parsing JSON and URL-encoded payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply metrics middleware to log API call metrics
app.use(metricsMiddleware);

// Define application routes
app.use('/v1/file', uploadRoutes); // File upload operations
app.use('/', healthRoutes);          // Health check operations

// Start the HTTP server and log the startup event
const server = app.listen(PORT, () => {
    logger.info(`Server started successfully and is listening on http://localhost:${PORT}`);
});

module.exports = { app, server };
