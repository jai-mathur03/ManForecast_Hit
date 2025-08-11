import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  Box,
  Chip,
  CircularProgress
} from '@mui/material';
import { Email, Schedule, Warning } from '@mui/icons-material';
import axios from 'axios';

const ReminderControl = () => {
  const [reminderStatus, setReminderStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchReminderStatus();
  }, []);

  const fetchReminderStatus = async () => {
    try {
      const response = await axios.get('/api/forecasts/reminders/status');
      setReminderStatus(response.data.reminderJobs);
    } catch (error) {
      console.error('Error fetching reminder status:', error);
    }
  };

  const triggerManualReminder = async (type) => {
    setLoading(true);
    setMessage('');
    
    try {
      await axios.post('/api/forecasts/reminders/manual', { type });
      setMessage(`${type} reminders sent successfully!`);
    } catch (error) {
      setMessage(`Error sending ${type} reminders: ${error.response?.data?.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🔔 Automated Reminder System
        </Typography>

        {message && (
          <Alert 
            severity={message.includes('Error') ? 'error' : 'success'} 
            sx={{ mb: 2 }}
            onClose={() => setMessage('')}
          >
            {message}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              System Status
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {Object.entries(reminderStatus).map(([jobName, isRunning]) => (
                <Chip
                  key={jobName}
                  label={`${jobName}: ${isRunning ? 'Running' : 'Stopped'}`}
                  color={isRunning ? 'success' : 'error'}
                  size="small"
                  icon={<Schedule />}
                />
              ))}
            </Box>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Email />}
              onClick={() => triggerManualReminder('daily')}
              disabled={loading}
              sx={{ mb: 1 }}
            >
              Send Daily Reminders
            </Button>
            <Typography variant="caption" color="textSecondary">
              Send reminders to HODs with pending forecasts
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Schedule />}
              onClick={() => triggerManualReminder('weekly')}
              disabled={loading}
              sx={{ mb: 1 }}
            >
              Send Weekly Summary
            </Button>
            <Typography variant="caption" color="textSecondary">
              Send weekly summary reminders
            </Typography>
          </Grid>

          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="outlined"
              color="warning"
              startIcon={<Warning />}
              onClick={() => triggerManualReminder('urgent')}
              disabled={loading}
              sx={{ mb: 1 }}
            >
              Send Urgent Warnings
            </Button>
            <Typography variant="caption" color="textSecondary">
              Send urgent deadline warnings
            </Typography>
          </Grid>
        </Grid>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ReminderControl;
