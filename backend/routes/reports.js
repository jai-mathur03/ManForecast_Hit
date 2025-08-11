const express = require('express');
const {  
  getConsolidatedReport, 
  getDepartmentReport, 
  exportReport,
  getAdvancedAnalytics,
  exportAdvancedReport
} = require('../controllers/reportController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get consolidated report (Finance and Admin only)
router.get('/consolidated', auth, authorize('finance', 'admin'), getConsolidatedReport);

// Get advanced analytics (Finance and Admin only)  
router.get('/advanced-analytics', auth, authorize('finance', 'admin'), getAdvancedAnalytics);

// Get department-specific report
router.get('/department/:id', auth, getDepartmentReport);

// Export basic report to CSV/Excel (Finance and Admin only)
router.get('/export', auth, authorize('finance', 'admin'), exportReport);

// Export advanced analytics report (Finance and Admin only)
router.get('/export-advanced', auth, authorize('finance', 'admin'), exportAdvancedReport);

module.exports = router;
