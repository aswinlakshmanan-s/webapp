const sequelize = require('../config/database');
const HealthCheck = require('./healthCheck');
const File = require('./fileModel'); // Import the File model


const initDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected...');
        await sequelize.sync({ alter: true });
        console.log('Database synced...');
    } catch (error) {
        console.error('Error connecting to the database:', error);
    }
};

module.exports = { sequelize, initDB, HealthCheck, File };