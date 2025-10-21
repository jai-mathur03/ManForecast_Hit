const Forecast = require('../models/Forecast');
const Department = require('../models/Department');
const User = require('../models/User');

// ✅ YOUR EXISTING FUNCTIONS (that were missing)

// Get consolidated report data
const getConsolidatedReport = async (req, res) => {
  try {
    const { year, quarter } = req.query;
    
    let query = {};
    if (year && quarter) {
      query['period.year'] = parseInt(year);
      query['period.quarter'] = parseInt(quarter);
    }

    // Get all forecasts with populated data
    const forecasts = await Forecast.find(query)
      .populate('department', 'name code')
      .populate('submittedBy', 'name email role')
      .sort({ createdAt: -1 });

    // Calculate summary statistics
    const summary = {
      totalDepartments: await Department.countDocuments(),
      totalForecasts: forecasts.length,
      submittedForecasts: forecasts.filter(f => f.status === 'submitted').length,
      approvedForecasts: forecasts.filter(f => f.status === 'approved').length,
      rejectedForecasts: forecasts.filter(f => f.status === 'rejected').length,
      totalPositions: forecasts.reduce((sum, f) => 
        sum + f.items.reduce((itemSum, item) => itemSum + (item.forecastCount || 0), 0), 0),
      totalBudget: forecasts.reduce((sum, f) => sum + (f.totalBudget || 0), 0),
      totalOneTimeCosts: forecasts.reduce((sum, f) => 
        sum + f.items.reduce((itemSum, item) => itemSum + (item.oneTimeCost || 0), 0), 0),
      totalRecruitmentCosts: forecasts.reduce((sum, f) => 
        sum + f.items.reduce((itemSum, item) => itemSum + (item.costPerHire || 0), 0), 0),
      averageRiskScore: calculateAverageRiskScore(forecasts),
      averageHistoricalAttrition: calculateAverageAttrition(forecasts)
    };

    // Department-wise breakdown
    const departmentData = await calculateDepartmentData(forecasts);
    
    // Detailed items for analysis
    const detailedItems = flattenForecastItems(forecasts);

    // Status distribution
    const statusDistribution = [
      { name: 'Submitted', value: summary.submittedForecasts, color: '#0088FE' },
      { name: 'Approved', value: summary.approvedForecasts, color: '#00C49F' },
      { name: 'Rejected', value: summary.rejectedForecasts, color: '#FF8042' },
      { name: 'Draft', value: summary.totalForecasts - summary.submittedForecasts - summary.approvedForecasts - summary.rejectedForecasts, color: '#FFBB28' }
    ].filter(item => item.value > 0);

    res.json({
      summary,
      departmentData,
      detailedItems,
      statusDistribution,
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('Consolidated report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get department-specific report
const getDepartmentReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { year, quarter } = req.query;
    
    let query = { department: id };
    if (year && quarter) {
      query['period.year'] = parseInt(year);
      query['period.quarter'] = parseInt(quarter);
    }

    const forecasts = await Forecast.find(query)
      .populate('department', 'name code')
      .populate('submittedBy', 'name email');

    const department = await Department.findById(id);
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Calculate department-specific metrics
    const summary = {
      departmentName: department.name,
      totalForecasts: forecasts.length,
      totalPositions: forecasts.reduce((sum, f) => 
        sum + f.items.reduce((itemSum, item) => itemSum + (item.forecastCount || 0), 0), 0),
      totalBudget: forecasts.reduce((sum, f) => sum + (f.totalBudget || 0), 0),
      averageRiskScore: calculateAverageRiskScore(forecasts)
    };

    res.json({
      department,
      summary,
      forecasts,
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('Department report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Export report to CSV
const exportReport = async (req, res) => {
  try {
    const { year, quarter, format = 'csv' } = req.query;
    
    let query = {};
    if (year && quarter) {
      query['period.year'] = parseInt(year);
      query['period.quarter'] = parseInt(quarter);
    }

    const forecasts = await Forecast.find(query)
      .populate('department', 'name code')
      .populate('submittedBy', 'name email');

    if (format === 'csv') {
      let csv = 'Department,Position,Current Count,Forecast Count,Variance,Salary Budget,Status,Submitted By,Risk Score\n';
      
      forecasts.forEach(forecast => {
        forecast.items.forEach(item => {
          const variance = item.forecastCount - item.currentCount;
          const riskScore = calculateItemRiskScore(item);
          
          csv += `"${forecast.department.name}","${item.position}",${item.currentCount},${item.forecastCount},${variance},${item.salaryBudget},"${forecast.status}","${forecast.submittedBy.name}",${riskScore}\n`;
        });
      });

      const filename = `workforce-report-${year || 'all'}-Q${quarter || 'all'}-${Date.now()}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } else {
      res.json(forecasts);
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ NEW ADVANCED ANALYTICS FUNCTIONS

// Advanced analytics endpoint
const getAdvancedAnalytics = async (req, res) => {
  try {
    const { year, quarter } = req.query;
    
    let query = {};
    if (year && quarter) {
      query['period.year'] = parseInt(year);
      query['period.quarter'] = parseInt(quarter);
    }

    const forecasts = await Forecast.find(query)
      .populate('department', 'name code')
      .populate('submittedBy', 'name email');

    const allItems = forecasts.flatMap(f => f.items || []);

    // PREDICTIVE ATTRITION MODEL
    const attritionPrediction = generateAttritionPrediction(allItems);
    
    // RISK FACTOR ANALYSIS
    const riskFactors = calculateRiskFactors(allItems);
    
    // STRATEGIC SCORING
    const strategicScore = calculateStrategicScore(allItems, forecasts);
    
    // ROI CALCULATIONS
    const roiAnalysis = calculateROI(allItems);
    
    // GROWTH TREND ANALYSIS
    const growthTrend = await calculateGrowthTrend(year, quarter);

    const analyticsData = {
      strategicScore,
      avgROI: roiAnalysis.avgROI,
      avgTimeToFill: calculateAvgTimeToFill(allItems),
      attritionPrediction,
      riskFactors,
      growthTrend,
      priorities: generatePriorities(allItems, forecasts),
      generatedAt: new Date()
    };

    res.json(analyticsData);
  } catch (error) {
    console.error('Advanced analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Enhanced export with advanced analytics
const exportAdvancedReport = async (req, res) => {
  try {
    const { year, quarter, format = 'csv' } = req.query;
    
    let query = {};
    if (year && quarter) {
      query['period.year'] = parseInt(year);
      query['period.quarter'] = parseInt(quarter);
    }

    const forecasts = await Forecast.find(query)
      .populate('department', 'name code')
      .populate('submittedBy', 'name email');

    const allItems = forecasts.flatMap(f => f.items || []);

    if (format === 'csv') {
      let csv = 'Department,Position,Risk Score,Attrition Risk %,Salary Gap %,Skills Gap (1-5),Market Demand (1-5),Work-Life Balance (1-5),Career Growth (1-5),Predicted ROI,Current Count,Forecast Count,Variance,Salary Budget,One-time Cost,Recruitment Cost,Expected Start Month,Skills,Justification,Strategic Priority\n';
      
      forecasts.forEach(forecast => {
        forecast.items.forEach(item => {
          const salaryGap = ((item.marketBenchmarkSalary - item.currentAverageSalary) / item.currentAverageSalary * 100) || 0;
          const predictedROI = (item.salaryBudget > 0) ? ((item.forecastCount * 150000) / item.salaryBudget).toFixed(2) : 0;
          const riskScore = calculateItemRiskScore(item);
          const priority = riskScore > 70 ? 'High' : riskScore > 50 ? 'Medium' : 'Low';
          const skills = (item.skills || []).join('; ');
          const variance = item.forecastCount - item.currentCount;
          
          csv += `"${forecast.department.name}","${item.position}",${riskScore},${item.historicalAttritionRate || 0},${salaryGap.toFixed(2)},${item.criticalSkillsGap || 1},${item.marketDemand || 1},${item.workLifeBalance || 3},${item.careerGrowthOpportunities || 3},${predictedROI},${item.currentCount},${item.forecastCount},${variance},${item.salaryBudget},${item.oneTimeCost},${item.costPerHire},"${item.expectedStartMonth || ''}","${skills}","${(item.justification || '').replace(/"/g, '""')}","${priority}"\n`;
        });
      });

      const filename = `advanced-workforce-analytics-${year || 'all'}-Q${quarter || 'all'}-${Date.now()}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } else {
      res.json({ forecasts, analyticsData: await getAdvancedAnalyticsData(year, quarter) });
    }
  } catch (error) {
    console.error('Advanced export error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ HELPER FUNCTIONS

function calculateAverageRiskScore(forecasts) {
  const allItems = forecasts.flatMap(f => f.items || []);
  if (allItems.length === 0) return 0;
  
  const totalRisk = allItems.reduce((sum, item) => sum + calculateItemRiskScore(item), 0);
  return Math.round(totalRisk / allItems.length);
}

function calculateAverageAttrition(forecasts) {
  const allItems = forecasts.flatMap(f => f.items || []);
  if (allItems.length === 0) return 0;
  
  const totalAttrition = allItems.reduce((sum, item) => sum + (item.historicalAttritionRate || 0), 0);
  return Math.round((totalAttrition / allItems.length) * 100);
}

function calculateItemRiskScore(item) {
  const factors = [
    (item.historicalAttritionRate || 0) * 100, // 0-100
    (item.recentResignations || 0) * 10, // Weight recent resignations
    (5 - (item.salaryCompetitiveness || 3)) * 10, // Lower competitiveness = higher risk
    (5 - (item.workLifeBalance || 3)) * 8,
    (5 - (item.careerGrowthOpportunities || 3)) * 7,
    (item.criticalSkillsGap || 1) * 8,
    (item.marketDemand || 1) * 6
  ];
  
  const totalScore = factors.reduce((sum, factor) => sum + factor, 0);
  const maxScore = 100 + 50 + 50 + 40 + 35 + 40 + 30; // Maximum possible score
  
  return Math.round((totalScore / maxScore) * 100);
}

async function calculateDepartmentData(forecasts) {
  const departmentMap = new Map();
  
  forecasts.forEach(forecast => {
    const deptId = forecast.department._id.toString();
    
    if (!departmentMap.has(deptId)) {
      departmentMap.set(deptId, {
        department: forecast.department,
        totalForecasts: 0,
        totalPositions: 0,
        totalBudget: 0,
        variance: 0,
        riskScore: 0,
        attritionRisk: 0
      });
    }
    
    const dept = departmentMap.get(deptId);
    dept.totalForecasts += 1;
    dept.totalBudget += forecast.totalBudget || 0;
    
    forecast.items.forEach(item => {
      dept.totalPositions += item.forecastCount || 0;
      dept.variance += (item.forecastCount || 0) - (item.currentCount || 0);
    });
    
    // Calculate average risk score for department
    const deptItems = forecast.items || [];
    const deptRiskScore = deptItems.reduce((sum, item) => sum + calculateItemRiskScore(item), 0) / deptItems.length;
    dept.riskScore = Math.round(deptRiskScore);
    
    // Calculate average attrition risk
    const deptAttrition = deptItems.reduce((sum, item) => sum + (item.historicalAttritionRate || 0), 0) / deptItems.length;
    dept.attritionRisk = Math.round(deptAttrition * 100);
  });
  
  return Array.from(departmentMap.values());
}

function flattenForecastItems(forecasts) {
  const items = [];
  
  forecasts.forEach(forecast => {
    forecast.items.forEach(item => {
      items.push({
        ...item.toObject(),
        department: forecast.department.name,
        departmentCode: forecast.department.code,
        submittedBy: forecast.submittedBy.name,
        status: forecast.status,
        forecastId: forecast._id,
        riskScore: calculateItemRiskScore(item),
        variance: (item.forecastCount || 0) - (item.currentCount || 0)
      });
    });
  });
  
  return items;
}

// PREDICTIVE FUNCTIONS
function generateAttritionPrediction(items) {
  const months = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026'];
  const baseAttrition = items.reduce((sum, i) => sum + (i.historicalAttritionRate || 0), 0) / items.length;
  
  return months.map((month, index) => {
    const seasonalFactor = [1.2, 1.1, 1.3, 1.0, 0.9, 1.1][index];
    const riskFactor = items.reduce((sum, i) => sum + calculateItemRiskScore(i), 0) / items.length / 100;
    
    return {
      month,
      predicted: Math.round(baseAttrition * 100 * seasonalFactor * (1 + riskFactor) * (index + 1) * 0.3),
      current: Math.round(baseAttrition * 100 * (index + 1) * 0.2),
      confidence: Math.max(90 - index * 3, 70)
    };
  });
}

function calculateRiskFactors(items) {
  const avgSalaryGap = items.reduce((sum, i) => {
    const gap = ((i.marketBenchmarkSalary || 0) - (i.currentAverageSalary || 0)) / 
                 (i.currentAverageSalary || 1) * 100;
    return sum + Math.max(gap, 0);
  }, 0) / items.length;

  return [
    { factor: 'Salary Gap', value: Math.min(avgSalaryGap * 2, 100), fullMark: 100 },
    { factor: 'Skills Shortage', value: items.reduce((sum, i) => sum + (i.criticalSkillsGap || 0), 0) / items.length * 20, fullMark: 100 },
    { factor: 'Market Demand', value: items.reduce((sum, i) => sum + (i.marketDemand || 0), 0) / items.length * 20, fullMark: 100 },
    { factor: 'Work-Life Balance', value: (5 - items.reduce((sum, i) => sum + (i.workLifeBalance || 3), 0) / items.length) * 25, fullMark: 100 },
    { factor: 'Career Growth', value: (5 - items.reduce((sum, i) => sum + (i.careerGrowthOpportunities || 3), 0) / items.length) * 25, fullMark: 100 },
    { factor: 'Job Security', value: items.reduce((sum, i) => sum + (i.recentResignations || 0), 0) / items.length * 10, fullMark: 100 }
  ];
}

function calculateStrategicScore(items, forecasts) {
  const riskScore = items.reduce((sum, i) => sum + calculateItemRiskScore(i), 0) / items.length;
  const approvalRate = forecasts.filter(f => f.status === 'approved').length / forecasts.length * 100;
  const budgetEfficiency = calculateBudgetEfficiency(items);
  
  return Math.round(100 - (riskScore * 0.4) + (approvalRate * 0.3) + (budgetEfficiency * 0.3));
}

function calculateROI(items) {
  const totalInvestment = items.reduce((sum, i) => 
    sum + (i.salaryBudget || 0) + (i.oneTimeCost || 0) + (i.costPerHire || 0), 0);
  
  const estimatedReturns = items.reduce((sum, i) => {
    const productivityGain = (i.forecastCount || 0) * 150000; // Avg productivity per hire
    const retentionSavings = (i.forecastCount || 0) * (1 - (i.historicalAttritionRate || 0)) * 50000;
    return sum + productivityGain + retentionSavings;
  }, 0);
  
  return {
    avgROI: totalInvestment > 0 ? (estimatedReturns / totalInvestment).toFixed(1) : 0,
    totalInvestment,
    estimatedReturns
  };
}

function calculateAvgTimeToFill(items) {
  return Math.round(items.reduce((sum, i) => {
    const baseTime = 30; // Base 30 days
    const skillsMultiplier = (i.criticalSkillsGap || 3) / 3;
    const demandMultiplier = (i.marketDemand || 3) / 3;
    return sum + (baseTime * skillsMultiplier * demandMultiplier);
  }, 0) / items.length);
}

async function calculateGrowthTrend(currentYear, currentQuarter) {
  const periods = [];
  for (let i = 4; i >= 0; i--) {
    let year = currentYear || new Date().getFullYear();
    let quarter = (currentQuarter || Math.ceil((new Date().getMonth() + 1) / 3)) - i;
    
    if (quarter <= 0) {
      quarter += 4;
      year -= 1;
    }
    
    const periodForecasts = await Forecast.find({
      'period.year': year,
      'period.quarter': quarter
    });
    
    const periodItems = periodForecasts.flatMap(f => f.items || []);
    
    periods.push({
      period: `Q${quarter} ${year}`,
      positions: periodItems.reduce((sum, i) => sum + (i.forecastCount || 0), 0),
      budget: periodForecasts.reduce((sum, f) => sum + (f.totalBudget || 0), 0) / 1000, // In K
      riskScore: periodItems.length > 0 ? 
        periodItems.reduce((sum, i) => sum + calculateItemRiskScore(i), 0) / periodItems.length : 0
    });
  }
  
  return periods;
}

function generatePriorities(items, forecasts) {
  const highRiskItems = items.filter(i => calculateItemRiskScore(i) > 70);
  const salaryGapItems = items.filter(i => {
    const gap = ((i.marketBenchmarkSalary || 0) - (i.currentAverageSalary || 0)) / 
                 (i.currentAverageSalary || 1) * 100;
    return gap > 15;
  });
  const skillsGapItems = items.filter(i => (i.criticalSkillsGap || 0) >= 4);
  
  return [
    {
      action: 'Address Critical Skills Gap',
      urgency: skillsGapItems.length > items.length * 0.3 ? 'High' : 'Medium',
      impact: Math.min(skillsGapItems.length / items.length * 100, 95)
    },
    {
      action: 'Salary Market Adjustment',
      urgency: salaryGapItems.length > items.length * 0.2 ? 'High' : 'Medium',
      impact: Math.min(salaryGapItems.length / items.length * 100, 85)
    },
    {
      action: 'High-Risk Position Retention',
      urgency: highRiskItems.length > 0 ? 'High' : 'Low',
      impact: Math.min(highRiskItems.length / items.length * 100, 90)
    },
    {
      action: 'Process Optimization',
      urgency: 'Low',
      impact: 45
    }
  ];
}

function calculateBudgetEfficiency(items) {
  const avgCostPerHire = items.reduce((sum, i) => sum + (i.costPerHire || 0), 0) / items.length;
  const industryBenchmark = 75000; // Industry average
  
  return Math.max(100 - (avgCostPerHire / industryBenchmark * 100), 0);
}

// Export all functions
module.exports = {
  getConsolidatedReport,
  getDepartmentReport,
  exportReport,
  getAdvancedAnalytics,
  exportAdvancedReport
};
