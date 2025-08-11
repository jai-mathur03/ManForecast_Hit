import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📊 Fetching dashboard data...');
      
      const forecastsResponse = await axios.get('/api/forecasts');
      console.log('📋 Raw forecasts response:', forecastsResponse.data);
      
      // Handle both old and new response formats
      let forecasts = [];
      if (forecastsResponse.data.success && Array.isArray(forecastsResponse.data.forecasts)) {
        forecasts = forecastsResponse.data.forecasts;
      } else if (Array.isArray(forecastsResponse.data)) {
        forecasts = forecastsResponse.data;
      } else {
        console.warn('⚠️ Unexpected forecasts response format:', forecastsResponse.data);
        forecasts = [];
      }
      
      console.log(`📊 Processing ${forecasts.length} forecasts`);

      // Calculate statistics with safe data handling
      const totalForecasts = forecasts.length;
      const submittedForecasts = forecasts.filter(f => f.status === 'submitted').length;
      const approvedForecasts = forecasts.filter(f => f.status === 'approved').length;
      const rejectedForecasts = forecasts.filter(f => f.status === 'rejected').length;
      const draftForecasts = forecasts.filter(f => f.status === 'draft').length;
      
      // Calculate total budget from items
      const totalBudget = forecasts.reduce((sum, f) => {
        if (!f.items || !Array.isArray(f.items)) return sum;
        
        const forecastBudget = f.items.reduce((itemSum, item) => {
          const salaryBudget = item.salaryBudget || 0;
          const oneTimeCost = item.oneTimeCost || 0;
          const costPerHire = item.costPerHire || 0;
          return itemSum + salaryBudget + oneTimeCost + costPerHire;
        }, 0);
        
        return sum + forecastBudget;
      }, 0);

      // Calculate total positions
      const totalPositions = forecasts.reduce((sum, f) => {
        if (!f.items || !Array.isArray(f.items)) return sum;
        return sum + f.items.reduce((itemSum, item) => itemSum + (item.forecastCount || 0), 0);
      }, 0);

      // Calculate total variance (new hires needed)
      const totalVariance = forecasts.reduce((sum, f) => {
        if (!f.items || !Array.isArray(f.items)) return sum;
        return sum + f.items.reduce((itemSum, item) => 
          itemSum + ((item.forecastCount || 0) - (item.currentCount || 0)), 0);
      }, 0);

      // Prepare status distribution data
      const statusData = [
        { name: 'Draft', value: draftForecasts, color: '#FFA726' },
        { name: 'Submitted', value: submittedForecasts, color: '#42A5F5' },
        { name: 'Approved', value: approvedForecasts, color: '#66BB6A' },
        { name: 'Rejected', value: rejectedForecasts, color: '#EF5350' }
      ].filter(item => item.value > 0); // Only show non-zero values

      // Department budget analysis
      const departmentData = forecasts.reduce((acc, forecast) => {
        const deptName = forecast.department?.name || 'Unknown Department';
        const deptBudget = forecast.items?.reduce((sum, item) => {
          return sum + (item.salaryBudget || 0) + (item.oneTimeCost || 0) + (item.costPerHire || 0);
        }, 0) || 0;

        const existing = acc.find(item => item.name === deptName);
        if (existing) {
          existing.budget += deptBudget;
          existing.positions += forecast.items?.reduce((sum, item) => sum + (item.forecastCount || 0), 0) || 0;
        } else {
          acc.push({ 
            name: deptName, 
            budget: deptBudget,
            positions: forecast.items?.reduce((sum, item) => sum + (item.forecastCount || 0), 0) || 0
          });
        }
        return acc;
      }, []).sort((a, b) => b.budget - a.budget); // Sort by budget descending

      // Quarter analysis for trend
      const quarterData = forecasts.reduce((acc, forecast) => {
        const quarterKey = `Q${forecast.period?.quarter || 'X'} ${forecast.period?.year || 'Unknown'}`;
        const existing = acc.find(item => item.name === quarterKey);
        const quarterBudget = forecast.items?.reduce((sum, item) => {
          return sum + (item.salaryBudget || 0) + (item.oneTimeCost || 0) + (item.costPerHire || 0);
        }, 0) || 0;

        if (existing) {
          existing.budget += quarterBudget;
          existing.forecasts += 1;
        } else {
          acc.push({ 
            name: quarterKey, 
            budget: quarterBudget, 
            forecasts: 1
          });
        }
        return acc;
      }, []).sort((a, b) => a.name.localeCompare(b.name));

      const dashboardStats = {
        totalForecasts,
        submittedForecasts,
        approvedForecasts,
        rejectedForecasts,
        draftForecasts,
        totalBudget,
        totalPositions,
        totalVariance,
        statusData,
        departmentData,
        quarterData
      };

      console.log('📊 Dashboard stats calculated:', dashboardStats);

      setStats(dashboardStats);
      setError('');

    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
      
      let errorMessage = 'Failed to load dashboard data.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Insufficient permissions.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please check if the backend server is running.';
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = 'Network error. Please check your connection and ensure the backend server is running on port 5000.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      
      // Set empty stats to prevent null errors
      setStats({
        totalForecasts: 0,
        submittedForecasts: 0,
        approvedForecasts: 0,
        rejectedForecasts: 0,
        draftForecasts: 0,
        totalBudget: 0,
        totalPositions: 0,
        totalVariance: 0,
        statusData: [],
        departmentData: [],
        quarterData: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Dashboard</Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Card>
          <CardContent>
            <Typography variant="h6" align="center" color="text.secondary">
              No data available. Please ensure:
            </Typography>
            <Box component="ul" sx={{ mt: 2 }}>
              <li>Backend server is running on port 5000</li>
              <li>MongoDB is connected</li>
              <li>You have created some forecast data</li>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Additional safety check
  if (!stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <Typography variant="h6">No data available</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        {/* Enhanced Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'white' }}>
            <CardContent>
              <Typography color="inherit" gutterBottom>
                Total Forecasts
              </Typography>
              <Typography variant="h4" component="h2">
                {stats.totalForecasts || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Typography color="inherit" gutterBottom>
                Submitted
              </Typography>
              <Typography variant="h4" component="h2">
                {stats.submittedForecasts || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.main', color: 'white' }}>
            <CardContent>
              <Typography color="inherit" gutterBottom>
                Approved
              </Typography>
              <Typography variant="h4" component="h2">
                {stats.approvedForecasts || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'secondary.main', color: 'white' }}>
            <CardContent>
              <Typography color="inherit" gutterBottom>
                Total Budget
              </Typography>
              <Typography variant="h4" component="h2">
                ${(stats.totalBudget || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Additional Stats Row */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Positions
              </Typography>
              <Typography variant="h5" component="h2">
                {stats.totalPositions || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Net Change
              </Typography>
              <Typography 
                variant="h5" 
                component="h2"
                color={stats.totalVariance >= 0 ? 'success.main' : 'error.main'}
              >
                {stats.totalVariance >= 0 ? '+' : ''}{stats.totalVariance || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Draft Forecasts
              </Typography>
              <Typography variant="h5" component="h2">
                {stats.draftForecasts || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Charts Row */}
        {stats.statusData && stats.statusData.length > 0 ? (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Forecast Status Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Forecast Status Distribution
                </Typography>
                <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                  <Typography color="text.secondary">
                    No forecast data available
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {stats.departmentData && stats.departmentData.length > 0 ? (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Budget by Department
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.departmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Budget']} />
                    <Legend />
                    <Bar dataKey="budget" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Budget by Department
                </Typography>
                <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                  <Typography color="text.secondary">
                    No department budget data available
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Quarter Trend Analysis */}
        {stats.quarterData && stats.quarterData.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quarterly Budget Trend
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.quarterData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'budget' ? `$${value.toLocaleString()}` : value,
                        name === 'budget' ? 'Budget' : 'Forecasts'
                      ]} 
                    />
                    <Legend />
                    <Bar dataKey="budget" fill="#8884d8" name="Budget" />
                    <Bar dataKey="forecasts" fill="#82ca9d" name="Forecasts" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;
