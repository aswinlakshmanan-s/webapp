const { Sequelize } = require('sequelize');
require('dotenv').config();
console.log("DEBUG: Process ENV contains DB_PASSWORD?", Boolean(process.env.DB_PASSWORD));
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
