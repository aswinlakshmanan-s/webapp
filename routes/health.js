const express = require('express');
const router = express.Router();
const { HealthCheck } = require('../models');
const logger = require('../logger');

// Handle GET requests to /healthz
router.get('/healthz', async (req, res) => {
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > 0) {
        logger.warn("Received request with payload on /healthz");
        return res.status(400).set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            'X-Content-Type-Options': 'nosniff',
        }).send();
    }
    if (Object.keys(req.query).length > 0) {
        logger.warn("Received query parameters on /healthz");
        return res.status(400).set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            'X-Content-Type-Options': 'nosniff',
        }).end();
    }
    try {
        await HealthCheck.create({});
        logger.info("Health check recorded successfully");
        res.status(200).set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            'X-Content-Type-Options': 'nosniff',
        }).send();
    } catch (error) {
        logger.error("Health check error", error);
        res.status(503).set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            'X-Content-Type-Options': 'nosniff',
        }).send();
    }
});

router.all('/healthz', (req, res) => {
    logger.warn("Unsupported method on /healthz");
    res.status(405).set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        'X-Content-Type-Options': 'nosniff',
    }).send();
});

router.all('*', (req, res) => {
    logger.warn("Request for unknown endpoint", { endpoint: req.path });
    res.status(404).set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        'X-Content-Type-Options': 'nosniff',
    }).send();
});
module.exports = router;

