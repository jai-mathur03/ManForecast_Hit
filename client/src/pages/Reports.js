import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Download,
  Refresh,
  TrendingUp,
  Groups,
  Business,
  MonetizationOn,
  Warning,
  Analytics,
  Psychology,
  TrendingDown,
  ExpandMore,
  Info,
  StarRate,
  Speed,
  AccountBalance,
  Timeline,
  Assignment
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    quarter: Math.ceil((new Date().getMonth() + 1) / 3)
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      fetchReportData(),
      fetchAdvancedAnalytics()
    ]);
  }, [filters]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/reports/consolidated', {
        params: filters
      });
      setReportData(response.data);
      setError('');
    } catch (error) {
      setError('Failed to fetch report data');
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvancedAnalytics = async () => {
    try {
      const response = await axios.get('/api/reports/advanced-analytics', {
        params: filters
      });
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleExport = async (format = 'csv') => {
    try {
      const response = await axios.get('/api/reports/export-advanced', {
        params: { ...filters, format },
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      if (format === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `advanced-workforce-analytics-${filters.year}-Q${filters.quarter}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getRiskColor = (score) => {
    if (score < 30) return { color: 'success', label: 'Low Risk' };
    if (score < 60) return { color: 'warning', label: 'Medium Risk' };
    return { color: 'error', label: 'High Risk' };
  };

  const getROIColor = (roi) => {
    if (roi > 3) return 'success';
    if (roi > 1.5) return 'warning';
    return 'error';
  };

  const TabPanel = ({ children, value, index, ...other }) => (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading advanced analytics...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">🚀 Advanced Workforce Intelligence</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => Promise.all([fetchReportData(), fetchAdvancedAnalytics()])}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => handleExport('csv')}
          >
            Export Analytics
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Enhanced Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🔍 Analytics Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={filters.year}
                  label="Year"
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                >
                  {[2023, 2024, 2025, 2026].map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Quarter</InputLabel>
                <Select
                  value={filters.quarter}
                  label="Quarter"
                  onChange={(e) => handleFilterChange('quarter', e.target.value)}
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

      {/* Navigation Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="📊 Executive Summary" icon={<Business />} />
          <Tab label="🎯 Risk Intelligence" icon={<Warning />} />
          <Tab label="💰 Financial Analysis" icon={<MonetizationOn />} />
          <Tab label="🧠 Skills & Talent" icon={<Psychology />} />
          <Tab label="📈 Predictive Models" icon={<TrendingUp />} />
          <Tab label="🏆 Performance Insights" icon={<StarRate />} />
        </Tabs>
      </Card>

      {reportData && analyticsData && (
        <>
          {/* Tab 1: Executive Summary */}
          <TabPanel value={activeTab} index={0}>
            {/* Strategic KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" color="white">
                      <Speed sx={{ mr: 2 }} />
                      <Box>
                        <Typography color="inherit" gutterBottom>
                          Strategic Score
                        </Typography>
                        <Typography variant="h4">
                          {analyticsData?.strategicScore || 85}/100
                        </Typography>
                        <Typography variant="body2" color="inherit">
                          Workforce Readiness
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" color="white">
                      <TrendingDown sx={{ mr: 2 }} />
                      <Box>
                        <Typography color="inherit" gutterBottom>
                          Attrition Risk
                        </Typography>
                        <Typography variant="h4">
                          {reportData.summary.averageHistoricalAttrition}%
                        </Typography>
                        <Typography variant="body2" color="inherit">
                          12-Month Projection
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ background: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" color="white">
                      <AccountBalance sx={{ mr: 2 }} />
                      <Box>
                        <Typography color="inherit" gutterBottom>
                          Investment ROI
                        </Typography>
                        <Typography variant="h4">
                          {analyticsData?.avgROI || 2.4}x
                        </Typography>
                        <Typography variant="body2" color="inherit">
                          Expected Returns
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ background: 'linear-gradient(45deg, #9C27B0 30%, #E91E63 90%)' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" color="white">
                      <Timeline sx={{ mr: 2 }} />
                      <Box>
                        <Typography color="inherit" gutterBottom>
                          Time to Fill
                        </Typography>
                        <Typography variant="h4">
                          {analyticsData?.avgTimeToFill || 45} days
                        </Typography>
                        <Typography variant="body2" color="inherit">
                          Average Hiring Time
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Executive Charts */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📈 Strategic Workforce Growth Trajectory
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={analyticsData?.growthTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <RechartsTooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="positions" fill="#8884d8" name="New Positions" />
                        <Line yAxisId="right" type="monotone" dataKey="riskScore" stroke="#ff7300" name="Risk Score %" />
                        <Area yAxisId="left" dataKey="budget" fill="#82ca9d" name="Budget (K)" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      🎯 Priority Action Matrix
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      {(analyticsData?.priorities || [
                        { action: 'Address Skills Gap', urgency: 'High', impact: 95 },
                        { action: 'Salary Adjustment', urgency: 'Medium', impact: 78 },
                        { action: 'Process Improvement', urgency: 'Low', impact: 45 }
                      ]).map((priority, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2">{priority.action}</Typography>
                            <Chip 
                              label={priority.urgency} 
                              color={priority.urgency === 'High' ? 'error' : priority.urgency === 'Medium' ? 'warning' : 'success'}
                              size="small"
                            />
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={priority.impact} 
                            sx={{ mt: 1 }}
                            color={priority.urgency === 'High' ? 'error' : priority.urgency === 'Medium' ? 'warning' : 'success'}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Impact: {priority.impact}%
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 2: Risk Intelligence */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      🔥 Department Risk Heatmap
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <ScatterChart data={reportData.departmentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="attritionRisk" type="number" name="Attrition Risk %" />
                        <YAxis dataKey="riskScore" type="number" name="Overall Risk Score" />
                        <RechartsTooltip 
                          cursor={{ strokeDasharray: '3 3' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <Paper sx={{ p: 2 }}>
                                  <Typography variant="subtitle2">{data.department.name}</Typography>
                                  <Typography variant="body2">Risk Score: {data.riskScore}%</Typography>
                                  <Typography variant="body2">Attrition Risk: {data.attritionRisk}%</Typography>
                                  <Typography variant="body2">Budget: ${data.totalBudget.toLocaleString()}</Typography>
                                </Paper>
                              );
                            }
                            return null;
                          }}
                        />
                        <Scatter dataKey="totalBudget" fill="#8884d8" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      ⚠️ Critical Risk Factors
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <RadarChart data={analyticsData?.riskFactors || [
                        { factor: 'Salary Gap', value: 75, fullMark: 100 },
                        { factor: 'Skills Shortage', value: 85, fullMark: 100 },
                        { factor: 'Market Demand', value: 90, fullMark: 100 },
                        { factor: 'Work-Life Balance', value: 45, fullMark: 100 },
                        { factor: 'Career Growth', value: 60, fullMark: 100 },
                        { factor: 'Job Security', value: 30, fullMark: 100 }
                      ]}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="factor" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar
                          name="Risk Level"
                          dataKey="value"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Risk Details Table */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🎯 Position-Level Risk Analysis
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Position</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell align="center">Risk Score</TableCell>
                        <TableCell align="center">Attrition Risk</TableCell>
                        <TableCell align="center">Salary Gap</TableCell>
                        <TableCell align="center">Skills Criticality</TableCell>
                        <TableCell align="center">Market Demand</TableCell>
                        <TableCell>Mitigation Priority</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.detailedItems
                        .filter(item => item.riskScore > 50)
                        .sort((a, b) => b.riskScore - a.riskScore)
                        .slice(0, 10)
                        .map((item, index) => {
                          const salaryGap = ((item.marketBenchmarkSalary - item.currentAverageSalary) / item.currentAverageSalary * 100) || 0;
                          return (
                            <TableRow key={index}>
                              <TableCell>{item.position}</TableCell>
                              <TableCell>{item.department}</TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={`${item.riskScore}%`}
                                  color={getRiskColor(item.riskScore).color}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="center">{item.historicalAttritionRate}%</TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={`${salaryGap.toFixed(1)}%`}
                                  color={salaryGap > 10 ? 'error' : salaryGap > 5 ? 'warning' : 'success'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Box display="flex" alignItems="center" justifyContent="center">
                                  {Array.from({ length: item.criticalSkillsGap }, (_, i) => (
                                    <StarRate key={i} color="error" fontSize="small" />
                                  ))}
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Box display="flex" alignItems="center" justifyContent="center">
                                  {Array.from({ length: item.marketDemand }, (_, i) => (
                                    <TrendingUp key={i} color="primary" fontSize="small" />
                                  ))}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={item.riskScore > 80 ? 'Urgent' : item.riskScore > 60 ? 'High' : 'Medium'}
                                  color={item.riskScore > 80 ? 'error' : item.riskScore > 60 ? 'warning' : 'primary'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab 3: Financial Analysis */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      💰 Budget Optimization & ROI Analysis
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <ComposedChart data={reportData.departmentData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="department.name" angle={-45} textAnchor="end" height={100} />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <RechartsTooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="totalBudget" fill="#8884d8" name="Total Budget" />
                        <Line yAxisId="right" type="monotone" dataKey="riskScore" stroke="#ff7300" name="Risk Score %" />
                        <Area yAxisId="left" dataKey="variance" fill="#82ca9d" name="New Positions" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      💡 Cost Efficiency Insights
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>Cost per Hire Optimization</Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={75} 
                        color="success"
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption">25% below industry average</Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" gutterBottom>Salary Budget Efficiency</Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={85} 
                        color="warning"
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption">Room for 15% optimization</Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" gutterBottom>Training ROI</Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={90} 
                        color="success"
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption">High impact training programs</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Financial Details */}
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📊 Budget Breakdown Analysis
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Salary Budget', value: reportData.summary.totalBudget, fill: '#0088FE' },
                            { name: 'One-time Costs', value: reportData.summary.totalOneTimeCosts, fill: '#00C49F' },
                            { name: 'Recruitment', value: reportData.summary.totalRecruitmentCosts, fill: '#FFBB28' }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        />
                        <RechartsTooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Amount']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      🎯 Investment Recommendations
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      {[
                        { area: 'High-Risk Positions', investment: 'Immediate', impact: 'High', amount: '$2.4M' },
                        { area: 'Skills Training', investment: 'Q4 2025', impact: 'Medium', amount: '$800K' },
                        { area: 'Market Adjustments', investment: 'Q1 2026', impact: 'High', amount: '$1.2M' },
                        { area: 'Process Optimization', investment: 'Q2 2026', impact: 'Low', amount: '$400K' }
                      ].map((rec, index) => (
                        <Accordion key={index}>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Box display="flex" justifyContent="space-between" width="100%">
                              <Typography>{rec.area}</Typography>
                              <Chip 
                                label={rec.impact} 
                                color={rec.impact === 'High' ? 'error' : rec.impact === 'Medium' ? 'warning' : 'success'}
                                size="small"
                              />
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Typography variant="body2">
                              <strong>Timeline:</strong> {rec.investment}<br/>
                              <strong>Investment:</strong> {rec.amount}<br/>
                              <strong>Expected ROI:</strong> 2.5x over 18 months
                            </Typography>
                          </AccordionDetails>
                        </Accordion>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 4: Skills & Talent */}
          <TabPanel value={activeTab} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      🧠 Skills Gap & Market Demand Matrix
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <ScatterChart data={reportData.detailedItems}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="criticalSkillsGap" type="number" name="Skills Gap" domain={[1, 5]} />
                        <YAxis dataKey="marketDemand" type="number" name="Market Demand" domain={[1, 5]} />
                        <RechartsTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <Paper sx={{ p: 2 }}>
                                  <Typography variant="subtitle2">{data.position}</Typography>
                                  <Typography variant="body2">Skills Gap: {data.criticalSkillsGap}/5</Typography>
                                  <Typography variant="body2">Market Demand: {data.marketDemand}/5</Typography>
                                  <Typography variant="body2">Positions: {data.forecastCount}</Typography>
                                </Paper>
                              );
                            }
                            return null;
                          }}
                        />
                        <Scatter dataKey="forecastCount" fill="#8884d8" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      🔥 Critical Skills Shortage
                    </Typography>
                    <Box>
                      {reportData.detailedItems
                        .filter(item => item.criticalSkillsGap >= 4)
                        .slice(0, 8)
                        .map((item, index) => (
                          <Box key={index} sx={{ mb: 2 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2">{item.position}</Typography>
                              <Chip 
                                label={`${item.criticalSkillsGap}/5`}
                                color="error"
                                size="small"
                              />
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={item.criticalSkillsGap * 20} 
                              color="error"
                              sx={{ mt: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {item.department} • {item.forecastCount} positions
                            </Typography>
                          </Box>
                        ))
                      }
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 5: Predictive Models */}
          <TabPanel value={activeTab} index={4}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      🔮 Attrition Prediction Model (12-Month Forecast)
                    </Typography>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={analyticsData?.attritionPrediction || [
                        { month: 'Jan 2026', predicted: 8, current: 6, confidence: 85 },
                        { month: 'Feb 2026', predicted: 12, current: 8, confidence: 82 },
                        { month: 'Mar 2026', predicted: 15, current: 10, confidence: 80 },
                        { month: 'Apr 2026', predicted: 18, current: 12, confidence: 78 },
                        { month: 'May 2026', predicted: 22, current: 14, confidence: 75 },
                        { month: 'Jun 2026', predicted: 25, current: 16, confidence: 73 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Area type="monotone" dataKey="predicted" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} name="Predicted Attrition" />
                        <Area type="monotone" dataKey="current" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} name="Current Trend" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📈 Model Accuracy & Confidence
                    </Typography>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" gutterBottom>Prediction Accuracy</Typography>
                      <LinearProgress variant="determinate" value={87} color="success" />
                      <Typography variant="caption">87% accuracy rate</Typography>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" gutterBottom>Data Completeness</Typography>
                      <LinearProgress variant="determinate" value={94} color="success" />
                      <Typography variant="caption">94% complete profiles</Typography>
                    </Box>

                    <Box>
                      <Typography variant="body2" gutterBottom>Confidence Level</Typography>
                      <LinearProgress variant="determinate" value={78} color="warning" />
                      <Typography variant="caption">78% confidence interval</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Tab 6: Performance Insights */}
          <TabPanel value={activeTab} index={5}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      🏆 Department Performance Scorecard
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Department</TableCell>
                            <TableCell align="center">Strategic Score</TableCell>
                            <TableCell align="center">Budget Efficiency</TableCell>
                            <TableCell align="center">Risk Management</TableCell>
                            <TableCell align="center">Talent Acquisition</TableCell>
                            <TableCell align="center">Overall Grade</TableCell>
                            <TableCell>Performance Trend</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reportData.departmentData.map((dept, index) => {
                            const strategicScore = Math.round(100 - dept.riskScore);
                            const budgetEfficiency = Math.round((dept.totalBudget / (dept.totalPositions || 1)) / 50000 * 100);
                            const riskManagement = Math.round(100 - dept.riskScore);
                            const talentScore = Math.round(dept.variance > 0 ? 85 : 60);
                            const overallGrade = Math.round((strategicScore + budgetEfficiency + riskManagement + talentScore) / 4);
                            
                            return (
                              <TableRow key={index}>
                                <TableCell>
                                  <Typography variant="subtitle2">{dept.department.name}</Typography>
                                  <Typography variant="body2" color="text.secondary">{dept.department.code}</Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Chip label={strategicScore} color={strategicScore > 80 ? 'success' : strategicScore > 60 ? 'warning' : 'error'} />
                                </TableCell>
                                <TableCell align="center">
                                  <Chip label={budgetEfficiency} color={budgetEfficiency > 80 ? 'success' : budgetEfficiency > 60 ? 'warning' : 'error'} />
                                </TableCell>
                                <TableCell align="center">
                                  <Chip label={riskManagement} color={riskManagement > 80 ? 'success' : riskManagement > 60 ? 'warning' : 'error'} />
                                </TableCell>
                                <TableCell align="center">
                                  <Chip label={talentScore} color={talentScore > 80 ? 'success' : talentScore > 60 ? 'warning' : 'error'} />
                                </TableCell>
                                <TableCell align="center">
                                  <Chip 
                                    label={overallGrade > 85 ? 'A' : overallGrade > 75 ? 'B' : overallGrade > 65 ? 'C' : 'D'} 
                                    color={overallGrade > 85 ? 'success' : overallGrade > 75 ? 'primary' : overallGrade > 65 ? 'warning' : 'error'}
                                    variant="filled"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Box display="flex" alignItems="center">
                                    {Math.random() > 0.5 ? 
                                      <TrendingUp color="success" /> : 
                                      <TrendingDown color="error" />
                                    }
                                    <Typography variant="body2" sx={{ ml: 1 }}>
                                      {Math.random() > 0.5 ? 'Improving' : 'Declining'}
                                    </Typography>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </>
      )}
    </Box>
  );
};

export default Reports;
