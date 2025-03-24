const StatsD = require('node-statsd');

let client;
if (process.env.NODE_ENV === 'test') {
    // No-op client for tests to avoid open sockets and unnecessary network calls.
    client = {
        increment: () => { },
        timing: () => { },
    };
} else {
    client = new StatsD(); // Defaults to localhost:8125
}

module.exports = client;
