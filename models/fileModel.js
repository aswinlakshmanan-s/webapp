// models/fileModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const File = sequelize.define('File', {
    fileName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fileUrl: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fileKey: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4
    },
    fileSize: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    uploadDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,  // Enable timestamps (createdAt, updatedAt)
});

module.exports = File; // Ensure the model is exported
