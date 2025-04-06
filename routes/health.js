const express = require('express');
const router = express.Router();
const { HealthCheck } = require('../models');
const logger = require('../logger');

// Create a reusable handler function for health checks
const healthHandler = async (req, res) => {
    logger.info("Received GET request on health endpoint.", { headers: req.headers, query: req.query });

    if (req.headers['content-length'] && parseInt(req.headers['content-length'], 10) > 0) {
        logger.warn("Request on health endpoint contained an unexpected payload.");
        return res.status(400).set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            'X-Content-Type-Options': 'nosniff'
        }).send();
    }
    if (Object.keys(req.query).length > 0) {
        logger.warn("Request on health endpoint contained query parameters which are not permitted.");
        return res.status(400).set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            'X-Content-Type-Options': 'nosniff'
        }).end();
    }
    try {
        await HealthCheck.create({});
        logger.info("Health check record created successfully.");
        return res.status(200).set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            'X-Content-Type-Options': 'nosniff'
        }).send();
    } catch (error) {
        logger.error("An error occurred while creating a health check record.", { error: error.message, stack: error.stack });
        return res.status(503).set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            'X-Content-Type-Options': 'nosniff'
        }).send();
    }
};

// Existing /healthz endpoint using the reusable handler
router.get('/healthz', healthHandler);

// New /cicd endpoint using the same handler
router.get('/cicd', healthHandler);

router.all('/healthz', (req, res) => {
    logger.warn("Received unsupported HTTP method on /healthz.", { method: req.method });
    res.status(405).set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        'X-Content-Type-Options': 'nosniff'
    }).send();
});

router.all('*', (req, res) => {
    logger.warn("Request received for an unknown endpoint.", { endpoint: req.path });
    res.status(404).set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        'X-Content-Type-Options': 'nosniff'
    }).send();
});

module.exports = router;


