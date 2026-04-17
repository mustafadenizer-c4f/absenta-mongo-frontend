// src/components/supervisor/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAutoClearing } from '../../hooks/useAutoClearing';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
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
  IconButton,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  LockReset,
  Add,
  Refresh,
  Edit,
  Search,
  Business,
  Phone,
  Email,
  Description,
  AccountTree,
  StorageRounded,
} from '@mui/icons-material';
import { SupervisorService } from '../../services/supervisor';
import { CompanyWithAdmin, HierarchyProfile } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatLocalDate } from '../../utils/localize';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HIERARCHY_OPTIONS: { value: HierarchyProfile; label: string }[] = [
  { value: 'flat', label: 'Flat' },
  { value: 'teams', label: 'Teams' },
  { value: 'departments', label: 'Departments' },
  { value: 'groups', label: 'Groups' },
];

const SupervisorCompanies: React.FC = () => {
  const { langPackLabel, language } = useLanguage();
  const [companies, setCompanies] = useState<CompanyWithAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useAutoClearing(7000);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Create/Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyWithAdmin | null>(null);
  const [formName, setFormName] = useState('');
  const [formHierarchy, setFormHierarchy] = useState<HierarchyProfile>('flat');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formContract, setFormContract] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Reset password
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<{ id: string; email: string } | null>(null);
  const [resetting, setResetting] = useState(false);

  // Reset to system database
  const [resetDbDialogOpen, setResetDbDialogOpen] = useState(false);
  const [resetDbTarget, setResetDbTarget] = useState<CompanyWithAdmin | null>(null);
  const [resettingDb, setResettingDb] = useState(false);

  useEffect(() => { fetchCompanies(); }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const data = await SupervisorService.getCompaniesWithAdmins();
      setCompanies(data);
    } catch (err: any) { setError(err.message || 'Failed to load companies'); }
    finally { setLoading(false); }
  };

  const filteredCompanies = companies.filter((c) =>
    !searchQuery ||
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.admin_user?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.contact_email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusToggle = async (id: string, current: boolean) => {
    try {
      await SupervisorService.updateCompanyStatus(id, !current);
      setSuccessMessage('Status updated');
      fetchCompanies();
    } catch (err: any) { setError(err.message); }
  };

  const openCreate = () => {
    setEditingCompany(null);
    setFormName(''); setFormHierarchy('flat'); setFormPhone(''); setFormEmail(''); setFormContract('');
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEdit = (c: CompanyWithAdmin) => {
    setEditingCompany(c);
    setFormName(c.name); setFormHierarchy(c.hierarchy_profile || 'flat');
    setFormPhone(c.phone || ''); setFormEmail(c.contact_email || ''); setFormContract(c.contract_number || '');
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    if (!formName.trim()) errors.name = 'Required';
    if (!editingCompany) {
      if (!formEmail.trim()) errors.email = 'Required';
      else if (!EMAIL_REGEX.test(formEmail)) errors.email = 'Invalid email';
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      if (editingCompany) {
        await SupervisorService.updateCompany(editingCompany.id, formName.trim());
        setSuccessMessage('Company updated');
      } else {
        await SupervisorService.createCompanyWithAdmin({
          name: formName.trim(), hierarchy_profile: formHierarchy,
          phone: formPhone.trim(), contact_email: formEmail.trim(), contract_number: formContract.trim(),
        });
        setSuccessMessage('Company created');
      }
      setDialogOpen(false);
      fetchCompanies();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setResetting(true);
    try {
      await SupervisorService.resetAdminPassword(resetTarget.id);
      setSuccessMessage(`Password reset for ${resetTarget.email}`);
      setResetDialogOpen(false);
    } catch (err: any) { setError(err.message); }
    finally { setResetting(false); }
  };

  const handleResetToSystemDatabase = async () => {
    if (!resetDbTarget) return;
    setResettingDb(true);
    try {
      await SupervisorService.resetToSystemDatabase(resetDbTarget.id);
      setSuccessMessage(langPackLabel("txtResetDbSuccess") || `Database reset to system for ${resetDbTarget.name}`);
      setResetDbDialogOpen(false);
      setResetDbTarget(null);
      fetchCompanies();
    } catch (err: any) { setError(err.message); }
    finally { setResettingDb(false); }
  };

  const stats = {
    total: companies.length,
    active: companies.filter((c) => c.status).length,
    inactive: companies.filter((c) => !c.status).length,
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600 }}>
          {langPackLabel("txtCompanies") || "Companies"}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Refresh />} onClick={fetchCompanies} size="small">{langPackLabel("txtRefresh") || "Refresh"}</Button>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate} size="small">{langPackLabel("txtCreateNewCompany") || "Create Company"}</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: langPackLabel("txtTotalUsers") || 'Total', value: stats.total, color: 'primary.main' },
          { label: langPackLabel("txtActive") || 'Active', value: stats.active, color: 'success.main' },
          { label: langPackLabel("txtInactive") || 'Inactive', value: stats.inactive, color: 'error.main' },
        ].map((s, i) => (
          <Card key={i} sx={{ flex: '1 1 120px', minWidth: 120 }}>
            <CardContent sx={{ textAlign: 'center', py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="h4" sx={{ color: s.color, fontWeight: 700 }}>{s.value}</Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Search */}
      <TextField
        size="small" fullWidth placeholder={langPackLabel("txtSearch") || "Search companies…"}
        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} sx={{ mb: 3 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
      />

      {/* Company Cards */}
      {filteredCompanies.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" sx={{ py: 6 }}>
          {langPackLabel("txtNoCompaniesFound") || "No companies found."}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {filteredCompanies.map((company) => (
            <Card key={company.id} sx={{ flex: '1 1 340px', minWidth: 300, maxWidth: { xs: '100%', md: 'calc(50% - 8px)', lg: 'calc(33.33% - 11px)' }, border: 1, borderColor: company.status ? 'success.light' : 'error.light' }}>
              <CardContent sx={{ pb: '12px !important' }}>
                {/* Company name + status */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>{company.name}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip label={company.status ? (langPackLabel("txtActive") || 'Active') : (langPackLabel("txtInactive") || 'Inactive')} color={company.status ? 'success' : 'error'} size="small" />
                    <Tooltip title={company.status ? 'Disable' : 'Enable'}>
                      <Switch checked={company.status} onChange={() => handleStatusToggle(company.id, company.status)} size="small" color="success" />
                    </Tooltip>
                  </Box>
                </Box>

                {/* Details */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountTree sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">{company.hierarchy_profile || 'flat'}</Typography>
                  </Box>
                  {company.contact_email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">{company.contact_email}</Typography>
                    </Box>
                  )}
                  {company.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">{company.phone}</Typography>
                    </Box>
                  )}
                  {company.contract_number && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Description sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">{company.contract_number}</Typography>
                    </Box>
                  )}
                </Box>

                {/* Admin info */}
                {company.admin_user && (
                  <Box sx={{ bgcolor: 'grey.50', borderRadius: 1, p: 1, mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">{langPackLabel("txtAdminEmail") || "Admin"}</Typography>
                    <Typography variant="body2" fontWeight={500}>{company.admin_user.full_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{company.admin_user.email}</Typography>
                    {company.admin_user.last_login && (
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        {langPackLabel("txtLastLogin") || "Last login"}: {formatLocalDate(company.admin_user.last_login, language)} {new Date(company.admin_user.last_login).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Actions */}
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                  {company.custom_mongo_enabled && (
                    <Tooltip title={langPackLabel("txtResetToSystemDatabase") || "Reset to System Database"}>
                      <IconButton size="small" color="error" onClick={() => { setResetDbTarget(company); setResetDbDialogOpen(true); }}>
                        <StorageRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title={langPackLabel("txtEdit") || "Edit"}>
                    <IconButton size="small" color="primary" onClick={() => openEdit(company)}><Edit fontSize="small" /></IconButton>
                  </Tooltip>
                  {company.admin_user && (
                    <Tooltip title={langPackLabel("txtResetAdminPassword") || "Reset Admin Password"}>
                      <IconButton size="small" color="warning" onClick={() => { setResetTarget({ id: company.admin_user!.id, email: company.admin_user!.email }); setResetDialogOpen(true); }}>
                        <LockReset fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCompany ? (langPackLabel("txtEditCompany") || "Edit Company") : (langPackLabel("txtCreateNewCompany") || "Create Company")}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label={langPackLabel("txtCompanyName") || "Company Name"} value={formName} onChange={(e) => setFormName(e.target.value)} error={!!formErrors.name} helperText={formErrors.name} required size="small" fullWidth />
            {!editingCompany && (
              <>
                <FormControl fullWidth size="small">
                  <InputLabel>{langPackLabel("txtHierarchyProfile") || "Hierarchy"}</InputLabel>
                  <Select value={formHierarchy} label={langPackLabel("txtHierarchyProfile") || "Hierarchy"} onChange={(e) => setFormHierarchy(e.target.value as HierarchyProfile)}>
                    {HIERARCHY_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label={langPackLabel("txtContactEmail") || "Admin/Contact Email"} type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} error={!!formErrors.email} helperText={formErrors.email} required size="small" fullWidth />
                <TextField label={langPackLabel("txtPhone") || "Phone"} value={formPhone} onChange={(e) => setFormPhone(e.target.value)} size="small" fullWidth />
                <TextField label={langPackLabel("txtContractNumber") || "Contract Number"} value={formContract} onChange={(e) => setFormContract(e.target.value)} size="small" fullWidth />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{langPackLabel("txtCancel") || "Cancel"}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? <CircularProgress size={20} /> : editingCompany ? (langPackLabel("txtSave") || "Save") : (langPackLabel("txtCreate") || "Create")}</Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>{langPackLabel("txtResetAdminPassword") || "Reset Admin Password"}</DialogTitle>
        <DialogContent>
          <Typography>{langPackLabel("txtResetPasswordConfirm") || "Reset password for"} <strong>{resetTarget?.email}</strong> {langPackLabel("txtResetPasswordDefault") || "to default (Pp123456)?"}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>{langPackLabel("txtCancel") || "Cancel"}</Button>
          <Button variant="contained" color="warning" onClick={handleResetPassword} disabled={resetting}>{resetting ? <CircularProgress size={20} /> : (langPackLabel("txtResetPassword") || "Reset")}</Button>
        </DialogActions>
      </Dialog>

      {/* Reset to System Database Dialog */}
      <Dialog open={resetDbDialogOpen} onClose={() => setResetDbDialogOpen(false)}>
        <DialogTitle>{langPackLabel("txtResetToSystemDatabase") || "Reset to System Database"}</DialogTitle>
        <DialogContent>
          <Typography>
            {langPackLabel("txtResetDbConfirm") || "This will disconnect the company from their custom database. The admin will need to log in using the system database and reconfigure. Company data on the custom instance will not be deleted."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDbDialogOpen(false)}>{langPackLabel("txtCancel") || "Cancel"}</Button>
          <Button variant="contained" color="error" onClick={handleResetToSystemDatabase} disabled={resettingDb}>
            {resettingDb ? <CircularProgress size={20} /> : (langPackLabel("txtReset") || "Reset")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default SupervisorCompanies;
