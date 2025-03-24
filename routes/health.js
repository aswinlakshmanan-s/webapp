const express = require('express');
const router = express.Router();
const { HealthCheck } = require('../models');

// Handle GET requests to /healthz
router.get('/healthz', async (req, res) => {
    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > 0) {
        return res.status(400).set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            'X-Content-Type-Options': 'nosniff',
        }).send(); // 400 Bad Request
    }
    if (Object.keys(req.query).length > 0) {
        return res.status(400).set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            'X-Content-Type-Options': 'nosniff',
        }).end(); // No response body
    }
    try {
        // Insert a health check record into the database
        await HealthCheck.create({});
        res.status(200).set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            'X-Content-Type-Options': 'nosniff',
        }).send(); // 200 OK
    } catch (error) {
        console.error('Health check error:', error);
        res.status(503).set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            'X-Content-Type-Options': 'nosniff',
        }).send(); // 503 Service Unavailable
    }
});

// Handle other HTTP methods on /healthz
router.all('/healthz', (req, res) => {
    res.status(405).set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        'X-Content-Type-Options': 'nosniff',
    }).send(); // 405 Method Not Allowed
});

// Handle other HTTP methods on /healthz
router.all('*', (req, res) => {
    res.status(404).set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        'X-Content-Type-Options': 'nosniff',
    }).send(); // 405 Method Not Allowed
});
module.exports = router;



