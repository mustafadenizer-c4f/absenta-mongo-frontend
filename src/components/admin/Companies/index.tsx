// src/components/admin/Companies/index.tsx
import React, { useState, useEffect } from 'react';
import { useAutoClearing } from '../../../hooks/useAutoClearing';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import {
  fetchCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  clearOrganizationError,
} from '../../../store/slices/organizationSlice';
import { Company } from '../../../types';
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
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Refresh,
  Business,
} from '@mui/icons-material';
import { useLanguage } from '../../../contexts/LanguageContext';

const Companies: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { companies, loading } = useSelector((state: RootState) => state.organization);
  const { langPackLabel } = useLanguage();

  const [error, setError] = useAutoClearing(7000);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  const handleOpenDialog = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setName(company.name);
    } else {
      setEditingCompany(null);
      setName('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCompany(null);
    setName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await dispatch(updateCompany({ id: editingCompany.id, name })).unwrap();
      } else {
        await dispatch(createCompany(name)).unwrap();
      }
      handleCloseDialog();
    } catch (err: any) {
      setError(typeof err === 'string' ? err : err.message || langPackLabel("txtSomethingWentWrong") || 'An error occurred');
    }
  };

  const handleDeleteClick = (company: Company) => {
    setDeletingCompany(company);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCompany) return;
    try {
      await dispatch(deleteCompany(deletingCompany.id)).unwrap();
      setDeleteConfirmOpen(false);
      setDeletingCompany(null);
    } catch (err: any) {
      setError(typeof err === 'string' ? err : err.message || langPackLabel("txtSomethingWentWrong") || 'An error occurred');
      setDeleteConfirmOpen(false);
      setDeletingCompany(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setDeletingCompany(null);
  };

  const handleRefresh = () => {
    setError(null);
    dispatch(clearOrganizationError());
    dispatch(fetchCompanies());
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading && companies.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600 }}>
          {langPackLabel("txtCompaniesManagement") || "Companies Management"}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={handleRefresh}>
            {langPackLabel("txtRefresh") || "Refresh"}
          </Button>
          <Button variant="contained" size="small" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            {langPackLabel("txtAddCompany") || "Add Company"}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Companies Table */}
      <Paper sx={{ mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>{langPackLabel("txtName") || "Name"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtCreatedAt") || "Created At"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtActions") || "Actions"}</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Box sx={{ py: 4 }}>
                      <Business sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                      <Typography color="text.secondary">
                        {langPackLabel("txtNoCompaniesYet") || 'No companies configured yet. Click "Add Company" to get started.'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow key={company.id} hover>
                    <TableCell>
                      <Typography fontWeight="medium">{company.name}</Typography>
                    </TableCell>
                    <TableCell>{formatDate(company.created_at)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(company)}
                          color="primary"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(company)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCompany ? (langPackLabel("txtEditCompany") || 'Edit Company') : (langPackLabel("txtAddNewCompany") || 'Add New Company')}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label={langPackLabel("txtCompanyName") || "Company Name"}
              type="text"
              fullWidth
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{langPackLabel("txtCancel") || "Cancel"}</Button>
            <Button type="submit" variant="contained">
              {editingCompany ? (langPackLabel("txtUpdateProfile") || 'Update') : (langPackLabel("txtCreate") || 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleDeleteCancel}>
        <DialogTitle>{langPackLabel("txtConfirmDelete") || "Confirm Delete"}</DialogTitle>
        <DialogContent>
          <Typography>
            {langPackLabel("txtDeleteCompanyConfirm") || 'Are you sure you want to delete the company'} "{deletingCompany?.name}"?
            {langPackLabel("txtCannotBeUndone") || "This action cannot be undone."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>{langPackLabel("txtCancel") || "Cancel"}</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            {langPackLabel("txtDelete") || "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Companies;
