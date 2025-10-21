import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Forecasts from './pages/Forecasts';
import ForecastForm from './pages/ForecastForm';
import ForecastReview from './pages/ForecastReview';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Departments from './pages/Departments';
import ReminderControl from './components/ReminderControl'; // NEW: Import ReminderControl
import { ProtectedRoute } from './components/ProtectedRoute';
import './utils/api';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/forecasts" element={<Forecasts />} />
                    <Route path="/forecasts/new" element={<ForecastForm />} />
                    <Route path="/forecasts/:id/edit" element={<ForecastForm />} />
                    <Route path="/forecast-review" element={<ForecastReview />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/departments" element={<Departments />} />
                    <Route 
                      path="/reminder-control" 
                      element={
                        <ProtectedRoute allowedRoles={['Admin']}>
                          <ReminderControl />
                        </ProtectedRoute>
                      } 
                    />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
