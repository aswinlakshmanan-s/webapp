const express = require('express');
const { initDB } = require('./models');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize the database
initDB();

// Routes
app.use('/', healthRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
