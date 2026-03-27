// src/components/auth/Signup.tsx (Create this file temporarily)
import React, { useState } from 'react';
import { UsersService } from '../../services/users';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useLanguage } from '../../contexts/LanguageContext';

const Signup: React.FC = () => {
  const { langPackLabel } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Pp123456');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('staff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await UsersService.create({
        email,
        full_name: fullName,
        role: role as any,
      });

      setSuccess(true);
      setEmail('');
      setFullName('');
    } catch (err: any) {
      setError(err.message || (langPackLabel("txtSomethingWentWrong") || 'Failed to create user'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Card sx={{ width: '100%' }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 3, textAlign: 'center' }}>
              {langPackLabel("txtCreateTestUser") || "Create Test User"}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {langPackLabel("txtUserCreatedLogin") || "User created successfully! You can now log in with email:"} {email} {langPackLabel("txtAndPassword") || "and password:"} Pp123456
              </Alert>
            )}

            <form onSubmit={handleSignup}>
              <TextField
                fullWidth
                label={langPackLabel("txtEmail") || "Email"}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                disabled={loading}
              />

              <TextField
                fullWidth
                label={langPackLabel("txtFullName") || "Full Name"}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                margin="normal"
                required
                disabled={loading}
              />

              <TextField
                fullWidth
                label={langPackLabel("txtPassword") || "Password"}
                type="text"
                value={password}
                disabled
                margin="normal"
                helperText={langPackLabel("txtDefaultPasswordTesting") || "Default password for testing"}
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>{langPackLabel("txtRole") || "Role"}</InputLabel>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  label={langPackLabel("txtRole") || "Role"}
                  required
                >
                  <MenuItem value="staff">{langPackLabel("txtStaff") || "Staff"}</MenuItem>
                  <MenuItem value="manager">{langPackLabel("txtManager") || "Manager"}</MenuItem>
                  <MenuItem value="admin">{langPackLabel("txtAdmins") || "Admin"}</MenuItem>
                </Select>
              </FormControl>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? (langPackLabel("txtCreatingUser") || 'Creating User...') : (langPackLabel("txtCreateTestUser") || 'Create Test User')}
              </Button>
            </form>

            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              {langPackLabel("txtTestingNote") || "Note: This is for testing only. In production, admin should create users."}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Signup;