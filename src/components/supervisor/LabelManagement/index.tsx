// src/components/supervisor/LabelManagement/index.tsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  IconButton,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  InputAdornment,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { Save, Edit, Add } from '@mui/icons-material';
import { LanguageService, ILabel } from '../../../services/language';
import { useLanguage } from '../../../contexts/LanguageContext';

const LabelManagement: React.FC = () => {
  const { langPackLabel } = useLanguage();
  const [labels, setLabels] = useState<ILabel[]>([]);
  const [labelsLoading, setLabelsLoading] = useState(false);
  const [newLabel, setNewLabel] = useState({ labeltext: '', tr: '', en: '' });
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [editingLabelKey, setEditingLabelKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ tr: string; en: string }>({ tr: '', en: '' });
  const [savingLabel, setSavingLabel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const fetchLabels = async () => {
    setLabelsLoading(true);
    try {
      const data = await LanguageService.getAllLabels();
      setLabels(data);
    } catch {
      setSnackbar({ open: true, message: langPackLabel("txtFailedToLoadLabels") || 'Failed to load labels', severity: 'error' });
    } finally {
      setLabelsLoading(false);
    }
  };

  useEffect(() => {
    fetchLabels();
  }, []);

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingLabel(true);
    try {
      const created = await LanguageService.createLabel(newLabel);
      setLabels((prev) => [...prev, created]);
      setNewLabel({ labeltext: '', tr: '', en: '' });
      setSnackbar({ open: true, message: langPackLabel("txtLabelCreated") || 'Label created successfully', severity: 'success' });
    } catch (err: any) {
      const msg = err?.response?.status === 409 || err?.message?.includes('409')
        ? (langPackLabel("txtLabelDuplicate") || 'Label with this key already exists')
        : err?.message || (langPackLabel("txtFailedToCreateLabel") || 'Failed to create label');
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setCreatingLabel(false);
    }
  };

  const handleStartEdit = (label: ILabel) => {
    setEditingLabelKey(label.labeltext);
    setEditValues({ tr: label.tr, en: label.en });
  };

  const handleSaveEdit = async (labeltext: string) => {
    setSavingLabel(true);
    try {
      const updated = await LanguageService.updateLabel(labeltext, editValues);
      setLabels((prev) => prev.map((l) => (l.labeltext === labeltext ? updated : l)));
      setEditingLabelKey(null);
      setSnackbar({ open: true, message: langPackLabel("txtLabelUpdated") || 'Label updated successfully', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.message || (langPackLabel("txtFailedToUpdateLabel") || 'Failed to update label'), severity: 'error' });
    } finally {
      setSavingLabel(false);
    }
  };

  const filteredLabels = labels.filter(
    (l) =>
      !searchQuery ||
      l.labeltext.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.tr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.en.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const paginatedLabels = filteredLabels.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>{langPackLabel("txtLabelManagement") || "Label Management"}</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {langPackLabel("txtLabelManagementDesc") || "Manage translatable labels for the application. Each label has a unique key and translations for Turkish and English."}
      </Typography>

      {/* Create new label form */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>{langPackLabel("txtAddNewLabel") || "Add New Label"}</Typography>
        <Box component="form" onSubmit={handleCreateLabel} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <TextField
            label={langPackLabel("txtLabelKey") || "Label Key"}
            size="small"
            required
            value={newLabel.labeltext}
            onChange={(e) => setNewLabel((prev) => ({ ...prev, labeltext: e.target.value }))}
            placeholder={langPackLabel("txtLabelKeyPlaceholder") || "e.g. txtSignIn"}
          />
          <TextField
            label={langPackLabel("txtTurkish") || "Turkish (tr)"}
            size="small"
            value={newLabel.tr}
            onChange={(e) => setNewLabel((prev) => ({ ...prev, tr: e.target.value }))}
          />
          <TextField
            label={langPackLabel("txtEnglish") || "English (en)"}
            size="small"
            value={newLabel.en}
            onChange={(e) => setNewLabel((prev) => ({ ...prev, en: e.target.value }))}
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<Add />}
            disabled={creatingLabel || !newLabel.labeltext.trim()}
          >
            {creatingLabel ? 'Creating…' : 'Add Label'}
          </Button>
        </Box>
      </Paper>

      {/* Search */}
      <TextField
        size="small"
        placeholder={langPackLabel("txtSearchLabels") || "Search labels…"}
        value={searchQuery}
        onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
        sx={{ mb: 2 }}
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      {/* Labels table */}
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>{langPackLabel("txtLabelKey") || "Label Key"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtTurkish") || "Turkish (tr)"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtEnglish") || "English (en)"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtActions") || "Actions"}</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {labelsLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : labels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No labels found. Add one above.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLabels.map((label) => (
                  <TableRow key={label.labeltext} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {label.labeltext}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {editingLabelKey === label.labeltext ? (
                        <TextField
                          size="small"
                          value={editValues.tr}
                          onChange={(e) => setEditValues((prev) => ({ ...prev, tr: e.target.value }))}
                          fullWidth
                        />
                      ) : (
                        <Typography variant="body2">{label.tr || '—'}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingLabelKey === label.labeltext ? (
                        <TextField
                          size="small"
                          value={editValues.en}
                          onChange={(e) => setEditValues((prev) => ({ ...prev, en: e.target.value }))}
                          fullWidth
                        />
                      ) : (
                        <Typography variant="body2">{label.en || '—'}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingLabelKey === label.labeltext ? (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleSaveEdit(label.labeltext)}
                          disabled={savingLabel}
                        >
                          <Save />
                        </IconButton>
                      ) : (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleStartEdit(label)}
                        >
                          <Edit />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredLabels.length}
          page={page}
          onPageChange={(_e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50, 100]}
        />
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LabelManagement;
