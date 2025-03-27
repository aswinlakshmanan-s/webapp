const statsd = require('./metrics');

// Define an array of mappings where each mapping has a regex pattern and a static metric name.
const metricMappings = [
    { pattern: /^\/healthz/, name: 'api_healthz' },
    { pattern: /^\/v1\/file/, name: 'api_file' },
    // Add more mappings as needed for other API groups.
];

function getMetricName(path) {
    // Check each mapping and return the static metric name for the first matching pattern.
    for (const mapping of metricMappings) {
        if (mapping.pattern.test(path)) {
            return mapping.name;
        }
    }
    // Fallback if no mapping matches.
    return 'api_unknown';
}

function metricsMiddleware(req, res, next) {
    const startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        // Use req.originalUrl if available to get the full path as requested.
        const metricName = getMetricName(req.originalUrl || req.path);
        statsd.increment(`${metricName}_count`);
        statsd.timing(`${metricName}_timer`, duration);
    });
    next();
}

module.exports = metricsMiddleware;
