const express = require('express');
const router = express.Router();
const { HealthCheck } = require('../models');
const { logger } = require('../logger');

router.get('/healthz', async (req, res) => {
    const correlationId = req.headers['x-correlation-id'] || 'N/A';
    try {
        logger.info("Health check request received", { correlationId });
        await HealthCheck.create({});
        logger.info("Health check record created", { correlationId });
        res.status(200).set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            'X-Content-Type-Options': 'nosniff'
        }).send();
    } catch (error) {
        logger.error("Health check error", { error, correlationId });
        res.status(503).set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            'X-Content-Type-Options': 'nosniff'
        }).send();
    }
});

router.all('/healthz', (req, res) => {
    const correlationId = req.headers['x-correlation-id'] || 'N/A';
    logger.warn("Unsupported method on /healthz", { method: req.method, correlationId });
    res.status(405).set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        'X-Content-Type-Options': 'nosniff'
    }).send();
});

router.all('*', (req, res) => {
    const correlationId = req.headers['x-correlation-id'] || 'N/A';
    logger.warn("Fallback: Unsupported request", { method: req.method, url: req.url, correlationId });
    res.status(404).set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        'X-Content-Type-Options': 'nosniff'
    }).send();
});

module.exports = router;
