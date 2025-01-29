const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HealthCheck = sequelize.define('HealthCheck', {
    checkId: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    datetime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue() {
            // Get the current UTC time without any timezone offset
            const utcDate = new Date().toISOString();  // This gives UTC time with "Z" at the end
            return utcDate.slice(0, 19).replace('T', ' '); // Format it to "YYYY-MM-DD HH:mm:ss"
        },
    },
},
    {
        timestamps: false,
    }

);

module.exports = HealthCheck;
