const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import your existing routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const departmentRoutes = require('./routes/departments');
const forecastRoutes = require('./routes/forecasts');
const reportRoutes = require('./routes/reports');

// Import reminder system
const reminderSystem = require('./utils/reminderSystem');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/forecasts', forecastRoutes);
app.use('/api/reports', reportRoutes);

// Connect to MongoDB and start reminder system
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  
  // Start the reminder system after successful DB connection
  reminderSystem.startReminderJobs();
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down gracefully...');
  reminderSystem.stopReminderJobs();
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
