// src/components/profile/ProfilePage.tsx
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Alert,
  Snackbar,
  Divider,
  Grid,
  InputAdornment,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  CalendarToday,
  Visibility,
  VisibilityOff,
  Save,
  Lock,
  Language,
} from '@mui/icons-material';
import { useLanguage } from '../../contexts/LanguageContext';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { RootState, AppDispatch } from '../../store';
import { createPasswordResetSchema } from '../../utils/validation';
import { UsersService } from '../../services/users';
import { apiClient } from '../../config/api';
import { checkSession } from '../../store/slices/authSlice';

interface ProfileFormData {
  full_name: string;
  phone: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfilePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { language, switchLanguage, isLanguageLoading, langPackLabel } = useLanguage();

  const profileSchema = yup.object({
    full_name: yup.string().required(langPackLabel("txtFullNameRequired") || 'Full name is required'),
    phone: yup.string().default(''),
  });

  const passwordResetSchema = createPasswordResetSchema(langPackLabel);

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleLanguageChange = async (_event: React.MouseEvent<HTMLElement>, newLang: string | null) => {
    if (!newLang || newLang === language) return;
    try {
      await switchLanguage(newLang);
      setSnackbar({ open: true, message: langPackLabel("txtLanguageUpdated") || 'Language updated successfully', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: langPackLabel("txtSomethingWentWrong") || 'Failed to switch language', severity: 'error' });
    }
  };

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
  } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<PasswordFormData>({
    resolver: yupResolver(passwordResetSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    setProfileLoading(true);
    try {
      await UsersService.update(user.id, {
        full_name: data.full_name,
        phone: data.phone || null,
      });
      // Refresh session to get updated user data
      await dispatch(checkSession());
      setSnackbar({ open: true, message: langPackLabel("txtProfileUpdated") || 'Profile updated successfully', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || langPackLabel("txtSomethingWentWrong") || 'Failed to update profile', severity: 'error' });
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setPasswordLoading(true);
    try {
      await apiClient.post('/auth/change-password', {
        current_password: data.currentPassword,
        new_password: data.newPassword,
      });

      resetPasswordForm();
      setSnackbar({ open: true, message: langPackLabel("txtPasswordChanged") || 'Password changed successfully', severity: 'success' });
    } catch (error: any) {
      const msg = error.message || (langPackLabel("txtFailedToChangePassword") || 'Failed to change password');
      if (msg.includes('current') || msg.includes('incorrect') || error.status === 401) {
        setSnackbar({ open: true, message: langPackLabel("txtCurrentPasswordIncorrect") || 'Current password is incorrect', severity: 'error' });
      } else {
        setSnackbar({ open: true, message: msg, severity: 'error' });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const getRoleBadges = () => {
    const badges: { label: string; color: 'primary' | 'secondary' | 'warning' }[] = [];
    const role = user?.role;
    if (role === 'admin') badges.push({ label: 'Admin', color: 'secondary' });
    else if (role === 'department_manager') badges.push({ label: 'Department Manager', color: 'warning' });
    else if (role === 'group_manager') badges.push({ label: 'Group Manager', color: 'warning' });
    else if (role === 'manager') badges.push({ label: 'Manager', color: 'warning' });
    else badges.push({ label: 'Staff', color: 'primary' });
    return badges;
  };

  if (!user) return null;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        {langPackLabel("txtMyProfile") || "My Profile"}
      </Typography>

      {/* User Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Person sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">{langPackLabel("txtPersonalInformation") || "Personal Information"}</Typography>
            <Box sx={{ ml: 2, display: 'flex', gap: 1 }}>
              {getRoleBadges().map((badge) => (
                <Chip key={badge.label} label={badge.label} color={badge.color} size="small" />
              ))}
            </Box>
          </Box>
          <Divider sx={{ mb: 3 }} />

          {/* Read-only fields */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={langPackLabel("txtEmail") || "Email"}
                value={user.email}
                disabled
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label={langPackLabel("txtHireDate") || "Hire Date"}
                value={user.hire_date ? new Date(user.hire_date).toLocaleDateString() : 'N/A'}
                disabled
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>

          {/* Editable fields */}
          <Box component="form" onSubmit={handleProfileSubmit(onProfileSubmit)}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={langPackLabel("txtFullName") || "Full Name"}
                  {...registerProfile('full_name')}
                  error={!!profileErrors.full_name}
                  helperText={profileErrors.full_name?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={langPackLabel("txtPhone") || "Phone"}
                  {...registerProfile('phone')}
                  error={!!profileErrors.phone}
                  helperText={profileErrors.phone?.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
                disabled={profileLoading || !isProfileDirty}
              >
                {profileLoading ? (langPackLabel("txtSaving") || 'Saving...') : (langPackLabel("txtSaveChanges") || 'Save Changes')}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Language Preference Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Language sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">{langPackLabel("txtLanguagePreference") || "Language Preference"}</Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ToggleButtonGroup
              value={language}
              exclusive
              onChange={handleLanguageChange}
              disabled={isLanguageLoading}
              aria-label="language selector"
            >
              <ToggleButton value="en" aria-label="English">
                English
              </ToggleButton>
              <ToggleButton value="tr" aria-label="Türkçe">
                Türkçe
              </ToggleButton>
            </ToggleButtonGroup>
            {isLanguageLoading && <CircularProgress size={24} />}
          </Box>
        </CardContent>
      </Card>

      {/* Password Change Card */}
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Lock sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">{langPackLabel("txtChangePassword") || "Change Password"}</Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <Alert severity="info" sx={{ mb: 3 }}>
            {langPackLabel("txtPasswordRequirements") || "Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, and one number."}
          </Alert>

          <Box component="form" onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={langPackLabel("txtCurrentPassword") || "Current Password"}
                  type={showCurrentPassword ? 'text' : 'password'}
                  {...registerPassword('currentPassword')}
                  error={!!passwordErrors.currentPassword}
                  helperText={passwordErrors.currentPassword?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle current password visibility"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          edge="end"
                        >
                          {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={langPackLabel("txtNewPassword") || "New Password"}
                  type={showNewPassword ? 'text' : 'password'}
                  {...registerPassword('newPassword')}
                  error={!!passwordErrors.newPassword}
                  helperText={passwordErrors.newPassword?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle new password visibility"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          edge="end"
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={langPackLabel("txtConfirmNewPassword") || "Confirm New Password"}
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...registerPassword('confirmPassword')}
                  error={!!passwordErrors.confirmPassword}
                  helperText={passwordErrors.confirmPassword?.message}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                color="warning"
                startIcon={<Lock />}
                disabled={passwordLoading}
              >
                {passwordLoading ? (langPackLabel("txtSaving") || 'Changing...') : (langPackLabel("txtChangePassword") || 'Change Password')}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfilePage;
