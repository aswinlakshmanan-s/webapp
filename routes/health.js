const express = require('express');
const router = express.Router();
const { HealthCheck } = require('../models');
const { logger } = require('../logger');

router.get('/healthz', async (req, res) => {
    // Check for non-empty request body (unusual for GET, but test expects 400)
    if (req.body && Object.keys(req.body).length > 0) {
        logger.warn("GET /healthz received with body data", { body: req.body });
        return res.status(400).set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'X-Content-Type-Options': 'nosniff'
        }).send();
    }
    // Check for query parameters
    if (req.query && Object.keys(req.query).length > 0) {
        logger.warn("GET /healthz received with query parameters", { query: req.query });
        return res.status(400).set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'X-Content-Type-Options': 'nosniff'
        }).send();
    }
    // Check if the Content-Length header is set and greater than zero
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > 0) {
        logger.warn("GET /healthz received with non-zero Content-Length header", { contentLength: req.headers['content-length'] });
        return res.status(400).set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'X-Content-Type-Options': 'nosniff'
        }).send();
    }

    try {
        logger.info("Health check request received");
        // Insert a health check record into the database
        await HealthCheck.create({});
        logger.info("Health check record created successfully");
        res.status(200).set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'X-Content-Type-Options': 'nosniff'
        }).send();
    } catch (error) {
        logger.error("Health check error:", error);
        res.status(503).set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'X-Content-Type-Options': 'nosniff'
        }).send();
    }
});

// Handle unsupported methods on /healthz
router.all('/healthz', (req, res) => {
    logger.warn("Unsupported method on /healthz", { method: req.method });
    res.status(405).set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
    }).send();
});

// Fallback for unknown routes
router.all('*', (req, res) => {
    logger.warn("Route not found", { method: req.method, url: req.url });
    res.status(404).set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'X-Content-Type-Options': 'nosniff'
    }).send();
});

module.exports = router;
