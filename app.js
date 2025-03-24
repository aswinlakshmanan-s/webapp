const express = require('express');
const { initDB } = require('./models');
const healthRoutes = require('./routes/health');
const uploadRoutes = require('./routes/upload');
const logger = require('./logger');               // New: custom logger
const metricsMiddleware = require('./metricsMiddleware'); // Optional: metrics middleware

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize the database
initDB();

// Middleware for JSON body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// New: Apply metrics middleware to instrument API calls
app.use(metricsMiddleware);

// Routes
app.use('/v1/file', uploadRoutes);   // File upload route
app.use('/', healthRoutes);            // Health check route

// Start the server using the custom logger
const runApp = app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});

module.exports = runApp;
