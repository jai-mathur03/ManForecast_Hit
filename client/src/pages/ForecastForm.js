import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Paper
} from '@mui/material';
import { Add, Delete, Save, Send } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ForecastForm = () => {
  // ✅ CORRECT - All hooks at component level
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // State management
  const [forecast, setForecast] = useState({
    period: {
      year: new Date().getFullYear(),
      quarter: Math.ceil((new Date().getMonth() + 1) / 3)
    },
    items: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Default item structure
  const defaultItem = {
    position: '',
    workforceType: 'FT',
    gradeLevel: '',
    employeeType: 'Permanent',
    location: 'Head Office',
    skills: '',
    currentCount: 0,
    forecastCount: 0,
    salaryBudget: 0,
    oneTimeCost: 0,
    costPerHire: 0,
    currentAverageSalary: 0,
    marketBenchmarkSalary: 0,
    historicalAttritionRate: 0,
    recentResignations: 0,
    criticalSkillsGap: 1,
    marketDemand: 1,
    salaryCompetitiveness: 1,
    workLifeBalance: 1,
    careerGrowthOpportunities: 1,
    expectedStartMonth: '',
    expectedHireDate: '',
    justification: ''
  };

  // Load existing forecast for editing
  useEffect(() => {
    if (isEdit && id) {
      fetchForecast();
    }
  }, [isEdit, id]);

  const fetchForecast = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/forecasts/${id}`);
      
      if (response.data.success) {
        setForecast(response.data.forecast);
      } else {
        setError('Failed to load forecast');
      }
    } catch (error) {
      console.error('Error fetching forecast:', error);
      setError('Failed to load forecast');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setForecast(prev => ({
      ...prev,
      items: [...prev.items, { ...defaultItem }]
    }));
  };

  const removeItem = (index) => {
    setForecast(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setForecast(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const updatePeriod = (field, value) => {
    setForecast(prev => ({
      ...prev,
      period: { ...prev.period, [field]: value }
    }));
  };

  // ✅ FIXED handleSubmit function with proper authentication checks
  const handleSubmit = async (status = 'draft') => {
    console.log('🚀 Starting forecast submission...', { status });
    
    // ✅ Authentication checks using component-level hooks
    console.log('👤 Current user:', user);
    console.log('🔐 Is authenticated:', isAuthenticated());
    
    // Check authentication status
    if (!isAuthenticated()) {
      console.error('❌ User not authenticated');
      setError('Your session has expired. Please log in again.');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    // Verify user object
    // ✅ FIXED - Check for both id formats:
    if (!user || (!user.id && !user._id)) {
      console.error('❌ User object invalid:', user);
      setError('User information missing. Please refresh and try again.');
      return;
    }


    // Check token manually
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No authentication token found');
      setError('Authentication token missing. Please log in again.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    console.log('✅ Authentication checks passed');
    console.log('📝 Form data:', forecast);

    // Validate form data
    if (forecast.items.length === 0) {
      setError('Please add at least one forecast item');
      return;
    }

    // Enhanced validation
    for (let i = 0; i < forecast.items.length; i++) {
      const item = forecast.items[i];
      if (!item.position) {
        setError(`Item ${i + 1}: Position is required`);
        return;
      }
      if (item.historicalAttritionRate < 0 || item.historicalAttritionRate > 1) {
        setError(`Item ${i + 1}: Historical attrition rate must be between 0 and 1`);
        return;
      }
      // Validate risk assessment fields (1-5)
      const riskFields = ['criticalSkillsGap', 'marketDemand', 'salaryCompetitiveness', 'workLifeBalance', 'careerGrowthOpportunities'];
      for (const field of riskFields) {
        if (item[field] < 1 || item[field] > 5) {
          setError(`Item ${i + 1}: ${field} must be between 1 and 5`);
          return;
        }
      }
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        period: {
          year: parseInt(forecast.period.year),
          quarter: parseInt(forecast.period.quarter)
        },
        items: forecast.items.map(item => ({
          ...item,
          skills: typeof item.skills === 'string' ? 
            item.skills.split(',').map(s => s.trim()).filter(Boolean) :
            item.skills || [],
          // Ensure numeric fields are properly converted
          currentCount: parseInt(item.currentCount) || 0,
          forecastCount: parseInt(item.forecastCount) || 0,
          salaryBudget: parseFloat(item.salaryBudget) || 0,
          oneTimeCost: parseFloat(item.oneTimeCost) || 0,
          costPerHire: parseFloat(item.costPerHire) || 0,
          currentAverageSalary: parseFloat(item.currentAverageSalary) || 0,
          marketBenchmarkSalary: parseFloat(item.marketBenchmarkSalary) || 0,
          historicalAttritionRate: parseFloat(item.historicalAttritionRate) || 0,
          recentResignations: parseInt(item.recentResignations) || 0,
          criticalSkillsGap: parseInt(item.criticalSkillsGap) || 1,
          marketDemand: parseInt(item.marketDemand) || 1,
          salaryCompetitiveness: parseInt(item.salaryCompetitiveness) || 1,
          workLifeBalance: parseInt(item.workLifeBalance) || 1,
          careerGrowthOpportunities: parseInt(item.careerGrowthOpportunities) || 1
        })),
        status: status
      };
      
      console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));
      
      // Ensure token is in headers
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      let response;
      if (isEdit) {
        response = await axios.put(`/api/forecasts/${id}`, payload, config);
      } else {
        response = await axios.post('/api/forecasts', payload, config);
      }
      
      console.log('✅ Server response:', response.data);
      
      if (response.data.success) {
        const message = status === 'submitted' ? 
          'Forecast submitted successfully for review!' : 
          'Forecast saved as draft successfully!';
        
        setSuccess(message);
        setError('');
        
        // Navigate after a brief delay to show success message
        setTimeout(() => {
          navigate('/forecasts');
        }, 1500);
      } else {
        setError(response.data.message || 'Failed to save forecast');
      }
       
    } catch (error) {
      console.error('❌ Forecast submission error:', error);
      
      if (error.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.data) {
        setError(typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data));
      } else if (error.code === 'NETWORK_ERROR') {
        setError('Network error. Please check your connection and ensure the backend server is running.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading forecast...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {isEdit ? 'Edit Forecast' : 'New Forecast'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Forecast Period
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={forecast.period.year}
                  label="Year"
                  onChange={(e) => updatePeriod('year', e.target.value)}
                >
                  {[2023, 2024, 2025, 2026, 2027].map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Quarter</InputLabel>
                <Select
                  value={forecast.period.quarter}
                  label="Quarter"
                  onChange={(e) => updatePeriod('quarter', e.target.value)}
                >
                  {[1, 2, 3, 4].map(quarter => (
                    <MenuItem key={quarter} value={quarter}>Q{quarter}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Forecast Items ({forecast.items.length})
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={addItem}
            >
              Add Position
            </Button>
          </Box>

          {forecast.items.length === 0 ? (
            <Alert severity="info">
              No forecast items added yet. Click "Add Position" to get started.
            </Alert>
          ) : (
            forecast.items.map((item, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Position {index + 1}
                  </Typography>
                  <IconButton
                    color="error"
                    onClick={() => removeItem(index)}
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                </Box>

                <Grid container spacing={2}>
                  {/* Basic Information */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Basic Information
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Position Title"
                      value={item.position}
                      onChange={(e) => updateItem(index, 'position', e.target.value)}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Workforce Type</InputLabel>
                      <Select
                        value={item.workforceType}
                        label="Workforce Type"
                        onChange={(e) => updateItem(index, 'workforceType', e.target.value)}
                      >
                        <MenuItem value="FT">Full Time</MenuItem>
                        <MenuItem value="PT">Part Time</MenuItem>
                        <MenuItem value="CT">Contract</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Grade Level"
                      value={item.gradeLevel}
                      onChange={(e) => updateItem(index, 'gradeLevel', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel>Employee Type</InputLabel>
                      <Select
                        value={item.employeeType}
                        label="Employee Type"
                        onChange={(e) => updateItem(index, 'employeeType', e.target.value)}
                      >
                        <MenuItem value="Permanent">Permanent</MenuItem>
                        <MenuItem value="Contract">Contract</MenuItem>
                        <MenuItem value="Temporary">Temporary</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Location"
                      value={item.location}
                      onChange={(e) => updateItem(index, 'location', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Skills (comma separated)"
                      value={item.skills}
                      onChange={(e) => updateItem(index, 'skills', e.target.value)}
                    />
                  </Grid>

                  {/* Headcount & Budget */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Headcount & Budget
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Current Count"
                      type="number"
                      value={item.currentCount}
                      onChange={(e) => updateItem(index, 'currentCount', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Forecast Count"
                      type="number"
                      value={item.forecastCount}
                      onChange={(e) => updateItem(index, 'forecastCount', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Variance"
                      type="number"
                      value={item.forecastCount - item.currentCount}
                      InputProps={{ readOnly: true }}
                      helperText="Automatically calculated"
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Annual Salary Budget"
                      type="number"
                      value={item.salaryBudget}
                      onChange={(e) => updateItem(index, 'salaryBudget', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="One-time Costs"
                      type="number"
                      value={item.oneTimeCost}
                      onChange={(e) => updateItem(index, 'oneTimeCost', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Recruitment Cost"
                      type="number"
                      value={item.costPerHire}
                      onChange={(e) => updateItem(index, 'costPerHire', e.target.value)}
                    />
                  </Grid>

                  {/* Salary Benchmarking */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Salary Benchmarking
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Current Average Salary"
                      type="number"
                      value={item.currentAverageSalary}
                      onChange={(e) => updateItem(index, 'currentAverageSalary', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Market Benchmark Salary"
                      type="number"
                      value={item.marketBenchmarkSalary}
                      onChange={(e) => updateItem(index, 'marketBenchmarkSalary', e.target.value)}
                    />
                  </Grid>

                  {/* Historical Attrition Data */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Historical Attrition Data
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Historical Attrition Rate (0-1)"
                      type="number"
                      inputProps={{ min: 0, max: 1, step: 0.01 }}
                      value={item.historicalAttritionRate}
                      onChange={(e) => updateItem(index, 'historicalAttritionRate', e.target.value)}
                      helperText="Enter as decimal (e.g., 0.15 for 15%)"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Recent Resignations"
                      type="number"
                      value={item.recentResignations}
                      onChange={(e) => updateItem(index, 'recentResignations', e.target.value)}
                    />
                  </Grid>

                  {/* Risk Assessment */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Risk Assessment (1-5 Scale)
                    </Typography>
                  </Grid>

                  {[
                    { field: 'criticalSkillsGap', label: 'Critical Skills Gap' },
                    { field: 'marketDemand', label: 'Market Demand' },
                    { field: 'salaryCompetitiveness', label: 'Salary Competitiveness' },
                    { field: 'workLifeBalance', label: 'Work-Life Balance' },
                    { field: 'careerGrowthOpportunities', label: 'Career Growth Opportunities' }
                  ].map(({ field, label }) => (
                    <Grid item xs={12} md={2.4} key={field}>
                      <FormControl fullWidth>
                        <InputLabel>{label}</InputLabel>
                        <Select
                          value={item[field]}
                          label={label}
                          onChange={(e) => updateItem(index, field, e.target.value)}
                        >
                          {[1, 2, 3, 4, 5].map(num => (
                            <MenuItem key={num} value={num}>{num}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  ))}

                  {/* Timing */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Timing
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Expected Start Month"
                      value={item.expectedStartMonth}
                      onChange={(e) => updateItem(index, 'expectedStartMonth', e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Expected Hire Date"
                      type="date"
                      value={item.expectedHireDate}
                      onChange={(e) => updateItem(index, 'expectedHireDate', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  {/* Justification */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                      Justification
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Business Justification"
                      multiline
                      rows={3}
                      value={item.justification}
                      onChange={(e) => updateItem(index, 'justification', e.target.value)}
                      placeholder="Explain the business need for this position..."
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Box display="flex" gap={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          onClick={() => navigate('/forecasts')}
          disabled={loading}
        >
          Cancel
        </Button>
        
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          onClick={() => handleSubmit('draft')}
          disabled={loading || forecast.items.length === 0}
        >
          {loading ? 'Saving...' : 'Save as Draft'}
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} /> : <Send />}
          onClick={() => handleSubmit('submitted')}
          disabled={loading || forecast.items.length === 0}
        >
          {loading ? 'Submitting...' : 'Submit for Review'}
        </Button>
      </Box>
    </Box>
  );
};

export default ForecastForm;
