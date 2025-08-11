const express = require('express');
const { body } = require('express-validator');
const { 
  getDepartments, 
  createDepartment, 
  updateDepartment, 
  deleteDepartment,
  getDepartmentById 
} = require('../controllers/departmentController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all departments
router.get('/', auth, getDepartments);

// Get department by ID
router.get('/:id', auth, getDepartmentById);

// Create new department (Admin only)
router.post('/', auth, authorize('admin'), [
  body('name').notEmpty().withMessage('Department name is required'),
  body('code').notEmpty().withMessage('Department code is required')
], createDepartment);

// Update department (Admin only)
router.put('/:id', auth, authorize('admin'), updateDepartment);

// Delete department (Admin only)
router.delete('/:id', auth, authorize('admin'), deleteDepartment);

module.exports = router;

