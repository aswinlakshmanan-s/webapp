const StatsD = require('node-statsd');
const client = new StatsD(); // Defaults to localhost:8125
module.exports = client;
