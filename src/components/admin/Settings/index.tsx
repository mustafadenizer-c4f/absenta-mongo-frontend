// src/components/admin/Settings/index.tsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import {
  fetchHierarchyProfile,
  updateHierarchyProfile,
  selectWorkdayConfig,
  setWorkdayConfig,
  selectLegalWorkdays,
  setLegalWorkdays,
} from '../../../store/slices/organizationSlice';
import { OrganizationService, SmtpConfig } from '../../../services/organization';
import { HierarchyProfile } from '../../../types';
import {
  Box,
  Typography,
  Paper,
  Alert,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  CircularProgress,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Person,
  GroupWork,
  Business,
  Groups,
} from '@mui/icons-material';
import { useLanguage } from '../../../contexts/LanguageContext';

const DAY_LABELS: { index: number; label: string }[] = [
  { index: 1, label: 'Mon' },
  { index: 2, label: 'Tue' },
  { index: 3, label: 'Wed' },
  { index: 4, label: 'Thu' },
  { index: 5, label: 'Fri' },
  { index: 6, label: 'Sat' },
  { index: 0, label: 'Sun' },
];

type DayStatus = 'working' | 'legal' | 'rest';

const PROFILES: { value: HierarchyProfile; label: string; description: string; icon: React.ReactNode; levels: string }[] = [
  {
    value: 'flat',
    label: 'Flat',
    description: 'No organizational layers. Users belong directly to the company.',
    icon: <Person sx={{ fontSize: 40 }} />,
    levels: 'Company → Users',
  },
  {
    value: 'teams',
    label: 'Teams',
    description: 'Smallest unit only. Good for simple team-based companies.',
    icon: <Groups sx={{ fontSize: 40 }} />,
    levels: 'Company → Teams → Users',
  },
  {
    value: 'departments',
    label: 'Departments',
    description: 'Two levels. Departments contain teams.',
    icon: <Business sx={{ fontSize: 40 }} />,
    levels: 'Company → Departments → Teams → Users',
  },
  {
    value: 'groups',
    label: 'Groups',
    description: 'Full hierarchy. Groups contain departments and teams. For large organizations.',
    icon: <GroupWork sx={{ fontSize: 40 }} />,
    levels: 'Company → Groups → Departments → Teams → Users',
  },
];

const HIERARCHY_ORDER: Record<HierarchyProfile, number> = {
  flat: 0,
  teams: 1,
  departments: 2,
  groups: 3,
};

function getChangeInfo(from: HierarchyProfile, to: HierarchyProfile): { title: string; message: string; steps: string[] } {
  const isUpgrade = HIERARCHY_ORDER[to] > HIERARCHY_ORDER[from];

  if (isUpgrade) {
    const steps: string[] = [];
    if (from === 'flat' && to === 'teams') {
      steps.push('Create teams and assign users to them.');
    } else if (from === 'flat' && to === 'departments') {
      steps.push('Create departments, then create teams within each department.', 'Assign users to the appropriate teams.');
    } else if (from === 'flat' && to === 'groups') {
      steps.push('Create groups, then create departments within each group.', 'Create teams within each department.', 'Assign users to the appropriate teams.');
    } else if (from === 'teams' && to === 'departments') {
      steps.push('Create departments and assign each existing team to a department.');
    } else if (from === 'teams' && to === 'groups') {
      steps.push('Create groups, then create departments within each group.', 'Assign each existing team to a department.');
    } else if (from === 'departments' && to === 'groups') {
      steps.push('Create groups and assign each existing department to a group.');
    }
    return {
      title: 'Upgrade Organization Hierarchy',
      message: `You are upgrading from "${from}" to "${to}". New organizational levels will be added. You will need to:`,
      steps,
    };
  } else {
    const steps: string[] = [];
    steps.push('Upper-level assignments will be removed from child sections.');
    steps.push('Review your organizational structure to ensure everything is correct.');
    return {
      title: 'Downgrade Organization Hierarchy',
      message: `You are downgrading from "${from}" to "${to}". Some organizational levels will no longer be used. Please note:`,
      steps,
    };
  }
}

/** Derive per-day status from workday + legal workday arrays */
function buildDayStatusMap(workdays: number[], legalWorkdays: number[]): Record<number, DayStatus> {
  const map: Record<number, DayStatus> = {};
  for (const { index } of DAY_LABELS) {
    if (workdays.includes(index)) {
      map[index] = 'working';
    } else if (legalWorkdays.includes(index)) {
      map[index] = 'legal';
    } else {
      map[index] = 'rest';
    }
  }
  return map;
}

/** Extract workday and legal workday arrays from the status map */
function extractArrays(statusMap: Record<number, DayStatus>): { workdays: number[]; legalWorkdays: number[] } {
  const workdays: number[] = [];
  const legalWorkdays: number[] = [];
  for (const key of Object.keys(statusMap)) {
    const idx = Number(key);
    if (statusMap[idx] === 'working') workdays.push(idx);
    else if (statusMap[idx] === 'legal') legalWorkdays.push(idx);
  }
  return { workdays, legalWorkdays };
}

const Settings: React.FC = () => {
  const { langPackLabel } = useLanguage();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { hierarchyProfile } = useSelector((state: RootState) => state.organization);
  const workdayConfig = useSelector(selectWorkdayConfig);
  const legalWorkdays = useSelector(selectLegalWorkdays);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; target: HierarchyProfile | null }>({
    open: false, target: null,
  });

  // Workday configuration state — per-day status map
  const [dayStatus, setDayStatus] = useState<Record<number, DayStatus>>(() =>
    buildDayStatusMap(workdayConfig, legalWorkdays),
  );
  const [savingWorkdays, setSavingWorkdays] = useState(false);

  // SMTP configuration state
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: '',
    sender_email: '',
    sender_name: '',
    email_notifications_enabled: true,
  });
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [loadingSmtp, setLoadingSmtp] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  // Sync local state when Redux state changes (e.g., after fetch)
  useEffect(() => {
    setDayStatus(buildDayStatusMap(workdayConfig, legalWorkdays));
  }, [workdayConfig, legalWorkdays]);

  // Load SMTP configuration on mount
  useEffect(() => {
    const loadSmtpConfig = async () => {
      setLoadingSmtp(true);
      try {
        const config = await OrganizationService.getSmtpConfig();
        setSmtpConfig(config);
      } catch {
        // SMTP config may not exist yet — leave defaults
      } finally {
        setLoadingSmtp(false);
      }
    };
    loadSmtpConfig();
  }, []);

  const handleDayStatusChange = (dayIndex: number, newStatus: DayStatus | null) => {
    if (newStatus === null) return; // MUI sends null when deselecting; ignore
    setDayStatus((prev) => ({ ...prev, [dayIndex]: newStatus }));
  };

  const { workdays: pendingWorkdays, legalWorkdays: pendingLegal } = extractArrays(dayStatus);
  const noDaysSelected = pendingWorkdays.length === 0 && pendingLegal.length === 0;

  const handleSaveWorkdays = async () => {
    if (!user?.company_id || noDaysSelected) return;
    setSavingWorkdays(true);
    try {
      await OrganizationService.updateWorkdayConfig(user.company_id, pendingWorkdays);
      await OrganizationService.updateLegalWorkdays(user.company_id, pendingLegal);
      dispatch(setWorkdayConfig(pendingWorkdays));
      dispatch(setLegalWorkdays(pendingLegal));
      setSnackbar({ open: true, message: langPackLabel("txtWorkdayConfigSaved") || 'Workday configuration saved', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.message || (langPackLabel("txtFailedToSaveWorkday") || 'Failed to save workday configuration'), severity: 'error' });
    } finally {
      setSavingWorkdays(false);
    }
  };

  const handleSmtpChange = (field: keyof SmtpConfig) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'smtp_port' ? Number(e.target.value) || 0 : e.target.value;
    setSmtpConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveSmtp = async () => {
    setSavingSmtp(true);
    try {
      const saved = await OrganizationService.updateSmtpConfig(smtpConfig);
      setSmtpConfig(saved);
      setSnackbar({ open: true, message: langPackLabel("txtSmtpConfigSaved") || 'Email configuration saved', severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.message || (langPackLabel("txtFailedToSaveSmtp") || 'Failed to save email configuration'), severity: 'error' });
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleSendTestEmail = async () => {
    setSendingTestEmail(true);
    try {
      const result = await OrganizationService.testSmtpConfig();
      if (result.success) {
        setSnackbar({ open: true, message: langPackLabel("txtTestEmailSent") || 'Test email sent successfully', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: result.error || (langPackLabel("txtTestEmailFailed") || 'Failed to send test email'), severity: 'error' });
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.message || (langPackLabel("txtTestEmailFailed") || 'Failed to send test email'), severity: 'error' });
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleSelect = (profile: HierarchyProfile) => {
    if (!user?.company_id || profile === hierarchyProfile) return;
    if (hierarchyProfile && HIERARCHY_ORDER[profile] < HIERARCHY_ORDER[hierarchyProfile]) return;
    setConfirmDialog({ open: true, target: profile });
  };

  const handleConfirm = async () => {
    const profile = confirmDialog.target;
    setConfirmDialog({ open: false, target: null });
    if (!user?.company_id || !profile) return;
    try {
      await dispatch(updateHierarchyProfile({ companyId: user.company_id, profile })).unwrap();
      setSnackbar({ open: true, message: `${langPackLabel("txtHierarchyUpdatedTo") || "Hierarchy updated to"} "${profile}"`, severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err || (langPackLabel("txtSomethingWentWrong") || 'Failed to update'), severity: 'error' });
    }
  };

  const changeInfo = confirmDialog.target && hierarchyProfile
    ? getChangeInfo(hierarchyProfile, confirmDialog.target)
    : null;

  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>{langPackLabel("txtCompanySettings") || "Company Settings"}</Typography>

      <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label={langPackLabel("txtOrganization") || "Organization"} />
        <Tab label={langPackLabel("txtWorkdays") || "Workdays"} />
        <Tab label={langPackLabel("txtEmail") || "Email"} />
      </Tabs>

      {/* Tab 0: Organization Hierarchy */}
      {activeTab === 0 && (
        <Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {langPackLabel("txtChooseHierarchy") || "Choose the organizational hierarchy that fits your company structure."}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {PROFILES.map((p) => {
          const isSelected = hierarchyProfile === p.value;
          const isLower = hierarchyProfile ? HIERARCHY_ORDER[p.value] < HIERARCHY_ORDER[hierarchyProfile] : false;
          const profileLabelMap: Record<string, string> = {
            flat: langPackLabel("txtFlat") || "Flat",
            teams: langPackLabel("txtTeamsProfile") || "Teams",
            departments: langPackLabel("txtDepartmentsProfile") || "Departments",
            groups: langPackLabel("txtGroupsProfile") || "Groups",
          };
          return (
            <Card
              key={p.value}
              sx={{
                flex: '1 1 220px',
                minWidth: 220,
                border: isSelected ? 2 : 1,
                borderColor: isSelected ? 'primary.main' : 'divider',
                position: 'relative',
                opacity: isLower ? 0.5 : 1,
              }}
            >
              <CardActionArea
                onClick={() => handleSelect(p.value)}
                disabled={isSelected || isLower}
                sx={{ p: 2, height: '100%' }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{ color: isSelected ? 'primary.main' : 'text.secondary', mb: 1 }}>
                    {p.icon}
                  </Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {profileLabelMap[p.value] || p.label}
                    {isSelected && (
                      <Chip label={langPackLabel("txtActive") || "Active"} color="primary" size="small" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {p.description}
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 1, bgcolor: 'grey.50' }}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {p.levels}
                    </Typography>
                  </Paper>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>

      <Alert severity="info" sx={{ mt: 4 }}>
        {langPackLabel("txtUpgradeOnly") || "You can only upgrade your organization hierarchy. Downgrading is not allowed. Make sure to update the new organizational sections after upgrading."}
      </Alert>
        </Box>
      )}

      {/* Tab 1: Workday Configuration */}
      {activeTab === 1 && (
      <Box>
        <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>{langPackLabel("txtWorkdayConfiguration") || "Workday Configuration"}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Working = employees work. Legal workday = not working but deducted from leave. Rest day = never deducted.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
          {DAY_LABELS.map(({ index, label }) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ width: 40, fontWeight: 500 }}>{langPackLabel(`txt${label === 'Mon' ? 'Mon' : label === 'Tue' ? 'Tue' : label === 'Wed' ? 'Wed' : label === 'Thu' ? 'Thu' : label === 'Fri' ? 'Fri' : label === 'Sat' ? 'Sat' : 'Sun'}`) || label}</Typography>
              <ToggleButtonGroup
                value={dayStatus[index]}
                exclusive
                onChange={(_e, val) => handleDayStatusChange(index, val as DayStatus | null)}
                size="small"
              >
                <ToggleButton value="working" color="primary">{langPackLabel("txtWorking") || "Working"}</ToggleButton>
                <ToggleButton value="legal" color="warning">{langPackLabel("txtLegalWorkday") || "Legal workday"}</ToggleButton>
                <ToggleButton value="rest" color="error">{langPackLabel("txtRestDay") || "Rest day"}</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          ))}
        </Box>

        {noDaysSelected && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            At least one working or legal workday is required
          </Typography>
        )}

        <Button
          variant="contained"
          onClick={handleSaveWorkdays}
          disabled={noDaysSelected || savingWorkdays}
        >
          {savingWorkdays ? (langPackLabel("txtSaving") || 'Saving…') : (langPackLabel("txtSaveWorkdays") || 'Save Workdays')}
        </Button>
      </Box>
      )}

      {/* Tab 2: Email Configuration */}
      {activeTab === 2 && (
      <Box>
        <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>
          {langPackLabel("txtEmailConfiguration") || "Email Configuration"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {langPackLabel("txtEmailConfigDescription") || "Configure SMTP settings to enable email notifications for your company."}
        </Typography>

        {loadingSmtp ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 500 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={smtpConfig.email_notifications_enabled}
                  onChange={(e) =>
                    setSmtpConfig((prev) => ({
                      ...prev,
                      email_notifications_enabled: e.target.checked,
                    }))
                  }
                />
              }
              label={langPackLabel("txtEnableEmailNotifications") || "Enable Email Notifications"}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: -1, mb: 1 }}>
              {langPackLabel("txtEmailToggleHelperText") || "Password reset emails and test emails are always sent regardless of this setting."}
            </Typography>
            <TextField
              label={langPackLabel("txtSmtpHost") || "SMTP Host"}
              value={smtpConfig.smtp_host}
              onChange={handleSmtpChange('smtp_host')}
              size="small"
              fullWidth
              placeholder="smtp.example.com"
            />
            <TextField
              label={langPackLabel("txtSmtpPort") || "SMTP Port"}
              value={smtpConfig.smtp_port}
              onChange={handleSmtpChange('smtp_port')}
              size="small"
              fullWidth
              type="number"
              placeholder="587"
            />
            <TextField
              label={langPackLabel("txtSmtpUser") || "SMTP Username"}
              value={smtpConfig.smtp_user}
              onChange={handleSmtpChange('smtp_user')}
              size="small"
              fullWidth
              placeholder="user@example.com"
            />
            <TextField
              label={langPackLabel("txtSmtpPass") || "SMTP Password"}
              value={smtpConfig.smtp_pass}
              onChange={handleSmtpChange('smtp_pass')}
              size="small"
              fullWidth
              type="password"
              placeholder="••••••••"
            />
            <TextField
              label={langPackLabel("txtSenderEmail") || "Sender Email"}
              value={smtpConfig.sender_email}
              onChange={handleSmtpChange('sender_email')}
              size="small"
              fullWidth
              placeholder="noreply@example.com"
            />
            <TextField
              label={langPackLabel("txtSenderName") || "Sender Name"}
              value={smtpConfig.sender_name}
              onChange={handleSmtpChange('sender_name')}
              size="small"
              fullWidth
              placeholder="My Company"
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button
                variant="contained"
                onClick={handleSaveSmtp}
                disabled={savingSmtp}
              >
                {savingSmtp ? (langPackLabel("txtSaving") || 'Saving…') : (langPackLabel("txtSaveEmailConfig") || 'Save Email Configuration')}
              </Button>
              <Button
                variant="outlined"
                onClick={handleSendTestEmail}
                disabled={sendingTestEmail}
              >
                {sendingTestEmail ? (
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                ) : null}
                {langPackLabel("txtSendTestEmail") || "Send Test Email"}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
      )}

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

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, target: null })}
        maxWidth="sm"
        fullWidth
      >
        {changeInfo && (
          <>
            <DialogTitle>{changeInfo.title}</DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {changeInfo.message}
              </Typography>
              <Box component="ol" sx={{ pl: 2, m: 0 }}>
                {changeInfo.steps.map((step, i) => (
                  <li key={i}>
                    <Typography variant="body2" sx={{ mb: 1 }}>{step}</Typography>
                  </li>
                ))}
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }}>
                This action will change your company's organizational structure. Make sure to update affected sections afterward.
              </Alert>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmDialog({ open: false, target: null })}>{langPackLabel("txtCancel") || "Cancel"}</Button>
              <Button onClick={handleConfirm} variant="contained" color="primary">{langPackLabel("txtConfirm") || "Confirm Change"}</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Settings;
