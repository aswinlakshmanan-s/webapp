// app.js
const express = require('express');
const { initDB } = require('./models');
const healthRoutes = require('./routes/health');
const uploadRoutes = require('./routes/upload'); // Import the upload routes

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize the database
initDB();

// Middleware for JSON body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/v1/health', healthRoutes); // Health check route
app.use('/v1/file', uploadRoutes);   // File upload route

// Start the server
const runApp = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = runApp;
