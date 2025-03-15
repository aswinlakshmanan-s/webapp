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
        type: DataTypes.STRING,
        allowNull: false
    },
    fileSize: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    uploadDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    userId: {
        type: DataTypes.STRING, // assuming you're storing user ID as a string
        allowNull: false
    }
}, {
    timestamps: true,  // Enable timestamps (createdAt, updatedAt)
});

module.exports = File;
