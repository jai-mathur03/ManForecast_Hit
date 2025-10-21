import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Add, Edit, Delete, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Forecasts = () => {
  const [forecasts, setForecasts] = useState([]);
  const [filteredForecasts, setFilteredForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    year: 'all',
    quarter: 'all'
  });

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchForecasts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [forecasts, filters]);

  const fetchForecasts = async () => {
    try {
      console.log('📋 Fetching forecasts...');
      const response = await axios.get('/api/forecasts');
      
      console.log('📊 Forecasts response:', response.data);
      
      // Handle both old and new response formats
      const forecastData = response.data.forecasts || response.data;
      setForecasts(forecastData);
      
    } catch (error) {
      console.error('❌ Error fetching forecasts:', error);
      setError('Failed to fetch forecasts');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = forecasts;

    if (filters.status !== 'all') {
      filtered = filtered.filter(f => f.status === filters.status);
    }

    if (filters.year !== 'all') {
      filtered = filtered.filter(f => f.period.year === parseInt(filters.year));
    }

    if (filters.quarter !== 'all') {
      filtered = filtered.filter(f => f.period.quarter === parseInt(filters.quarter));
    }

    setFilteredForecasts(filtered);
  };

  const handleDelete = async (forecastId) => {
    if (window.confirm('Are you sure you want to delete this forecast?')) {
      try {
        await axios.delete(`/api/forecasts/${forecastId}`);
        fetchForecasts();
        setSuccess('Forecast deleted successfully');
      } catch (error) {
        console.error('❌ Error deleting forecast:', error);
        setError('Failed to delete forecast');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'default';
      case 'submitted': return 'primary';
      case 'reviewed': return 'secondary';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const calculateSummary = () => {
    const totalBudget = filteredForecasts.reduce((sum, f) => sum + (f.totalBudget || 0), 0);
    const totalPositions = filteredForecasts.reduce((sum, f) => 
      sum + f.items.reduce((itemSum, item) => itemSum + (item.forecastCount || 0), 0), 0
    );
    const totalVariance = filteredForecasts.reduce((sum, f) => 
      sum + f.items.reduce((itemSum, item) => 
        itemSum + ((item.forecastCount || 0) - (item.currentCount || 0)), 0), 0
    );

    return { totalBudget, totalPositions, totalVariance };
  };

  const summary = calculateSummary();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">My Forecasts</Typography>
        {(user?.role === 'hod' || user?.role === 'admin') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/forecasts/new')}
          >
            New Forecast
          </Button>
        )}
      </Box>

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

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Budget
              </Typography>
              <Typography variant="h5">
                ${summary.totalBudget.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Positions
              </Typography>
              <Typography variant="h5">
                {summary.totalPositions}
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
              <Typography variant="h5" color={summary.totalVariance >= 0 ? 'success.main' : 'error.main'}>
                {summary.totalVariance >= 0 ? '+' : ''}{summary.totalVariance}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="submitted">Submitted</MenuItem>
                  <MenuItem value="reviewed">Reviewed</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={filters.year}
                  label="Year"
                  onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
                >
                  <MenuItem value="all">All Years</MenuItem>
                  {[2023, 2024, 2025, 2026].map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Quarter</InputLabel>
                <Select
                  value={filters.quarter}
                  label="Quarter"
                  onChange={(e) => setFilters(prev => ({ ...prev, quarter: e.target.value }))}
                >
                  <MenuItem value="all">All Quarters</MenuItem>
                  {[1, 2, 3, 4].map(quarter => (
                    <MenuItem key={quarter} value={quarter}>Q{quarter}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Forecasts Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell align="right">Positions</TableCell>
                  <TableCell align="right">Budget</TableCell>
                  <TableCell align="right">Variance</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredForecasts.map((forecast) => {
                  const totalPositions = forecast.items.reduce((sum, item) => sum + (item.forecastCount || 0), 0);
                  const totalVariance = forecast.items.reduce((sum, item) => 
                    sum + ((item.forecastCount || 0) - (item.currentCount || 0)), 0);
                  
                  return (
                    <TableRow key={forecast._id}>
                      <TableCell>
                        <Typography variant="subtitle2">
                          Q{forecast.period.quarter} {forecast.period.year}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">
                          {forecast.department?.name || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {forecast.department?.code || ''}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {totalPositions}
                      </TableCell>
                      <TableCell align="right">
                        ${(forecast.totalBudget || 0).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={totalVariance >= 0 ? `+${totalVariance}` : totalVariance}
                          color={totalVariance >= 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={forecast.status.toUpperCase()}
                          color={getStatusColor(forecast.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {forecast.submittedAt ? 
                          new Date(forecast.submittedAt).toLocaleDateString() : 
                          'Not submitted'
                        }
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/forecasts/${forecast._id}/view`)}
                        >
                          <Visibility />
                        </IconButton>
                        {(user?.role === 'hod' || user?.role === 'admin') && 
                          forecast.status === 'draft' && (
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/forecasts/${forecast._id}/edit`)}
                          >
                            <Edit />
                          </IconButton>
                        )}
                        {(user?.role === 'hod' || user?.role === 'admin') && 
                          forecast.status === 'draft' && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(forecast._id)}
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Forecasts;
