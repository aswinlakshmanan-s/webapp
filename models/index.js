const sequelize = require('../config/database');
const HealthCheck = require('./healthCheck');

const initDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');
        await sequelize.sync({ alter: true }); // Ensure database is up to date
        console.log('Database synced...');
    } catch (error) {
        console.error('Error connecting to the database:', error);
    }
};

module.exports = { sequelize, initDB, HealthCheck };
