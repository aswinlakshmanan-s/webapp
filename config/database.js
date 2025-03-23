const { Sequelize } = require('sequelize');
const { logger, statsd } = require('../logger');
require('dotenv').config();

logger.info("DEBUG: Process ENV contains DB_PASSWORD?", Boolean(process.env.DB_PASSWORD));

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
                rejectUnauthorized: false
            }
        },
        logging: (msg, queryTime) => {
            logger.info(msg);
            if (queryTime) {
                statsd.timing('db.query.duration', queryTime);
            }
        },
        benchmark: true,
    }
);

module.exports = sequelize;
