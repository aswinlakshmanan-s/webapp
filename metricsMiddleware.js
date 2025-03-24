const statsd = require('./metrics');

function metricsMiddleware(req, res, next) {
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const endpoint = req.path.replace(/\//g, '_') || 'root';
        statsd.increment(`api${endpoint}.count`);
        statsd.timing(`api${endpoint}.timer`, duration);
    });
    next();
}

module.exports = metricsMiddleware;
