const Forecast = require('../models/Forecast');
const Department = require('../models/Department');
const { sendApprovalNotificationEmail } = require('../utils/emailService');

// Validation helper with enhanced validation
const validateItems = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('At least one forecast item is required');
  }
  
  items.forEach((item, index) => {
    const path = `Item #${index + 1}`;
    
    if (!item.position) {
      throw new Error(`${path}: Position is required`);
    }
    
    if (!['FT', 'PT', 'CT'].includes(item.workforceType)) {
      throw new Error(`${path}: Invalid workforce type`);
    }
    
    // Validate attrition data
    if (item.historicalAttritionRate < 0 || item.historicalAttritionRate > 1) {
      throw new Error(`${path}: Historical attrition rate must be between 0 and 1`);
    }
    
    // Validate risk assessment fields (1-5)
    ['criticalSkillsGap', 'marketDemand', 'salaryCompetitiveness', 'workLifeBalance', 'careerGrowthOpportunities'].forEach(field => {
      if (item[field] && (item[field] < 1 || item[field] > 5)) {
        throw new Error(`${path}: ${field} must be between 1 and 5`);
      }
    });
    
    // Validate non-negative numbers
    ['currentCount', 'forecastCount', 'salaryBudget', 'oneTimeCost', 'costPerHire'].forEach(field => {
      if ((item[field] || 0) < 0) {
        throw new Error(`${path}: ${field} cannot be negative`);
      }
    });
  });
};

const createForecast = async (req, res) => {
  try {
    console.log('📝 Creating new forecast with data:', JSON.stringify(req.body, null, 2));
    console.log('👤 User creating forecast:', req.user);
    
    const { period, items, status = 'draft' } = req.body;

    // Validate items
    validateItems(items);
    
    // Get department - HOD users use their assigned department
    const departmentId = req.user.role === 'hod' ? req.user.department : req.body.department;
    
    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Department is required'
      });
    }
    
    // Check if forecast already exists for this period and department
    const existingForecast = await Forecast.findOne({
      department: departmentId,
      'period.year': period.year,
      'period.quarter': period.quarter
    });

    if (existingForecast) {
      return res.status(400).json({
        success: false,
        message: 'Forecast already exists for this period. Please edit the existing forecast.'
      });
    }

    // Create forecast with proper field mapping
    const forecastData = {
      department: departmentId,
      submittedBy: req.user.id,
      period: {
        year: parseInt(period.year),
        quarter: parseInt(period.quarter)
      },
      items: items,
      status: status
    };

    // Set submittedAt timestamp if status is 'submitted'
    if (status === 'submitted') {
      forecastData.submittedAt = new Date();
      console.log('✅ Setting submittedAt timestamp for submitted forecast');
    }

    const forecast = new Forecast(forecastData);
    await forecast.save();
    
    // Populate references for response
    await forecast.populate(['department', 'submittedBy']);

    console.log('🎉 Forecast created successfully:', forecast._id);
    console.log('📊 Forecast status:', forecast.status);
    console.log('📅 Submitted at:', forecast.submittedAt);

    res.status(201).json({
      success: true,
      message: `Forecast ${status === 'submitted' ? 'submitted' : 'saved'} successfully`,
      forecast: forecast
    });

  } catch (error) {
    console.error('❌ Error creating forecast:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Server error creating forecast'
    });
  }
};

const getForecasts = async (req, res) => {
  try {
    console.log('📋 Fetching forecasts for user:', req.user.email, 'Role:', req.user.role);
    
    let query = {};
    
    // HODs can only see their department's forecasts
    if (req.user.role === 'hod') {
      query.department = req.user.department;
    }

    const forecasts = await Forecast.find(query)
      .populate('department', 'name code')
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    console.log(`📊 Found ${forecasts.length} forecasts for user`);

    res.json({
      success: true,
      forecasts: forecasts
    });

  } catch (error) {
    console.error('❌ Error fetching forecasts:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching forecasts'
    });
  }
};

const getForecastById = async (req, res) => {
  try {
    const forecast = await Forecast.findById(req.params.id)
      .populate('department')
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .populate('comments.author', 'name email');

    if (!forecast) {
      return res.status(404).json({ 
        success: false,
        message: 'Forecast not found' 
      });
    }

    // Check access permissions
    if (req.user.role === 'hod' && 
        forecast.department._id.toString() !== req.user.department.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    res.json({
      success: true,
      forecast: forecast
    });

  } catch (error) {
    console.error('❌ Error fetching forecast:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching forecast'
    });
  }
};

const updateForecast = async (req, res) => {
  try {
    console.log('🔄 Updating forecast:', req.params.id);
    console.log('📝 Update data:', JSON.stringify(req.body, null, 2));
    
    const { items, status, comments, reviewComments, reviewPriority } = req.body;
    
    const forecast = await Forecast.findById(req.params.id);
    if (!forecast) {
      return res.status(404).json({ 
        success: false,
        message: 'Forecast not found' 
      });
    }

    // Check permissions
    if (req.user.role === 'hod' && 
        forecast.department.toString() !== req.user.department.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    if (forecast.status === 'submitted' && req.user.role === 'hod') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit submitted forecast'
      });
    }

    // Update items if provided
    if (items) {
      validateItems(items);
      forecast.items = items;
    }

    // Update status with proper timestamp handling
    if (status) {
      const oldStatus = forecast.status;
      forecast.status = status;
      
      // Set submittedAt timestamp when status changes to 'submitted'
      if (status === 'submitted' && oldStatus !== 'submitted') {
        forecast.submittedAt = new Date();
        console.log('✅ Setting submittedAt timestamp for status change to submitted');
      }
      
      // Handle review status changes
      if (['reviewed', 'approved', 'rejected'].includes(status)) {
        forecast.reviewedAt = new Date();
        forecast.reviewedBy = req.user.id;
        
        if (reviewComments) {
          forecast.reviewComments = reviewComments;
        }
        
        if (reviewPriority) {
          forecast.reviewPriority = reviewPriority;
        }
      }
    }

    // Add comments
    if (comments) {
      forecast.comments.push({
        author: req.user.id,
        message: comments,
        timestamp: new Date()
      });
    }

    await forecast.save();
    await forecast.populate(['department', 'submittedBy', 'reviewedBy']);

    console.log('✅ Forecast updated successfully');
    console.log('📊 New status:', forecast.status);
    console.log('📅 SubmittedAt:', forecast.submittedAt);

    res.json({
      success: true,
      message: 'Forecast updated successfully',
      forecast: forecast
    });

  } catch (error) {
    console.error('❌ Error updating forecast:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Server error updating forecast'
    });
  }
};

const deleteForecast = async (req, res) => {
  try {
    const forecast = await Forecast.findById(req.params.id);
    if (!forecast) {
      return res.status(404).json({ 
        success: false,
        message: 'Forecast not found' 
      });
    }

    if (forecast.status === 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete submitted forecast'
      });
    }

    await forecast.deleteOne();
    
    res.json({ 
      success: true,
      message: 'Forecast deleted successfully' 
    });

  } catch (error) {
    console.error('❌ Error deleting forecast:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error deleting forecast'
    });
  }
};

// Get forecasts for review (Finance/Admin only)
const getForecastsForReview = async (req, res) => {
  try {
    if (!['finance', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    const { status = 'submitted' } = req.query;
    
    const forecasts = await Forecast.find({ status })
      .populate('department', 'name code')
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ submittedAt: 1 }); // Oldest first

    res.json({
      success: true,
      forecasts: forecasts
    });

  } catch (error) {
    console.error('❌ Error fetching forecasts for review:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching forecasts for review'
    });
  }
};

// Bulk status update
const bulkUpdateStatus = async (req, res) => {
  try {
    if (!['finance', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    const { forecastIds, status, reviewComments } = req.body;
    
    const updateData = {
      status,
      reviewedAt: new Date(),
      reviewedBy: req.user.id
    };

    if (reviewComments) {
      updateData.reviewComments = reviewComments;
    }
    
    const result = await Forecast.updateMany(
      { _id: { $in: forecastIds } },
      updateData
    );

    res.json({ 
      success: true,
      message: `Updated ${result.modifiedCount} forecasts` 
    });

  } catch (error) {
    console.error('❌ Error bulk updating forecasts:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error updating forecasts'
    });
  }
};

// Update forecast status (approve/reject)
// Update forecast status (approve/reject)
const updateForecastStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    const userId = req.user.id || req.user._id; // Handle both id formats

    console.log(`🔄 Updating forecast ${id} status to: ${status}`);
    console.log(`👤 Reviewed by user: ${userId}`);
    console.log(`💬 Comments: ${comments}`);

    // Validate status
    if (!['approved', 'rejected', 'reviewed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be approved, rejected, or reviewed'
      });
    }

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid forecast ID format'
      });
    }

    const forecast = await Forecast.findById(id)
      .populate('department')
      .populate('submittedBy');
     
    if (!forecast) {
      return res.status(404).json({  
        success: false,
        message: 'Forecast not found'  
      });
    }

    // Check if forecast is in submittable state
    if (forecast.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: `Cannot ${status} forecast with status: ${forecast.status}. Only submitted forecasts can be reviewed.`
      });
    }

    // Update forecast
    forecast.status = status;
    if (comments) {
      forecast.reviewComments = comments;
    }
    forecast.reviewedBy = userId;
    forecast.reviewedAt = new Date();

    await forecast.save();

    console.log(`✅ Forecast ${id} ${status} successfully`);

    // Send notification email to HOD (optional - don't fail if email fails)
    try {
      if (forecast.submittedBy && forecast.submittedBy.email) {
        const quarterYear = `Q${forecast.period.quarter} ${forecast.period.year}`;
        await sendApprovalNotificationEmail(
          forecast.submittedBy.email,
          forecast.submittedBy.name,
          forecast.department.name,
          quarterYear,
          status,
          comments
        );
        console.log(`✅ Status notification sent to ${forecast.submittedBy.email}`);
      }
    } catch (emailError) {
      console.error('❌ Failed to send status notification:', emailError);
      // Don't fail the request if email fails
    }

    // Populate the updated forecast for response
    await forecast.populate(['department', 'submittedBy', 'reviewedBy']);

    res.json({
      success: true,
      message: `Forecast ${status} successfully`,
      forecast: forecast
    });

  } catch (error) {
    console.error('❌ Error updating forecast status:', error);
    
    // Provide specific error messages
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid forecast ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: `Error ${req.body.status || 'updating'}ing forecast`,
      error: error.message
    });
  }
};


const sendManualReminder = async (req, res) => {
  try {
    const { type = 'daily' } = req.body;
    const reminderSystem = require('../utils/reminderSystem');
     
    await reminderSystem.triggerManualReminder(type);
     
    res.json({
      success: true,
      message: `${type} reminders triggered successfully`
    });
  } catch (error) {
    console.error('❌ Error sending manual reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending reminders',
      error: error.message
    });
  }
};

const getReminderStatus = async (req, res) => {
  try {
    const reminderSystem = require('../utils/reminderSystem');
    const status = reminderSystem.getJobStatus();
     
    res.json({
      success: true,
      reminderJobs: status
    });
  } catch (error) {
    console.error('❌ Error getting reminder status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting reminder status',
      error: error.message
    });
  }
};

module.exports = {
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
};
