// src/components/admin/Holidays/index.tsx
import React, { useState, useEffect } from 'react';
import { useAutoClearing } from '../../../hooks/useAutoClearing';
import { HolidaysService } from '../../../services/holidays';
import { Holiday } from '../../../types';
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
import {
  Add,
  Edit,
  Delete,
  Refresh,
  Flag,
} from '@mui/icons-material';
import { useLanguage } from '../../../contexts/LanguageContext';
import LocalizedDatePicker from '../../common/LocalizedDatePicker';

const Holidays: React.FC = () => {
  const { langPackLabel } = useLanguage();
  const { user } = useAuth();
  const companyId = user?.company_id;
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useAutoClearing(7000);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    holiday_date: '',
    holiday_end_date: '',
    description: '',
    is_recurring: false,
  });

  useEffect(() => {
    fetchHolidays();
  }, [companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await HolidaysService.getAll(companyId);
      setHolidays(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (holiday?: Holiday) => {
    if (holiday) {
      setEditingHoliday(holiday);
      setFormData({
        name: holiday.name,
        holiday_date: holiday.holiday_date,
        holiday_end_date: holiday.holiday_end_date || holiday.holiday_date,
        description: holiday.description || '',
        is_recurring: holiday.is_recurring,
      });
    } else {
      setEditingHoliday(null);
      setFormData({
        name: '',
        holiday_date: '',
        holiday_end_date: '',
        description: '',
        is_recurring: false,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingHoliday(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endDate = formData.holiday_end_date || formData.holiday_date;
      const payload = {
        name: formData.name,
        holiday_date: formData.holiday_date,
        holiday_end_date: endDate,
        description: formData.description || null,
        is_recurring: formData.is_recurring,
        company_id: companyId,
      };

      if (editingHoliday) {
        await HolidaysService.update(editingHoliday.id, payload);
      } else {
        await HolidaysService.create(payload);
      }

      handleCloseDialog();
      fetchHolidays();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteClick = (holiday: Holiday) => {
    setDeletingHoliday(holiday);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingHoliday) return;
    try {
      await HolidaysService.delete(deletingHoliday.id);
      setDeleteConfirmOpen(false);
      setDeletingHoliday(null);
      fetchHolidays();
    } catch (err: any) {
      setError(err.message);
      setDeleteConfirmOpen(false);
      setDeletingHoliday(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setDeletingHoliday(null);
  };

  const [seeding, setSeeding] = useState(false);

  const TURKISH_HOLIDAYS = [
    { name: 'Yılbaşı', name_en: 'New Year\'s Day', month: '01', day: '01' },
    { name: 'Ulusal Egemenlik ve Çocuk Bayramı', name_en: 'National Sovereignty and Children\'s Day', month: '04', day: '23' },
    { name: 'Emek ve Dayanışma Günü', name_en: 'Labour Day', month: '05', day: '01' },
    { name: 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı', name_en: 'Commemoration of Atatürk, Youth and Sports Day', month: '05', day: '19' },
    { name: 'Demokrasi ve Millî Birlik Günü', name_en: 'Democracy and National Unity Day', month: '07', day: '15' },
    { name: 'Zafer Bayramı', name_en: 'Victory Day', month: '08', day: '30' },
    { name: 'Cumhuriyet Bayramı', name_en: 'Republic Day', month: '10', day: '28', endDay: '29' },
  ];

  const handleSeedTurkishHolidays = async () => {
    setSeeding(true);
    const year = new Date().getFullYear();
    let added = 0;
    try {
      for (const h of TURKISH_HOLIDAYS) {
        const date = `${year}-${h.month}-${h.day}`;
        const endDate = h.endDay ? `${year}-${h.month}-${h.endDay}` : date;
        // Skip if already exists (same name)
        const exists = holidays.some((existing) => existing.name === h.name);
        if (exists) continue;
        await HolidaysService.create({
          name: h.name,
          holiday_date: date,
          holiday_end_date: endDate,
          description: h.name_en,
          is_recurring: true,
          company_id: companyId,
        });
        added++;
      }
      await fetchHolidays();
      if (added === 0) {
        setError('All Turkish public holidays are already added.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSeeding(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600 }}>
          {langPackLabel("txtHolidaysManagement") || "Holidays Management"}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchHolidays}
            size="small"
          >{langPackLabel("txtRefresh") || "Refresh"}</Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={seeding ? <CircularProgress size={14} /> : <Flag />}
            onClick={handleSeedTurkishHolidays}
            disabled={seeding}
            size="small"
          >🇹🇷 {langPackLabel("txtSeedTurkishHolidays") || "Add TR Holidays"}</Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            size="small"
          >{langPackLabel("txtAddHoliday") || "Add Holiday"}</Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Recurring Holidays */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>{langPackLabel("txtRecurringHolidays") || "Recurring Holidays"}</Typography>
      <Paper sx={{ mb: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>{langPackLabel("txtDate") || "Date"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtName") || "Name"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtDescription") || "Description"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtActions") || "Actions"}</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {holidays.filter(h => h.is_recurring).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Box sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        {langPackLabel("txtNoRecurringHolidays") || "No recurring holidays configured yet."}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                holidays.filter(h => h.is_recurring).map((holiday) => (
                  <TableRow key={holiday.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatDate(holiday.holiday_date)}
                        {holiday.holiday_end_date && holiday.holiday_end_date !== holiday.holiday_date
                          ? ` — ${formatDate(holiday.holiday_end_date)}`
                          : ''}
                      </Typography>
                    </TableCell>
                    <TableCell><Typography variant="body2" fontWeight="medium">{holiday.name}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="textSecondary">{holiday.description || '—'}</Typography></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => handleOpenDialog(holiday)} color="primary"><Edit /></IconButton>
                        <IconButton size="small" onClick={() => handleDeleteClick(holiday)} color="error"><Delete /></IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* One-Time Holidays */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>{langPackLabel("txtOneTimeHolidays") || "One-Time Holidays"}</Typography>
      <Paper sx={{ mb: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>{langPackLabel("txtDate") || "Date"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtName") || "Name"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtDescription") || "Description"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtActions") || "Actions"}</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {holidays.filter(h => !h.is_recurring).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Box sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        {langPackLabel("txtNoOneTimeHolidays") || "No one-time holidays configured yet."}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                holidays.filter(h => !h.is_recurring).map((holiday) => (
                  <TableRow key={holiday.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatDate(holiday.holiday_date)}
                        {holiday.holiday_end_date && holiday.holiday_end_date !== holiday.holiday_date
                          ? ` — ${formatDate(holiday.holiday_end_date)}`
                          : ''}
                      </Typography>
                    </TableCell>
                    <TableCell><Typography variant="body2" fontWeight="medium">{holiday.name}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="textSecondary">{holiday.description || '—'}</Typography></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => handleOpenDialog(holiday)} color="primary"><Edit /></IconButton>
                        <IconButton size="small" onClick={() => handleDeleteClick(holiday)} color="error"><Delete /></IconButton>
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
              {langPackLabel("txtTotalHolidays") || "Total Holidays"}
            </Typography>
            <Typography variant="h4" color="primary">
              {holidays.length}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">{langPackLabel("txtRecurring") || "Recurring"}</Typography>
            <Typography variant="h4" color="success.main">
              {holidays.filter(h => h.is_recurring).length}
            </Typography>
          </Box>          
        </Box>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingHoliday ? (langPackLabel("txtEditHoliday") || 'Edit Holiday') : (langPackLabel("txtAddNewHoliday") || 'Add New Holiday')}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label={langPackLabel("txtHolidayName") || "Holiday Name"}
              type="text"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{ mb: 2 }}
            />

            <Box sx={{ mb: 2 }}>
              <LocalizedDatePicker
                label={langPackLabel("txtStartDate") || "Start Date"}
                value={formData.holiday_date}
                onChange={(v) => setFormData({ ...formData, holiday_date: v })}
                fullWidth
                required
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <LocalizedDatePicker
                label={langPackLabel("txtEndDate") || "End Date"}
                value={formData.holiday_end_date}
                onChange={(v) => setFormData({ ...formData, holiday_end_date: v })}
                fullWidth
                helperText={langPackLabel("txtLeaveEmptySingleDay") || "Leave empty for a single-day holiday"}
              />
            </Box>

            <TextField
              margin="dense"
              label={langPackLabel("txtDescription") || "Description"}
              type="text"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                />
              }
              label={langPackLabel("txtRecurringAnnually") || "Recurring annually"}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{langPackLabel("txtCancel") || "Cancel"}</Button>
            <Button type="submit" variant="contained">
              {editingHoliday ? (langPackLabel("txtUpdateProfile") || 'Update') : (langPackLabel("txtCreate") || 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={handleDeleteCancel}>
        <DialogTitle>{langPackLabel("txtConfirmDelete") || "Confirm Delete"}</DialogTitle>
        <DialogContent>
          <Typography>
            {langPackLabel("txtDeleteHolidayConfirm") || "Are you sure you want to delete the holiday"} "{deletingHoliday?.name}"
            ({deletingHoliday ? formatDate(deletingHoliday.holiday_date) : ''})?
            {langPackLabel("txtCannotBeUndone") || "This action cannot be undone."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>{langPackLabel("txtCancel") || "Cancel"}</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">{langPackLabel("txtDelete") || "Delete"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Holidays;
