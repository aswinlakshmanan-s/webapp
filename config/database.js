const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '/opt/csye6225/webapp/.env' });
const logger = require('../logger');
const statsd = require('../metrics');

logger.info("Verifying environment: DB_PASSWORD is set.", { DB_PASSWORD: Boolean(process.env.DB_PASSWORD) });

const useSSL = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        dialectOptions: useSSL ? {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        } : {},
        logging: (msg, time) => {
            logger.info(`Sequelize Query Executed: ${msg}`);
            if (typeof time === 'number') {
                statsd.timing('db.query.timer', time);
            }
        },
        benchmark: true,
    },
);

// Log successful connection attempt
sequelize.authenticate()
    .then(() => logger.info("Database connection established successfully."))
    .catch((error) => logger.error("Database connection failed.", { error: error.message, stack: error.stack }));

module.exports = sequelize;
