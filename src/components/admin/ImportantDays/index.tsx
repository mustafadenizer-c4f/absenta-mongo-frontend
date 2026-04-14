// src/components/admin/ImportantDays/index.tsx
import React, { useState, useEffect } from 'react';
import { useAutoClearing } from '../../../hooks/useAutoClearing';
import { ImportantDaysService } from '../../../services/importantDays';
import { ImportantDay } from '../../../types';
import { useAuth } from '../../../hooks/useAuth';
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
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Add, Edit, Delete, Refresh } from '@mui/icons-material';
import { useLanguage } from '../../../contexts/LanguageContext';

const ImportantDays: React.FC = () => {
  const { langPackLabel } = useLanguage();
  const { user } = useAuth();
  const companyId = user?.company_id;

  const [importantDays, setImportantDays] = useState<ImportantDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useAutoClearing(7000);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDay, setEditingDay] = useState<ImportantDay | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingDay, setDeletingDay] = useState<ImportantDay | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const emptyForm = {
    name: '',
    name_tr: '',
    date_month: '',
    date_day: '',
    description: '',
    description_tr: '',
    color: '#4caf50',
    is_recurring: true,
    year: '',
  };

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchImportantDays();
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchImportantDays = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ImportantDaysService.getAll(companyId);
      setImportantDays(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (day?: ImportantDay) => {
    setValidationError(null);
    if (day) {
      setEditingDay(day);
      setFormData({
        name: day.name,
        name_tr: day.name_tr || '',
        date_month: String(day.date_month),
        date_day: String(day.date_day),
        description: day.description || '',
        description_tr: day.description_tr || '',
        color: day.color,
        is_recurring: day.is_recurring,
        year: day.year ? String(day.year) : '',
      });
    } else {
      setEditingDay(null);
      setFormData(emptyForm);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDay(null);
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Inline validation
    const month = Number(formData.date_month);
    const day = Number(formData.date_day);

    if (!formData.name.trim()) {
      setValidationError(langPackLabel('txtNameRequired') || 'Name is required.');
      return;
    }
    if (!formData.date_month || isNaN(month) || month < 1 || month > 12) {
      setValidationError(langPackLabel('txtMonthInvalid') || 'Month must be between 1 and 12.');
      return;
    }
    if (!formData.date_day || isNaN(day) || day < 1 || day > 31) {
      setValidationError(langPackLabel('txtDayInvalid') || 'Day must be between 1 and 31.');
      return;
    }
    if (!formData.color) {
      setValidationError(langPackLabel('txtColorRequired') || 'Color is required.');
      return;
    }

    try {
      const payload: any = {
        name: formData.name.trim(),
        name_tr: formData.name_tr.trim() || undefined,
        date_month: month,
        date_day: day,
        description: formData.description.trim() || undefined,
        description_tr: formData.description_tr.trim() || undefined,
        color: formData.color,
        is_recurring: formData.is_recurring,
        company_id: companyId,
      };

      if (!formData.is_recurring && formData.year) {
        payload.year = Number(formData.year);
      }

      if (editingDay) {
        await ImportantDaysService.update(editingDay.id, payload);
      } else {
        await ImportantDaysService.create(payload);
      }

      handleCloseDialog();
      fetchImportantDays();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteClick = (day: ImportantDay) => {
    setDeletingDay(day);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDay) return;
    try {
      await ImportantDaysService.delete(deletingDay.id);
      setDeleteConfirmOpen(false);
      setDeletingDay(null);
      fetchImportantDays();
    } catch (err: any) {
      setError(err.message);
      setDeleteConfirmOpen(false);
      setDeletingDay(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setDeletingDay(null);
  };

  const formatMonthDay = (month: number, day: number) => `${month}/${day}`;

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600 }}>
          {langPackLabel('txtImportantDaysManagement') || 'Important Days Management'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchImportantDays} size="small">
            {langPackLabel('txtRefresh') || 'Refresh'}
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()} size="small">
            {langPackLabel('txtAddImportantDay') || 'Add Important Day'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <Paper sx={{ mb: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>{langPackLabel('txtDate') || 'Date'}</strong></TableCell>
                <TableCell><strong>{langPackLabel('txtImportantDayName') || 'Name (EN)'}</strong></TableCell>
                <TableCell><strong>{langPackLabel('txtImportantDayNameTr') || 'Name (TR)'}</strong></TableCell>
                <TableCell><strong>{langPackLabel('txtImportantDayColor') || 'Color'}</strong></TableCell>
                <TableCell><strong>{langPackLabel('txtRecurring') || 'Recurrence'}</strong></TableCell>
                <TableCell><strong>{langPackLabel('txtActions') || 'Actions'}</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {importantDays.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        {langPackLabel('txtNoImportantDaysYet') || 'No important days configured yet.'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                importantDays.map((day) => (
                  <TableRow key={day.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatMonthDay(day.date_month, day.date_day)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{day.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {day.name_tr || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: 1,
                          backgroundColor: day.color,
                          border: '1px solid rgba(0,0,0,0.2)',
                          display: 'inline-block',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {day.is_recurring
                          ? (langPackLabel('txtRecurringImportantDay') || 'Recurring')
                          : (langPackLabel('txtOneTime') || 'One-time')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => handleOpenDialog(day)} color="primary">
                          <Edit />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteClick(day)} color="error">
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

      {/* Stats */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="textSecondary">
              {langPackLabel('txtImportantDays') || 'Total Important Days'}
            </Typography>
            <Typography variant="h4" color="primary">
              {importantDays.length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">
              {langPackLabel('txtRecurring') || 'Recurring'}
            </Typography>
            <Typography variant="h4" color="success.main">
              {importantDays.filter((d) => d.is_recurring).length}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDay
            ? (langPackLabel('txtEditImportantDay') || 'Edit Important Day')
            : (langPackLabel('txtAddImportantDay') || 'Add Important Day')}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {validationError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {validationError}
              </Alert>
            )}

            <TextField
              autoFocus
              margin="dense"
              label={langPackLabel('txtImportantDayName') || 'Name (English)'}
              type="text"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label={langPackLabel('txtImportantDayNameTr') || 'Name (Turkish)'}
              type="text"
              fullWidth
              value={formData.name_tr}
              onChange={(e) => setFormData({ ...formData, name_tr: e.target.value })}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                margin="dense"
                label={langPackLabel('txtMonth') || 'Month (1–12)'}
                type="number"
                required
                value={formData.date_month}
                onChange={(e) => setFormData({ ...formData, date_month: e.target.value })}
                inputProps={{ min: 1, max: 12 }}
                sx={{ flex: 1 }}
              />
              <TextField
                margin="dense"
                label={langPackLabel('txtDay') || 'Day (1–31)'}
                type="number"
                required
                value={formData.date_day}
                onChange={(e) => setFormData({ ...formData, date_day: e.target.value })}
                inputProps={{ min: 1, max: 31 }}
                sx={{ flex: 1 }}
              />
            </Box>

            <TextField
              margin="dense"
              label={langPackLabel('txtImportantDayDescription') || 'Description (English)'}
              type="text"
              fullWidth
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label={langPackLabel('txtImportantDayDescriptionTr') || 'Description (Turkish)'}
              type="text"
              fullWidth
              multiline
              rows={2}
              value={formData.description_tr}
              onChange={(e) => setFormData({ ...formData, description_tr: e.target.value })}
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {langPackLabel('txtImportantDayColor') || 'Color'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  style={{ width: 48, height: 36, cursor: 'pointer', border: 'none', padding: 0 }}
                />
                <Typography variant="body2" color="text.secondary">{formData.color}</Typography>
              </Box>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                />
              }
              label={langPackLabel('txtRecurringAnnually') || 'Recurring annually'}
              sx={{ mb: 1 }}
            />

            {!formData.is_recurring && (
              <TextField
                margin="dense"
                label={langPackLabel('txtYear') || 'Year'}
                type="number"
                fullWidth
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                inputProps={{ min: 2000, max: 2100 }}
                sx={{ mt: 1 }}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{langPackLabel('txtCancel') || 'Cancel'}</Button>
            <Button type="submit" variant="contained">
              {editingDay ? (langPackLabel('txtUpdateProfile') || 'Update') : (langPackLabel('txtCreate') || 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleDeleteCancel}>
        <DialogTitle>{langPackLabel('txtConfirmDelete') || 'Confirm Delete'}</DialogTitle>
        <DialogContent>
          <Typography>
            {langPackLabel('txtDeleteImportantDayConfirm') || 'Are you sure you want to delete'} "{deletingDay?.name}"?{' '}
            {langPackLabel('txtCannotBeUndone') || 'This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>{langPackLabel('txtCancel') || 'Cancel'}</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            {langPackLabel('txtDelete') || 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImportantDays;
