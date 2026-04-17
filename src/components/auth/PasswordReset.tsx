// src/components/auth/PasswordReset.tsx
import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { BRAND } from '../../config/brand';
import { AuthService } from '../../services/auth';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

interface ResetPasswordFormInputs {
  newPassword: string;
}

const PasswordReset: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { langPackLabel } = useLanguage();

  const schema = yup.object({
    newPassword: yup
      .string()
      .min(6, langPackLabel('txtPasswordMinLength') || 'Password must be at least 6 characters')
      .required(langPackLabel('txtPasswordRequired') || 'Password is required'),
  }).required();

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<ResetPasswordFormInputs>({
    resolver: yupResolver(schema),
    defaultValues: { newPassword: '' },
  });

  const onSubmit: SubmitHandler<ResetPasswordFormInputs> = async (data) => {
    setSubmitting(true);
    setError(null);
    try {
      await AuthService.resetPassword(token, data.newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(
        err.message || langPackLabel('txtInvalidResetToken') || 'Invalid or expired reset token. Please request a new one.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Card sx={{ width: '100%', boxShadow: 'rgb(149 104 189 / 85%) 0px 22px 70px 4px' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                component="img"
                src={`${process.env.PUBLIC_URL}/logos/logo.png`}
                alt={BRAND.logoAlt}
                sx={{ height: 64, mx: 'auto', mb: 2 }}
              />
              <Typography
                component="h1"
                variant="h5"
                sx={{ fontWeight: 700, color: 'text.primary' }}
              >
                {langPackLabel('txtResetPassword') || 'Reset Password'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {langPackLabel('txtResetPasswordSubtitle') || 'Enter your new password below'}
              </Typography>
            </Box>

            {success ? (
              <Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  {langPackLabel('txtResetPasswordSuccess') || 'Your password has been reset successfully. Redirecting to login...'}
                </Alert>
                <Button
                  component={Link}
                  to="/login"
                  fullWidth
                  variant="contained"
                  sx={{
                    py: 1.5,
                    background: 'linear-gradient(135deg, #6366F1 0%, #F87171 100%)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4F46E5 0%, #EF4444 100%)',
                    },
                  }}
                >
                  {langPackLabel('txtBackToLogin') || 'Back to Login'}
                </Button>
              </Box>
            ) : (
              <Box>
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                    <Box sx={{ mt: 1 }}>
                      <Typography
                        component={Link}
                        to="/forgot-password"
                        variant="body2"
                        sx={{ color: 'inherit', fontWeight: 600 }}
                      >
                        {langPackLabel('txtRequestNewReset') || 'Request a new reset link'}
                      </Typography>
                    </Box>
                  </Alert>
                )}

                {!token ? (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    {langPackLabel('txtMissingToken') || 'No reset token found. Please use the link from your email.'}
                    <Box sx={{ mt: 1 }}>
                      <Typography
                        component={Link}
                        to="/forgot-password"
                        variant="body2"
                        sx={{ color: 'inherit', fontWeight: 600 }}
                      >
                        {langPackLabel('txtRequestNewReset') || 'Request a new reset link'}
                      </Typography>
                    </Box>
                  </Alert>
                ) : (
                  <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                    <TextField
                      margin="normal"
                      required
                      fullWidth
                      label={langPackLabel('txtNewPassword') || 'New Password'}
                      type={showPassword ? 'text' : 'password'}
                      id="newPassword"
                      autoComplete="new-password"
                      autoFocus
                      {...register('newPassword')}
                      error={!!formErrors.newPassword}
                      helperText={formErrors.newPassword?.message}
                      disabled={submitting}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      sx={{
                        mt: 3,
                        mb: 2,
                        py: 1.5,
                        background: 'linear-gradient(135deg, #6366F1 0%, #F87171 100%)',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #4F46E5 0%, #EF4444 100%)',
                        },
                      }}
                      disabled={submitting}
                    >
                      {submitting
                        ? (langPackLabel('txtResetting') || 'Resetting...')
                        : (langPackLabel('txtResetPassword') || 'Reset Password')}
                    </Button>

                    <Box sx={{ textAlign: 'center', mt: 1 }}>
                      <Typography
                        component={Link}
                        to="/login"
                        variant="body2"
                        sx={{ color: 'primary.main', textDecoration: 'none' }}
                      >
                        {langPackLabel('txtBackToLogin') || 'Back to Login'}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {BRAND.copyright}
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default PasswordReset;
