const express = require('express');
const {  
  createForecast,  
  getForecasts,  
  getForecastById,  
  updateForecast,  
  deleteForecast, 
  getForecastsForReview, 
  bulkUpdateStatus, 
  updateForecastStatus, 
  sendManualReminder, 
  getReminderStatus 
} = require('../controllers/forecastController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get reminder system status (Admin only) - Must be before /:id route
router.get('/reminders/status', auth, authorize('admin'), getReminderStatus);

// Get forecasts for review (Finance/Admin only) - Must be before /:id route
router.get('/review', auth, authorize('finance', 'admin'), getForecastsForReview);

// Get all forecasts
router.get('/', auth, getForecasts);

// Send manual reminders (Admin only)
router.post('/reminders/manual', auth, authorize('admin'), sendManualReminder);

// Bulk update forecasts (Finance/Admin only)
router.post('/bulk-update', auth, authorize('finance', 'admin'), bulkUpdateStatus);

// Create new forecast
router.post('/', auth, authorize('hod', 'admin'), createForecast);

// ✅ FIX: Changed route to match frontend call
// FROM: router.put('/status/:id', ...)
// TO:   router.put('/:id/status', ...)
router.put('/:id/status', auth, authorize('finance', 'admin'), updateForecastStatus);

// Get single forecast by ID
router.get('/:id', auth, getForecastById);

// Update forecast
router.put('/:id', auth, updateForecast);

// Delete forecast
router.delete('/:id', auth, authorize('hod', 'admin'), deleteForecast);

module.exports = router;
