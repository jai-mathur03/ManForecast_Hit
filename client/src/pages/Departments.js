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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import axios from 'axios';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { control, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/departments');
      setDepartments(response.data);
    } catch (error) {
      setError('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (department = null) => {
    setEditingDepartment(department);
    if (department) {
      reset({
        name: department.name,
        code: department.code,
        description: department.description || ''
      });
    } else {
      reset({
        name: '',
        code: '',
        description: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingDepartment(null);
    setError('');
    setSuccess('');
  };

  const onSubmit = async (data) => {
    try {
      if (editingDepartment) {
        await axios.put(`/api/departments/${editingDepartment._id}`, data);
        setSuccess('Department updated successfully');
      } else {
        await axios.post('/api/departments', data);
        setSuccess('Department created successfully');
      }
      fetchDepartments();
      handleCloseDialog();
    } catch (error) {
      setError(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (departmentId) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await axios.delete(`/api/departments/${departmentId}`);
        fetchDepartments();
        setSuccess('Department deleted successfully');
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete department');
      }
    }
  };

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
        <Typography variant="h4">Departments</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Department
        </Button>
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

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.map((department) => (
                  <TableRow key={department._id}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {department.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={department.code}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {department.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={department.isActive ? 'Active' : 'Inactive'}
                        color={department.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(department.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(department)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(department._id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Department Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDepartment ? 'Edit Department' : 'Add New Department'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Department name is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Department Name"
                  margin="normal"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />

            <Controller
              name="code"
              control={control}
              rules={{ required: 'Department code is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Department Code"
                  margin="normal"
                  placeholder="e.g., IT, HR, FIN"
                  error={!!errors.code}
                  helperText={errors.code?.message}
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Description"
                  margin="normal"
                  multiline
                  rows={3}
                  placeholder="Department description (optional)"
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingDepartment ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Departments;
