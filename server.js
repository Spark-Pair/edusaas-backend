const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const routes = require('./routes');
const seedDatabase = require('./utils/seeder');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', routes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found.'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error.'
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Seed database with demo data
  await seedDatabase();
});
