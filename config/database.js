const { Sequelize } = require('sequelize');
require('dotenv').config();

const password = process.env.DB_PASSWORD ? String(process.env.DB_PASSWORD).trim() : '';

if (!password) {
    console.error("ERROR: DB_PASSWORD is empty!");
    process.exit(1);
} else {
    console.log("DEBUG: DB_PASSWORD is set.");
}
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    password,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_DIALECT,
        logging: false,
    },
);

module.exports = sequelize;
