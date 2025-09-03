const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./db');
const todoRoutes = require('./routes/todos');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes - IMPORTANT: Put specific routes before generic ones
app.use('/todos', todoRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'TODO API is running!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});