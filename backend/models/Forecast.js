const mongoose = require('mongoose');

const forecastItemSchema = new mongoose.Schema({
  // Basic position info
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true
  },
  currentCount: {
    type: Number,
    required: [true, 'Current count is required'],
    min: [0, 'Current count cannot be negative'],
    default: 0
  },
  forecastCount: {
    type: Number,
    required: [true, 'Forecast count is required'],
    min: [0, 'Forecast count cannot be negative'],
    default: 0
  },
  salaryBudget: {
    type: Number,
    required: [true, 'Salary budget is required'],
    min: [0, 'Salary budget cannot be negative'],
    default: 0
  },
  justification: {
    type: String,
    trim: true
  },

  // Enhanced workforce data
  workforceType: {
    type: String,
    enum: {
      values: ['FT', 'PT', 'CT'],
      message: '{VALUE} is not a valid workforce type'
    },
    required: [true, 'Workforce type is required'],
    default: 'FT'
  },
  gradeLevel: {
    type: String,
    trim: true,
    default: 'N/A'
  },
  // ✅ FIX 1: Updated employeeType enum to match frontend values
  employeeType: {
    type: String,
    enum: {
      values: ['Permanent', 'Contract', 'Temporary'], // ← Capitalized to match frontend
      message: '{VALUE} is not a valid employee type'
    },
    default: 'Permanent'
  },
  location: {
    type: String,
    trim: true,
    default: 'Head Office'
  },
  skills: [{
    type: String,
    trim: true
  }],

  // Financial data
  oneTimeCost: {
    type: Number,
    min: [0, 'One-time cost cannot be negative'],
    default: 0
  },
  costPerHire: {
    type: Number,
    min: [0, 'Cost per hire cannot be negative'],
    default: 0
  },
  currentAverageSalary: {
    type: Number,
    min: [0, 'Current average salary cannot be negative'],
    default: 0
  },
  marketBenchmarkSalary: {
    type: Number,
    min: [0, 'Market benchmark salary cannot be negative'],
    default: 0
  },

  // ✅ FIX 2: Changed expectedStartMonth to accept month names (String)
  expectedStartMonth: {
    type: String,
    trim: true,
    enum: {
      values: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
      message: '{VALUE} is not a valid month'
    }
  },
  expectedHireDate: {
    type: Date
  },

  // MEANINGFUL ATTRITION DATA
  historicalAttritionRate: {
    type: Number,
    min: [0, 'Historical attrition rate cannot be negative'],
    max: [1, 'Historical attrition rate cannot exceed 1'],
    default: 0,
    required: [true, 'Historical attrition rate is required'] // Last year's actual attrition for this position
  },
  recentResignations: {
    type: Number,
    min: [0, 'Recent resignations cannot be negative'],
    default: 0 // Number of resignations in last 6 months
  },
  criticalSkillsGap: {
    type: Number,
    min: [1, 'Critical skills gap must be between 1 and 5'],
    max: [5, 'Critical skills gap must be between 1 and 5'],
    default: 3, // 1=easy to replace, 5=very hard to replace
    required: [true, 'Critical skills gap rating is required']
  },
  marketDemand: {
    type: Number,
    min: [1, 'Market demand must be between 1 and 5'],
    max: [5, 'Market demand must be between 1 and 5'],
    default: 3, // 1=low market demand, 5=very high demand
    required: [true, 'Market demand rating is required']
  },
  salaryCompetitiveness: {
    type: Number,
    min: [1, 'Salary competitiveness must be between 1 and 5'],
    max: [5, 'Salary competitiveness must be between 1 and 5'],
    default: 3, // 1=below market, 5=above market
    required: [true, 'Salary competitiveness rating is required']
  },
  workLifeBalance: {
    type: Number,
    min: [1, 'Work life balance must be between 1 and 5'],
    max: [5, 'Work life balance must be between 1 and 5'],
    default: 3, // 1=poor, 5=excellent
    required: [true, 'Work life balance rating is required']
  },
  careerGrowthOpportunities: {
    type: Number,
    min: [1, 'Career growth opportunities must be between 1 and 5'],
    max: [5, 'Career growth opportunities must be between 1 and 5'],
    default: 3, // 1=limited, 5=excellent
    required: [true, 'Career growth opportunities rating is required']
  }
});

// Add virtual for calculated attrition risk
forecastItemSchema.virtual('calculatedAttritionRisk').get(function() {
  // Calculate risk score based on multiple factors
  const factors = [
    this.historicalAttritionRate * 100, // 0-100
    this.recentResignations * 10, // Weight recent resignations
    (6 - this.salaryCompetitiveness) * 10, // Lower competitiveness = higher risk
    (6 - this.workLifeBalance) * 8,
    (6 - this.careerGrowthOpportunities) * 7,
    this.criticalSkillsGap * 8,
    this.marketDemand * 6
  ];
  
  const totalScore = factors.reduce((sum, factor) => sum + factor, 0);
  const maxScore = 100 + 50 + 50 + 40 + 35 + 40 + 30; // Maximum possible score
  const riskPercentage = (totalScore / maxScore) * 100;
  
  if (riskPercentage < 30) return 'low';
  if (riskPercentage < 60) return 'medium';
  return 'high';
});

// Add virtual for risk score percentage
forecastItemSchema.virtual('riskScore').get(function() {
  const factors = [
    this.historicalAttritionRate * 100,
    this.recentResignations * 10,
    (6 - this.salaryCompetitiveness) * 10,
    (6 - this.workLifeBalance) * 8,
    (6 - this.careerGrowthOpportunities) * 7,
    this.criticalSkillsGap * 8,
    this.marketDemand * 6
  ];
  
  const totalScore = factors.reduce((sum, factor) => sum + factor, 0);
  const maxScore = 345;
  return Math.round((totalScore / maxScore) * 100);
});

const forecastSchema = new mongoose.Schema({
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Submitted by user is required']
  },
  period: {
    year: {
      type: Number,
      required: [true, 'Year is required'],
      min: [2020, 'Year must be 2020 or later'],
      max: [2030, 'Year cannot be later than 2030']
    },
    quarter: {
      type: Number,
      required: [true, 'Quarter is required'],
      min: [1, 'Quarter must be between 1 and 4'],
      max: [4, 'Quarter must be between 1 and 4']
    }
  },
  items: {
    type: [forecastItemSchema],
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'At least one forecast item is required'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'submitted', 'reviewed', 'approved', 'rejected'],
      message: '{VALUE} is not a valid status'
    },
    default: 'draft'
  },
  totalBudget: {
    type: Number,
    default: 0,
    min: [0, 'Total budget cannot be negative']
  },
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: {
      type: String,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  submittedAt: {
    type: Date
  },
  reviewedAt: {
    type: Date
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // REVIEW WORKFLOW FIELDS
  reviewComments: {
    type: String,
    trim: true
  },
  reviewPriority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: '{VALUE} is not a valid priority'
    },
    default: 'medium'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ Enhanced pre-save middleware with better error handling
forecastSchema.pre('save', function(next) {
  try {
    // Calculate total budget including all costs
    this.totalBudget = this.items.reduce((total, item) => 
      total + (item.salaryBudget || 0) + (item.oneTimeCost || 0) + (item.costPerHire || 0), 0);
    
    // Set submittedAt timestamp when status changes to 'submitted'
    if (this.isModified('status') && this.status === 'submitted' && !this.submittedAt) {
      this.submittedAt = new Date();
    }
    
    // Set reviewedAt timestamp when status changes to review states
    if (this.isModified('status') && ['reviewed', 'approved', 'rejected'].includes(this.status) && !this.reviewedAt) {
      this.reviewedAt = new Date();
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// ✅ Add compound index for efficient queries
forecastSchema.index({ department: 1, 'period.year': 1, 'period.quarter': 1 }, { unique: true });
forecastSchema.index({ submittedBy: 1, status: 1 });
forecastSchema.index({ status: 1, submittedAt: 1 });

module.exports = mongoose.model('Forecast', forecastSchema);
