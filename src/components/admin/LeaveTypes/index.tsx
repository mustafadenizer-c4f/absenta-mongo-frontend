// src/components/admin/LeaveTypes/index.tsx
import React, { useState, useEffect } from 'react';
import { useAutoClearing } from '../../../hooks/useAutoClearing';
import { apiClient } from '../../../config/api';
import { useAuth } from '../../../hooks/useAuth';
import Swal from 'sweetalert2';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Refresh,
} from '@mui/icons-material';
import { useLanguage } from '../../../contexts/LanguageContext';

interface LeaveType {
  id: string;
  name: string;
  description?: string;
  default_days: number;
  color_code: string;
  is_active: boolean;
}

const LeaveTypes: React.FC = () => {
  const { langPackLabel } = useLanguage();
  const { user } = useAuth();
  const companyId = user?.company_id;
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useAutoClearing(7000);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    default_days: 0,
    color_code: '#818CF8',
    is_active: true,
  });

  useEffect(() => {
    fetchLeaveTypes();
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLeaveTypes = async () => {
    try {
      setLoading(true);
      const data: LeaveType[] = await apiClient.get('/leave-types');
      setLeaveTypes(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (type?: LeaveType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        description: type.description || '',
        default_days: type.default_days,
        color_code: type.color_code,
        is_active: type.is_active,
      });
    } else {
      setEditingType(null);
      setFormData({
        name: '',
        description: '',
        default_days: 0,
        color_code: '#818CF8',
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingType) {
        // Update existing leave type
        await apiClient.put(`/leave-types/${editingType.id}`, {
          name: formData.name,
          description: formData.description || null,
          default_days: formData.default_days,
          color_code: formData.color_code,
          is_active: formData.is_active,
        });
      } else {
        // Create new leave type
        await apiClient.post('/leave-types', {
          name: formData.name,
          description: formData.description || null,
          default_days: formData.default_days,
          color_code: formData.color_code,
          is_active: formData.is_active,
        });
      }

      handleCloseDialog();
      fetchLeaveTypes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete leave type?',
      text: 'Are you sure you want to delete this leave type?',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Delete',
    });
    if (result.isConfirmed) {
      try {
        await apiClient.delete(`/leave-types/${id}`);
        fetchLeaveTypes();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 600 }}>
          {langPackLabel("txtLeaveTypesManagement") || "Leave Types Management"}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchLeaveTypes}
          >{langPackLabel("txtRefresh") || "Refresh"}</Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >{langPackLabel("txtAddLeaveType") || "Add Leave Type"}</Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Leave Types Table */}
      <Paper sx={{ mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>{langPackLabel("txtName") || "Name"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtDescription") || "Description"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtDefaultDays") || "Default Days"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtColor") || "Color"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtStatus") || "Status"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtActions") || "Actions"}</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaveTypes.map((type) => (
                <TableRow key={type.id} hover>
                  <TableCell>
                    <Typography fontWeight="medium">{type.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {type.description || (langPackLabel("txtNoDescription") || 'No description')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${type.default_days} days`}
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '4px',
                          bgcolor: type.color_code,
                          border: '1px solid #ddd',
                        }}
                      />
                      <Typography variant="body2">
                        {type.color_code}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={type.is_active ? (langPackLabel("txtActive") || 'Active') : (langPackLabel("txtInactive") || 'Inactive')}
                      color={type.is_active ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(type)}
                        color="primary"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(type.id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Stats */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="textSecondary">
              {langPackLabel("txtTotalLeaveTypes") || "Total Leave Types"}
            </Typography>
            <Typography variant="h4" color="primary">
              {leaveTypes.length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">
              {langPackLabel("txtActiveTypes") || "Active Types"}
            </Typography>
            <Typography variant="h4" color="success.main">
              {leaveTypes.filter(t => t.is_active).length}
            </Typography>
          </Box>          
        </Box>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingType ? (langPackLabel("txtEditLeaveType") || 'Edit Leave Type') : (langPackLabel("txtAddNewLeaveType") || 'Add New Leave Type')}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label={langPackLabel("txtLeaveTypeName") || "Leave Type Name"}
              type="text"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              label={langPackLabel("txtDescription") || "Description"}
              type="text"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              label={langPackLabel("txtDefaultDays") || "Default Days"}
              type="number"
              fullWidth
              required
              inputProps={{ min: 0 }}
              value={formData.default_days}
              onChange={(e) => setFormData({...formData, default_days: parseInt(e.target.value) || 0})}
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <TextField
                margin="dense"
                label={langPackLabel("txtColorCode") || "Color Code"}
                type="text"
                fullWidth
                value={formData.color_code}
                onChange={(e) => setFormData({...formData, color_code: e.target.value})}
              />
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '4px',
                  bgcolor: formData.color_code,
                  border: '1px solid #ddd',
                  mt: 1,
                }}
              />
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                />
              }
              label={langPackLabel("txtActive") || "Active"}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{langPackLabel("txtCancel") || "Cancel"}</Button>
            <Button type="submit" variant="contained">
              {editingType ? (langPackLabel("txtUpdateProfile") || 'Update') : (langPackLabel("txtCreate") || 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default LeaveTypes;