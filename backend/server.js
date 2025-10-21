const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
require('dotenv').config();

// ----- Routes you already have -----
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const departmentRoutes = require('./routes/departments');
const forecastRoutes = require('./routes/forecasts');
const reportRoutes = require('./routes/reports');

// Reminder system you already have
const reminderSystem = require('./utils/reminderSystem');

const app = express();

// Basic hardening & gzip
app.use(helmet());
app.use(compression());

// JSON & CORS
app.use(express.json());
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      process.env.FRONTEND_URL // optional for preview deployments
    ].filter(Boolean),
    credentials: true,
  })
);

// ---- API routes (unchanged) ----
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/forecasts', forecastRoutes);
app.use('/api/reports', reportRoutes);

// ---- Mongo connect + reminder jobs ----
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    reminderSystem.startReminderJobs();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
  });

// ---- Serve React build from ../client/build ----
const clientBuildPath = path.resolve(__dirname, '../client/build');
app.use(express.static(clientBuildPath));

// For any non-API route, return index.html (React Router support)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// ---- Graceful shutdown ----
process.on('SIGINT', () => {
  console.log('\n🔄 Shutting down gracefully...');
  reminderSystem.stopReminderJobs();
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
