// src/components/auth/ForgotPassword.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
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
} from '@mui/material';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

interface ForgotPasswordFormInputs {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { langPackLabel } = useLanguage();

  const schema = yup.object({
    email: yup
      .string()
      .email(langPackLabel('txtInvalidEmail') || 'Please enter a valid email')
      .required(langPackLabel('txtEmailRequired') || 'Email is required'),
  }).required();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormInputs>({
    resolver: yupResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit: SubmitHandler<ForgotPasswordFormInputs> = async (data) => {
    setSubmitting(true);
    try {
      await AuthService.forgotPassword(data.email);
    } catch {
      // Show confirmation regardless of result
    } finally {
      setSubmitting(false);
      setSubmitted(true);
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
                alt="Cloud4Feed Absenta"
                sx={{ height: 64, mx: 'auto', mb: 2 }}
              />
              <Typography
                component="h1"
                variant="h5"
                sx={{ fontWeight: 700, color: 'text.primary' }}
              >
                {langPackLabel('txtForgotPassword') || 'Forgot Password'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {langPackLabel('txtForgotPasswordSubtitle') || 'Enter your email to receive a password reset link'}
              </Typography>
            </Box>

            {submitted ? (
              <Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  {langPackLabel('txtResetLinkSent') || 'If an account with that email exists, a password reset link has been sent.'}
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
              <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label={langPackLabel('txtEmailAddress') || 'Email Address'}
                  autoComplete="email"
                  autoFocus
                  {...register('email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={submitting}
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
                    ? (langPackLabel('txtSending') || 'Sending...')
                    : (langPackLabel('txtSendResetLink') || 'Send Reset Link')}
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
          </CardContent>
        </Card>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} Cloud4Feed Absenta
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default ForgotPassword;
