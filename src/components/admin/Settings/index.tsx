// src/components/admin/Settings/index.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../../../store';
import {
  fetchHierarchyProfile,
  updateHierarchyProfile,
  selectWorkdayConfig,
  setWorkdayConfig,
  selectLegalWorkdays,
  setLegalWorkdays,
} from '../../../store/slices/organizationSlice';
import { logout } from '../../../store/slices/authSlice';
import { OrganizationService, SmtpConfig } from '../../../services/organization';
import { HierarchyProfile, CustomMongoConfig } from '../../../types';
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

const PROFILES: { value: HierarchyProfile; label: string; descriptionKey: string; description: string; icon: React.ReactNode; levels: string }[] = [
  {
    value: 'flat',
    label: 'Flat',
    descriptionKey: 'txtProfileFlat',
    description: 'No organizational layers. Users belong directly to the company.',
    icon: <Person sx={{ fontSize: 40 }} />,
    levels: 'Company → Users',
  },
  {
    value: 'teams',
    label: 'Teams',
    descriptionKey: 'txtProfileTeams',
    description: 'Smallest unit only. Good for simple team-based companies.',
    icon: <Groups sx={{ fontSize: 40 }} />,
    levels: 'Company → Teams → Users',
  },
  {
    value: 'departments',
    label: 'Departments',
    descriptionKey: 'txtProfileDepartments',
    description: 'Two levels. Departments contain teams.',
    icon: <Business sx={{ fontSize: 40 }} />,
    levels: 'Company → Departments → Teams → Users',
  },
  {
    value: 'groups',
    label: 'Groups',
    descriptionKey: 'txtProfileGroups',
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

function getChangeInfo(from: HierarchyProfile, to: HierarchyProfile, lang: string): { title: string; message: string; steps: string[] } {
  const isUpgrade = HIERARCHY_ORDER[to] > HIERARCHY_ORDER[from];
  const t = lang === 'tr';

  const profileNames: Record<string, string> = t
    ? { flat: 'düz', teams: 'takımlar', departments: 'departmanlar', groups: 'gruplar' }
    : { flat: 'flat', teams: 'teams', departments: 'departments', groups: 'groups' };

  if (isUpgrade) {
    const steps: string[] = [];
    if (from === 'flat' && to === 'teams') {
      steps.push(t ? 'Takımlar oluşturun ve kullanıcıları takımlara atayın.' : 'Create teams and assign users to them.');
    } else if (from === 'flat' && to === 'departments') {
      steps.push(t ? 'Departmanlar oluşturun, ardından her departman içinde takımlar oluşturun.' : 'Create departments, then create teams within each department.');
      steps.push(t ? 'Kullanıcıları uygun takımlara atayın.' : 'Assign users to the appropriate teams.');
    } else if (from === 'flat' && to === 'groups') {
      steps.push(t ? 'Gruplar oluşturun, ardından her grup içinde departmanlar oluşturun.' : 'Create groups, then create departments within each group.');
      steps.push(t ? 'Her departman içinde takımlar oluşturun.' : 'Create teams within each department.');
      steps.push(t ? 'Kullanıcıları uygun takımlara atayın.' : 'Assign users to the appropriate teams.');
    } else if (from === 'teams' && to === 'departments') {
      steps.push(t ? 'Departmanlar oluşturun ve mevcut her takımı bir departmana atayın.' : 'Create departments and assign each existing team to a department.');
    } else if (from === 'teams' && to === 'groups') {
      steps.push(t ? 'Gruplar oluşturun, ardından her grup içinde departmanlar oluşturun.' : 'Create groups, then create departments within each group.');
      steps.push(t ? 'Mevcut her takımı bir departmana atayın.' : 'Assign each existing team to a department.');
    } else if (from === 'departments' && to === 'groups') {
      steps.push(t ? 'Gruplar oluşturun ve mevcut her departmanı bir gruba atayın.' : 'Create groups and assign each existing department to a group.');
    }
    return {
      title: t ? 'Organizasyon Hiyerarşisini Yükselt' : 'Upgrade Organization Hierarchy',
      message: t
        ? `"${profileNames[from]}" profilinden "${profileNames[to]}" profiline yükseltiyorsunuz. Yeni organizasyon seviyeleri eklenecek. Yapmanız gerekenler:`
        : `You are upgrading from "${from}" to "${to}". New organizational levels will be added. You will need to:`,
      steps,
    };
  } else {
    const steps: string[] = [];
    steps.push(t ? 'Üst seviye atamaları alt bölümlerden kaldırılacaktır.' : 'Upper-level assignments will be removed from child sections.');
    steps.push(t ? 'Organizasyon yapınızı gözden geçirerek her şeyin doğru olduğundan emin olun.' : 'Review your organizational structure to ensure everything is correct.');
    return {
      title: t ? 'Organizasyon Hiyerarşisini Düşür' : 'Downgrade Organization Hierarchy',
      message: t
        ? `"${profileNames[from]}" profilinden "${profileNames[to]}" profiline düşürüyorsunuz. Bazı organizasyon seviyeleri artık kullanılmayacak. Lütfen dikkat:`
        : `You are downgrading from "${from}" to "${to}". Some organizational levels will no longer be used. Please note:`,
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
  const { langPackLabel, language } = useLanguage();
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

  // Custom MongoDB configuration state
  const navigate = useNavigate();
  const [mongoConfig, setMongoConfig] = useState<CustomMongoConfig>({
    custom_mongo_uri: '',
    email_domain: '',
    custom_mongo_enabled: false,
  });
  const [loadingMongo, setLoadingMongo] = useState(false);
  const [savingMongo, setSavingMongo] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [mongoConfirmDialog, setMongoConfirmDialog] = useState(false);
  const [postSaveDialog, setPostSaveDialog] = useState(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

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

  // Load custom MongoDB configuration on mount
  useEffect(() => {
    if (!user?.company_id) return;
    const loadMongoConfig = async () => {
      setLoadingMongo(true);
      try {
        const config = await OrganizationService.getCustomMongoConfig(user.company_id!);
        setMongoConfig(config);
      } catch {
        // Config may not exist yet — leave defaults
      } finally {
        setLoadingMongo(false);
      }
    };
    loadMongoConfig();
  }, [user?.company_id]);

  // Cleanup redirect timer on unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
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

  // Custom MongoDB handlers
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionTestResult(null);
    try {
      const result = await OrganizationService.testMongoConnection(mongoConfig.custom_mongo_uri);
      setConnectionTestResult({ success: result.success, message: result.message });
    } catch (err: any) {
      setConnectionTestResult({ success: false, message: err?.message || 'Connection test failed' });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleMongoSave = () => {
    if (mongoConfig.custom_mongo_enabled) {
      // Show confirmation dialog when enabling
      setMongoConfirmDialog(true);
    } else {
      // Save directly when disabling
      doSaveMongo();
    }
  };

  const doSaveMongo = async () => {
    if (!user?.company_id) return;
    setSavingMongo(true);
    try {
      await OrganizationService.saveCustomMongoConfig(user.company_id, mongoConfig);
      if (mongoConfig.custom_mongo_enabled) {
        // Show post-save dialog with countdown
        setSnackbar({ open: true, message: langPackLabel("txtCustomMongoSaved") || 'Custom MongoDB configuration saved. You will be logged out.', severity: 'success' });
        setPostSaveDialog(true);
        setRedirectCountdown(5);
        // Start countdown
        const countdownInterval = setInterval(() => {
          setRedirectCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        // Auto-redirect after 5 seconds
        redirectTimerRef.current = setTimeout(async () => {
          clearInterval(countdownInterval);
          await dispatch(logout());
          navigate('/login');
        }, 5000);
      } else {
        setSnackbar({ open: true, message: langPackLabel("txtCustomMongoDisabled") || 'Custom MongoDB configuration saved', severity: 'success' });
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.message || (langPackLabel("txtFailedToSaveMongo") || 'Failed to save database configuration'), severity: 'error' });
    } finally {
      setSavingMongo(false);
    }
  };

  const handleLogOutNow = useCallback(async () => {
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    setPostSaveDialog(false);
    await dispatch(logout());
    navigate('/login');
  }, [dispatch, navigate]);

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
    ? getChangeInfo(hierarchyProfile, confirmDialog.target, language)
    : null;

  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>{langPackLabel("txtCompanySettings") || "Company Settings"}</Typography>

      <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label={langPackLabel("txtOrganization") || "Organization"} />
        <Tab label={langPackLabel("txtWorkdays") || "Workdays"} />
        <Tab label={langPackLabel("txtEmail") || "Email"} />
        <Tab label={langPackLabel("txtDatabase") || "Database"} />
      </Tabs>

      {/* Tab 0: Organization Hierarchy */}
      {activeTab === 0 && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {langPackLabel("txtChooseHierarchy") || "Choose the organizational hierarchy that fits your company structure."}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
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
                flex: '1 1 160px',
                minWidth: 160,
                maxWidth: 260,
                border: isSelected ? 2 : 1,
                borderColor: isSelected ? 'primary.main' : 'divider',
                position: 'relative',
                opacity: isLower ? 0.5 : 1,
              }}
            >
              <CardActionArea
                onClick={() => handleSelect(p.value)}
                disabled={isSelected || isLower}
                sx={{ p: 1.5, height: '100%' }}
              >
                <CardContent sx={{ textAlign: 'center', p: '8px !important' }}>
                  <Box sx={{ color: isSelected ? 'primary.main' : 'text.secondary', mb: 0.5 }}>
                    {p.icon}
                  </Box>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    {profileLabelMap[p.value] || p.label}
                    {isSelected && (
                      <Chip label={langPackLabel("txtActive") || "Active"} color="primary" size="small" sx={{ ml: 1 }} />
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    {langPackLabel(p.descriptionKey) || p.description}
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 0.5, bgcolor: 'grey.50' }}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
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
          {langPackLabel("txtWorkdayExplanation") || "Working = employees work. Legal workday = not working but deducted from leave. Rest day = never deducted."}
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
            {langPackLabel("txtAtLeastOneWorkday") || "At least one working or legal workday is required"}
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
              autoComplete="off"
              inputProps={{ autoComplete: 'new-password' }}
            />
            <TextField
              label={langPackLabel("txtSmtpPass") || "SMTP Password"}
              value={smtpConfig.smtp_pass}
              onChange={handleSmtpChange('smtp_pass')}
              size="small"
              fullWidth
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              inputProps={{ autoComplete: 'new-password' }}
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

      {/* Tab 3: Database Configuration */}
      {activeTab === 3 && (
      <Box>
        <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>
          {langPackLabel("txtDatabaseConfiguration") || "Database Configuration"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {langPackLabel("txtDatabaseConfigDescription") || "Configure a custom MongoDB instance for dedicated data storage. All company data will be stored on your own database."}
        </Typography>

        {loadingMongo ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 500 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={mongoConfig.custom_mongo_enabled}
                  onChange={(e) =>
                    setMongoConfig((prev) => ({
                      ...prev,
                      custom_mongo_enabled: e.target.checked,
                    }))
                  }
                />
              }
              label={langPackLabel("txtEnableCustomMongo") || "Enable Custom MongoDB"}
            />
            <TextField
              label={langPackLabel("txtCustomMongoUri") || "Custom MongoDB URI"}
              value={mongoConfig.custom_mongo_uri}
              onChange={(e) => setMongoConfig((prev) => ({ ...prev, custom_mongo_uri: e.target.value }))}
              size="small"
              fullWidth
              type="password"
              placeholder="mongodb+srv://user:pass@host/db"
              autoComplete="new-password"
              inputProps={{ autoComplete: 'new-password' }}
            />
            <TextField
              label={langPackLabel("txtEmailDomain") || "Email Domain"}
              value={mongoConfig.email_domain}
              onChange={(e) => setMongoConfig((prev) => ({ ...prev, email_domain: e.target.value }))}
              size="small"
              fullWidth
              placeholder="acme.com"
              helperText={langPackLabel("txtEmailDomainHelper") || "Your company's email domain (e.g., acme.com). Public domains like gmail.com are not allowed."}
            />

            {connectionTestResult && (
              <Alert severity={connectionTestResult.success ? 'success' : 'error'} sx={{ mt: 1 }}>
                {connectionTestResult.message}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button
                variant="contained"
                onClick={handleMongoSave}
                disabled={savingMongo}
              >
                {savingMongo ? (langPackLabel("txtSaving") || 'Saving…') : (langPackLabel("txtSaveDatabaseConfig") || 'Save')}
              </Button>
              <Button
                variant="outlined"
                onClick={handleTestConnection}
                disabled={testingConnection || !mongoConfig.custom_mongo_uri}
              >
                {testingConnection ? (
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                ) : null}
                {langPackLabel("txtTestConnection") || "Test Connection"}
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
                {langPackLabel("txtHierarchyChangeWarning") || "This action will change your company's organizational structure. Make sure to update affected sections afterward."}
              </Alert>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmDialog({ open: false, target: null })}>{langPackLabel("txtCancel") || "Cancel"}</Button>
              <Button onClick={handleConfirm} variant="contained" color="primary">{langPackLabel("txtConfirm") || "Confirm Change"}</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Custom MongoDB enable confirmation dialog */}
      <Dialog
        open={mongoConfirmDialog}
        onClose={() => setMongoConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{langPackLabel("txtEnableCustomMongoTitle") || "Enable Custom MongoDB"}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            {langPackLabel("txtEnableCustomMongoWarning") || "After enabling custom MongoDB, you will be logged out. On next login, all data starts fresh on your dedicated instance. This action cannot be undone without supervisor intervention."}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMongoConfirmDialog(false)}>{langPackLabel("txtCancel") || "Cancel"}</Button>
          <Button
            onClick={() => {
              setMongoConfirmDialog(false);
              doSaveMongo();
            }}
            variant="contained"
            color="warning"
          >
            {langPackLabel("txtConfirmEnable") || "Enable & Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Post-save redirect dialog */}
      <Dialog
        open={postSaveDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{langPackLabel("txtCustomMongoActivated") || "Custom MongoDB Activated"}</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {`${langPackLabel("txtRedirectingToLogin") || "You will be redirected to the login page in"} ${redirectCountdown}s`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {langPackLabel("txtNextLoginCustomDb") || "On your next login, you will be connected to your custom database instance."}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogOutNow} variant="contained" color="primary">
            {langPackLabel("txtLogOutNow") || "Log Out Now"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
