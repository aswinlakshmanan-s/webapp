const { Sequelize } = require('sequelize');
require('dotenv').config();
console.log("DEBUG: Process ENV contains DB_PASSWORD?", Boolean(process.env.DB_PASSWORD));

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
        logging: false,
    },
);

module.exports = sequelize;
