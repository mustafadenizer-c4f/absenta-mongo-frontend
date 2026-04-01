import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Chip, Switch, FormControlLabel,
  CircularProgress, Snackbar, Alert, Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, Refresh } from '@mui/icons-material';
import { apiClient } from '../../config/api';
import { useLanguage } from '../../contexts/LanguageContext';

interface DefaultLeaveType {
  id: string;
  name: string;
  name_tr?: string;
  description?: string;
  description_tr?: string;
  default_days: number;
  color_code: string;
  is_active: boolean;
}

const DefaultLeaveTypes: React.FC = () => {
  const { langPackLabel } = useLanguage();
  const [types, setTypes] = useState<DefaultLeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DefaultLeaveType | null>(null);
  const [form, setForm] = useState({ name: '', name_tr: '', description: '', description_tr: '', default_days: 0, color_code: '#818CF8', is_active: true });
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({ open: false, msg: '', sev: 'success' });

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<DefaultLeaveType[]>('/supervisor/default-leave-types');
      setTypes(data);
    } catch { setSnackbar({ open: true, msg: 'Failed to load', sev: 'error' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', name_tr: '', description: '', description_tr: '', default_days: 0, color_code: '#818CF8', is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (t: DefaultLeaveType) => {
    setEditing(t);
    setForm({ name: t.name, name_tr: t.name_tr || '', description: t.description || '', description_tr: t.description_tr || '', default_days: t.default_days, color_code: t.color_code, is_active: t.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await apiClient.put(`/supervisor/default-leave-types/${editing.id}`, form);
      } else {
        await apiClient.post('/supervisor/default-leave-types', form);
      }
      setDialogOpen(false);
      load();
      setSnackbar({ open: true, msg: editing ? 'Updated' : 'Created', sev: 'success' });
    } catch { setSnackbar({ open: true, msg: 'Failed to save', sev: 'error' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/supervisor/default-leave-types/${id}`);
      load();
      setSnackbar({ open: true, msg: 'Deleted', sev: 'success' });
    } catch { setSnackbar({ open: true, msg: 'Failed to delete', sev: 'error' }); }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
          {langPackLabel("txtDefaultLeaveTypes") || "Default Leave Types"}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={load} size="small">{langPackLabel("txtRefresh") || "Refresh"}</Button>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="small">{langPackLabel("txtAddLeaveType") || "Add"}</Button>
        </Box>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        These leave types are automatically assigned to new companies when created.
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {types.map((t) => (
          <Card key={t.id} sx={{ flex: '1 1 280px', minWidth: 260, maxWidth: { xs: '100%', md: 'calc(50% - 8px)', lg: 'calc(33.33% - 11px)' }, border: 1, borderColor: t.is_active ? 'divider' : 'error.light', opacity: t.is_active ? 1 : 0.6 }}>
            <CardContent sx={{ pb: '8px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ width: 16, height: 16, borderRadius: '4px', bgcolor: t.color_code, flexShrink: 0 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1 }}>{t.name}</Typography>
                <Chip label={t.is_active ? 'Active' : 'Inactive'} size="small" color={t.is_active ? 'success' : 'default'} />
              </Box>
              {t.name_tr && <Typography variant="body2" color="text.secondary">TR: {t.name_tr}</Typography>}
              <Typography variant="body2" color="text.secondary">{t.default_days} {langPackLabel("txtDays") || "days"}</Typography>
              {t.description && <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>{t.description}</Typography>}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1 }}>
                <Tooltip title="Edit"><IconButton size="small" color="primary" onClick={() => openEdit(t)}><Edit fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(t.id)}><Delete fontSize="small" /></IconButton></Tooltip>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Default Leave Type' : 'Add Default Leave Type'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Name (EN)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} size="small" fullWidth required />
              <TextField label="Name (TR)" value={form.name_tr} onChange={(e) => setForm({ ...form, name_tr: e.target.value })} size="small" fullWidth />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Description (EN)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} size="small" fullWidth multiline rows={2} />
              <TextField label="Description (TR)" value={form.description_tr} onChange={(e) => setForm({ ...form, description_tr: e.target.value })} size="small" fullWidth multiline rows={2} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Default Days" type="number" value={form.default_days} onChange={(e) => setForm({ ...form, default_days: Number(e.target.value) || 0 })} size="small" fullWidth />
              <TextField label="Color Code" value={form.color_code} onChange={(e) => setForm({ ...form, color_code: e.target.value })} size="small" fullWidth />
              <Box sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: form.color_code, border: 1, borderColor: 'divider', flexShrink: 0, mt: 0.5 }} />
            </Box>
            <FormControlLabel control={<Switch checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />} label="Active" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? <CircularProgress size={20} /> : editing ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.sev} variant="filled" onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default DefaultLeaveTypes;
