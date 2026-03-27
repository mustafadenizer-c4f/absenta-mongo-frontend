// src/components/supervisor/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAutoClearing } from '../../hooks/useAutoClearing';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  Snackbar,
  Tooltip,
} from '@mui/material';
import {
  LockReset,
  Business,
  Add,
  Refresh,
} from '@mui/icons-material';
import { SupervisorService } from '../../services/supervisor';
import { CompanyWithAdmin, HierarchyProfile } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HIERARCHY_OPTIONS: { value: HierarchyProfile; label: string }[] = [
  { value: 'flat', label: 'Flat' },
  { value: 'teams', label: 'Teams' },
  { value: 'departments', label: 'Departments' },
  { value: 'groups', label: 'Groups' },
];

const SupervisorDashboard: React.FC = () => {
  const { langPackLabel } = useLanguage();
  const [companies, setCompanies] = useState<CompanyWithAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useAutoClearing(7000);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create Company dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formHierarchyProfile, setFormHierarchyProfile] = useState<HierarchyProfile>('flat');
  const [formPhone, setFormPhone] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formContractNumber, setFormContractNumber] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  // Reset password dialog state
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<{ id: string; email: string } | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SupervisorService.getCompaniesWithAdmins();
      setCompanies(data);
    } catch (err: any) {
      setError(err.message || langPackLabel("txtFailedToLoadCompanies") || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (companyId: string, currentStatus: boolean) => {
    try {
      await SupervisorService.updateCompanyStatus(companyId, !currentStatus);
      setSuccessMessage(`Company status updated successfully`);
      await fetchCompanies();
    } catch (err: any) {
      setError(err.message || langPackLabel("txtFailedToUpdateStatus") || 'Failed to update company status');
    }
  };

  const handleOpenResetDialog = (userId: string, email: string) => {
    setResetTargetUser({ id: userId, email });
    setResetDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetTargetUser) return;
    try {
      setResetting(true);
      await SupervisorService.resetAdminPassword(resetTargetUser.id);
      setSuccessMessage(`Password reset successfully for ${resetTargetUser.email}`);
      setResetDialogOpen(false);
      setResetTargetUser(null);
    } catch (err: any) {
      setError(err.message || langPackLabel("txtSomethingWentWrong") || 'Failed to reset password');
      setResetDialogOpen(false);
    } finally {
      setResetting(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = 'Company name is required';
    if (!formPhone.trim()) errors.phone = 'Phone is required';
    if (!formContactEmail.trim()) {
      errors.contact_email = 'Contact email is required';
    } else if (!EMAIL_REGEX.test(formContactEmail)) {
      errors.contact_email = 'Invalid email format';
    }
    if (!formContractNumber.trim()) errors.contract_number = 'Contract number is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormName('');
    setFormHierarchyProfile('flat');
    setFormPhone('');
    setFormContactEmail('');
    setFormContractNumber('');
    setFormErrors({});
  };

  const handleCreateCompany = async () => {
    if (!validateForm()) return;
    try {
      setCreating(true);
      await SupervisorService.createCompanyWithAdmin({
        name: formName.trim(),
        hierarchy_profile: formHierarchyProfile,
        phone: formPhone.trim(),
        contact_email: formContactEmail.trim(),
        contract_number: formContractNumber.trim(),
      });
      setSuccessMessage('Company created successfully');
      setCreateDialogOpen(false);
      resetForm();
      await fetchCompanies();
    } catch (err: any) {
      setError(err.message || langPackLabel("txtSomethingWentWrong") || 'Failed to create company');
    } finally {
      setCreating(false);
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
          {langPackLabel("txtDashboard") || "Supervisor Dashboard"}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchCompanies}>{langPackLabel("txtRefresh") || "Refresh"}</Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            {langPackLabel("txtCreateNewCompany") || "Create Company"}
          </Button>
        </Box>
      </Box>

      {/* Error alert (persistent) */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Companies Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Business color="primary" />
          Companies ({companies.length})
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>{langPackLabel("txtCompanyName") || "Company Name"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtContactEmail") || "Contact Email"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtContractNumber") || "Contract Number"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtPhone") || "Phone"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtHierarchy") || "Hierarchy"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtStatus") || "Status"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtAdminEmail") || "Admin Email"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtActions") || "Actions"}</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="textSecondary" sx={{ py: 4 }}>
                      {langPackLabel("txtNoCompaniesFound") || "No companies found. Create one to get started."}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => (
                  <TableRow key={company.id} hover>
                    <TableCell>{company.name}</TableCell>
                    <TableCell>{company.contact_email || '—'}</TableCell>
                    <TableCell>{company.contract_number || '—'}</TableCell>
                    <TableCell>{company.phone || '—'}</TableCell>
                    <TableCell>
                      <Chip label={company.hierarchy_profile} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={company.status ? 'Active' : 'Disabled'}
                        color={company.status ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{company.admin_user?.email || '—'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title={company.status ? 'Disable company' : 'Enable company'}>
                          <Switch
                            checked={company.status}
                            onChange={() => handleStatusToggle(company.id, company.status)}
                            size="small"
                            color="success"
                          />
                        </Tooltip>
                        {company.admin_user && (
                          <Tooltip title={`Reset password for ${company.admin_user.email}`}>
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() =>
                                handleOpenResetDialog(company.admin_user!.id, company.admin_user!.email)
                              }
                            >
                              <LockReset />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Company Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => { setCreateDialogOpen(false); resetForm(); }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{langPackLabel("txtCreateNewCompany") || "Create New Company"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label={langPackLabel("txtCompanyName") || "Company Name"}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              error={!!formErrors.name}
              helperText={formErrors.name}
              required
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>{langPackLabel("txtHierarchyProfile") || "Hierarchy Profile"}</InputLabel>
              <Select
                value={formHierarchyProfile}
                label={langPackLabel("txtHierarchyProfile") || "Hierarchy Profile"}
                onChange={(e) => setFormHierarchyProfile(e.target.value as HierarchyProfile)}
              >
                {HIERARCHY_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={langPackLabel("txtPhone") || "Phone"}
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              error={!!formErrors.phone}
              helperText={formErrors.phone}
              required
              fullWidth
            />
            <TextField
              label={langPackLabel("txtContactEmail") || "Contact Email"}
              type="email"
              value={formContactEmail}
              onChange={(e) => setFormContactEmail(e.target.value)}
              error={!!formErrors.contact_email}
              helperText={formErrors.contact_email}
              required
              fullWidth
            />
            <TextField
              label={langPackLabel("txtContractNumber") || "Contract Number"}
              value={formContractNumber}
              onChange={(e) => setFormContractNumber(e.target.value)}
              error={!!formErrors.contract_number}
              helperText={formErrors.contract_number}
              required
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCreateDialogOpen(false); resetForm(); }}>{langPackLabel("txtCancel") || "Cancel"}</Button>
          <Button variant="contained" onClick={handleCreateCompany} disabled={creating}>
            {creating ? <CircularProgress size={20} /> : (langPackLabel("txtCreate") || "Create")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Confirmation Dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => { setResetDialogOpen(false); setResetTargetUser(null); }}
      >
        <DialogTitle>{langPackLabel("txtResetAdminPassword") || "Reset Admin Password"}</DialogTitle>
        <DialogContent>
          <Typography>
            {langPackLabel("txtResetPasswordConfirm") || "Reset password for"} <strong>{resetTargetUser?.email}</strong> {langPackLabel("txtResetPasswordDefault") || "to default (Pp123456)?"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setResetDialogOpen(false); setResetTargetUser(null); }}>{langPackLabel("txtCancel") || "Cancel"}</Button>
          <Button variant="contained" color="warning" onClick={handleResetPassword} disabled={resetting}>
            {resetting ? <CircularProgress size={20} /> : (langPackLabel("txtResetPassword") || "Reset Password")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)} variant="filled">
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SupervisorDashboard;
