import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import { CheckCircle, Cancel, Visibility } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ForecastReview = () => {
  const [forecasts, setForecasts] = useState([]); // Initialize as empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedForecast, setSelectedForecast] = useState(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewComments, setReviewComments] = useState('');
  const [reviewAction, setReviewAction] = useState('');
  const [filters, setFilters] = useState({
    status: 'submitted', // Default to submitted forecasts
    department: 'all'
  });

  const { user } = useAuth();

  useEffect(() => {
    fetchForecastsForReview();
  }, [filters]);

  const fetchForecastsForReview = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📋 Fetching forecasts for review...');
      
      // Use the forecasts endpoint with query parameters
      const params = new URLSearchParams();
      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }
      
      const response = await axios.get(`/api/forecasts${params.toString() ? '?' + params.toString() : ''}`);
      
      console.log('📊 Raw response:', response.data);
      
      // Handle both old and new response formats
      let forecastsData = [];
      if (response.data.success && Array.isArray(response.data.forecasts)) {
        forecastsData = response.data.forecasts;
      } else if (Array.isArray(response.data)) {
        forecastsData = response.data;
      } else {
        console.warn('⚠️ Unexpected response format:', response.data);
        forecastsData = [];
      }
      
      // Filter by status if needed (client-side filtering as backup)
      if (filters.status !== 'all') {
        forecastsData = forecastsData.filter(f => f.status === filters.status);
      }
      
      // Filter by department if needed
      if (filters.department !== 'all') {
        forecastsData = forecastsData.filter(f => 
          f.department && f.department._id === filters.department
        );
      }
      
      console.log(`📊 Processed ${forecastsData.length} forecasts for review`);
      setForecasts(forecastsData);
      
    } catch (error) {
      console.error('❌ Error fetching forecasts for review:', error);
      
      let errorMessage = 'Failed to load forecasts for review.';
      if (error.response?.status === 403) {
        errorMessage = 'Access denied. Finance role required.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      setForecasts([]); // Ensure forecasts is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (forecast, action) => {
    setSelectedForecast(forecast);
    setReviewAction(action);
    setReviewComments('');
    setReviewDialog(true);
  };

    const submitReview = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!selectedForecast || !reviewAction) {
        setError('Missing forecast or action data');
        return;
      }
      
      const payload = {
        status: reviewAction,
        comments: reviewComments.trim() || undefined
      };
      
      console.log(`📝 ${reviewAction === 'approved' ? 'Approving' : 'Rejecting'} forecast:`, {
        forecastId: selectedForecast._id,
        payload: payload
      });
      
      // Get token for authorization
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // ✅ This now matches the backend route: /:id/status
      const response = await axios.put(
        `/api/forecasts/${selectedForecast._id}/status`, 
        payload, 
        config
      );
      
      console.log('✅ Status update response:', response.data);
      
      if (response.data.success) {
        setSuccess(`Forecast ${reviewAction} successfully!`);
        setError('');
        setReviewDialog(false);
        setSelectedForecast(null);
        setReviewAction('');
        setReviewComments('');
        
        // Refresh the forecasts list
        await fetchForecastsForReview();
      } else {
        setError(response.data.message || `Failed to ${reviewAction} forecast`);
      }
      
    } catch (error) {
      console.error('❌ Error updating forecast status:', error);
      
      let errorMessage = 'An unexpected error occurred.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Finance role required.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Forecast not found or endpoint not available.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted': return 'primary';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'reviewed': return 'secondary';
      default: return 'default';
    }
  };

  const calculateForecastSummary = (forecast) => {
    if (!forecast.items || !Array.isArray(forecast.items)) {
      return { totalPositions: 0, totalBudget: 0, totalVariance: 0 };
    }
    
    const totalPositions = forecast.items.reduce((sum, item) => sum + (item.forecastCount || 0), 0);
    const totalBudget = forecast.items.reduce((sum, item) => 
      sum + (item.salaryBudget || 0) + (item.oneTimeCost || 0) + (item.costPerHire || 0), 0);
    const totalVariance = forecast.items.reduce((sum, item) => 
      sum + ((item.forecastCount || 0) - (item.currentCount || 0)), 0);
    
    return { totalPositions, totalBudget, totalVariance };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading forecasts...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Forecast Review Center
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

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="submitted">Submitted</MenuItem>
                  <MenuItem value="reviewed">Reviewed</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="all">All Status</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Reviews
              </Typography>
              <Typography variant="h5">
                {Array.isArray(forecasts) ? forecasts.filter(f => f.status === 'submitted').length : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Budget
              </Typography>
              <Typography variant="h5">
                ${Array.isArray(forecasts) ? forecasts.reduce((sum, f) => sum + calculateForecastSummary(f).totalBudget, 0).toLocaleString() : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Positions
              </Typography>
              <Typography variant="h5">
                {Array.isArray(forecasts) ? forecasts.reduce((sum, f) => sum + calculateForecastSummary(f).totalPositions, 0) : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Approved Today
              </Typography>
              <Typography variant="h5">
                {Array.isArray(forecasts) ? forecasts.filter(f => 
                  f.status === 'approved' && 
                  f.reviewedAt && 
                  new Date(f.reviewedAt).toDateString() === new Date().toDateString()
                ).length : 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Forecasts Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Submitted By</TableCell>
                  <TableCell align="right">Positions</TableCell>
                  <TableCell align="right">Budget</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.isArray(forecasts) && forecasts.length > 0 ? (
                  forecasts.map((forecast) => {
                    const summary = calculateForecastSummary(forecast);
                    
                    return (
                      <TableRow key={forecast._id}>
                        <TableCell>
                          <Typography variant="subtitle2">
                            Q{forecast.period?.quarter} {forecast.period?.year}
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
                        <TableCell>
                          <Typography variant="subtitle2">
                            {forecast.submittedBy?.name || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {forecast.submittedBy?.email || ''}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {summary.totalPositions}
                        </TableCell>
                        <TableCell align="right">
                          ${summary.totalBudget.toLocaleString()}
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
                            'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          <Button
                            startIcon={<Visibility />}
                            size="small"
                            onClick={() => {/* Navigate to view forecast */}}
                            sx={{ mr: 1 }}
                          >
                            View
                          </Button>
                          {forecast.status === 'submitted' && (
                            <>
                              <Button
                                startIcon={<CheckCircle />}
                                size="small"
                                color="success"
                                onClick={() => handleReview(forecast, 'approved')}
                                sx={{ mr: 1 }}
                              >
                                Approve
                              </Button>
                              <Button
                                startIcon={<Cancel />}
                                size="small"
                                color="error"
                                onClick={() => handleReview(forecast, 'rejected')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body1" color="text.secondary">
                        No forecasts available for review
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onClose={() => setReviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {reviewAction === 'approved' ? 'Approve' : 'Reject'} Forecast
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to {reviewAction === 'approved' ? 'approve' : 'reject'} this forecast?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Comments (Optional)"
            value={reviewComments}
            onChange={(e) => setReviewComments(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(false)}>Cancel</Button>
          <Button 
            onClick={submitReview}
            variant="contained"
            color={reviewAction === 'approved' ? 'success' : 'error'}
          >
            {reviewAction === 'approved' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ForecastReview;
