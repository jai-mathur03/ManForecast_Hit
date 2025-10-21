const Department = require('../models/Department');
const User = require('../models/User');
const { validationResult } = require('express-validator');

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ name: 1 });
    
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const createDepartment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, code, description } = req.body;

    // Check if department already exists
    const existingDepartment = await Department.findOne({
      $or: [{ name }, { code }]
    });
    if (existingDepartment) {
      return res.status(400).json({ 
        message: 'Department with this name or code already exists' 
      });
    }

    const department = new Department({
      name,
      code: code.toUpperCase(),
      description,
      createdBy: req.user.id
    });

    await department.save();
    await department.populate('createdBy', 'name email');

    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { name, code, description, isActive } = req.body;
    
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check if name or code is being changed and if it already exists
    if ((name && name !== department.name) || (code && code !== department.code)) {
      const existingDepartment = await Department.findOne({
        _id: { $ne: req.params.id },
        $or: [
          ...(name ? [{ name }] : []),
          ...(code ? [{ code: code.toUpperCase() }] : [])
        ]
      });
      if (existingDepartment) {
        return res.status(400).json({ 
          message: 'Department with this name or code already exists' 
        });
      }
    }

    // Update fields
    if (name) department.name = name;
    if (code) department.code = code.toUpperCase();
    if (description !== undefined) department.description = description;
    if (isActive !== undefined) department.isActive = isActive;

    await department.save();
    await department.populate('createdBy', 'name email');

    res.json(department);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check if department has active users
    const activeUsers = await User.findOne({ 
      department: req.params.id, 
      isActive: true 
    });
    if (activeUsers) {
      return res.status(400).json({ 
        message: 'Cannot delete department with active users' 
      });
    }

    // Soft delete by setting isActive to false
    department.isActive = false;
    await department.save();

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
