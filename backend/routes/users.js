const express = require('express');
const { body } = require('express-validator');
const { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  getUserById 
} = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all users (Admin only)
router.get('/', auth, authorize('admin'), getUsers);

// Get user by ID (Admin only)
router.get('/:id', auth, authorize('admin'), getUserById);

// Create new user (Admin only)
router.post('/', auth, authorize('admin'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'hod', 'finance']).withMessage('Valid role is required')
], createUser);

// Update user (Admin only)
router.put('/:id', auth, authorize('admin'), updateUser);

// Delete user (Admin only)
router.delete('/:id', auth, authorize('admin'), deleteUser);

module.exports = router;
