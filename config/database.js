const { Sequelize } = require('sequelize');
require('dotenv').config();
const logger = require('../logger');
const statsd = require('../metrics');

logger.info("DEBUG: Process ENV contains DB_PASSWORD?", { DB_PASSWORD: Boolean(process.env.DB_PASSWORD) });

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false  // Use with caution; in production, use proper CA certificates.
            }
        },
        logging: (msg, time) => {
            logger.info(msg);
            if (typeof time == 'number') {
                StatsD.timing('db.query.timer', time);
            }
        },
        benchmark: true,
    },
);

module.exports = sequelize;
