import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Divider,
  alpha,
} from '@mui/material';
import { ArrowBack, Login } from '@mui/icons-material';
import { BRAND } from '../../config/brand';

const GRADIENT = 'linear-gradient(135deg, #6f72ffff 0%, #F87171 100%)';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <Box sx={{ mb: 5 }}>
    <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.dark', mb: 2 }}>{title}</Typography>
    {children}
  </Box>
);

const BulletList: React.FC<{ items: string[] }> = ({ items }) => (
  <Box component="ul" sx={{ pl: 2.5, m: 0, '& li': { mb: 0.8 } }}>
    {items.map((item, i) => (
      <li key={i}><Typography variant="body2" color="text.secondary">{item}</Typography></li>
    ))}
  </Box>
);

const ManualPage: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Nav */}
      <Box sx={{ background: GRADIENT, py: 1.5, px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component="img" src="/logos/logo_white.png" alt={BRAND.name} sx={{ height: 32 }} />
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700 }}>{BRAND.name}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button component={RouterLink} to="/launch" size="small" sx={{ color: '#fff' }} startIcon={<ArrowBack />}>Back</Button>
          <Button component={RouterLink} to="/login" variant="outlined" size="small" sx={{ color: '#fff', borderColor: alpha('#fff', 0.5) }} startIcon={<Login />}>Sign In</Button>
        </Box>
      </Box>

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>User Manual</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Everything you need to know to use {BRAND.name} effectively.
        </Typography>

        <Paper sx={{ p: { xs: 3, md: 4 } }}>

          <Section title="Getting Started">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              When your company admin creates your account, you'll receive a default password. On your first login, you'll be asked to change it before accessing the application.
            </Typography>
            <BulletList items={[
              'Go to the login page and enter your email and default password.',
              'You\'ll be redirected to the password change screen.',
              'Set a new password (minimum 8 characters, at least one uppercase, one lowercase, one digit).',
              'After changing your password, you\'ll be taken to your dashboard.',
            ]} />
          </Section>

          <Divider sx={{ mb: 5 }} />

          <Section title="Requesting Leave">
            <BulletList items={[
              'Navigate to "Request Leave" from the sidebar.',
              'Select a leave type from the dropdown.',
              'Pick your start and end dates. The system automatically calculates working days, excluding weekends and holidays.',
              'For half-day leave, toggle the half-day option and select morning or afternoon.',
              'Optionally add a reason and select a covering person.',
              'Click Submit. Your manager will be notified by email (if configured).',
              'You can cancel a pending request or edit a pending/approved request from your Leave History.',
            ]} />
          </Section>

          <Divider sx={{ mb: 5 }} />

          <Section title="Understanding Your Balance">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Your leave balance is calculated automatically based on Turkish labor law:
            </Typography>
            <BulletList items={[
              'Annual leave: 14 days (1–5 years seniority), 20 days (5–15 years), 26 days (15+ years).',
              'If you\'re under 18 or over 50 with 1+ year seniority, the minimum is 20 days.',
              'Balances reset on your hire date anniversary each year.',
              'Unused leave carries over to the next period.',
              'The dashboard shows allocated, used, pending, and remaining days for each leave type.',
            ]} />
          </Section>

          <Divider sx={{ mb: 5 }} />

          <Section title="Calendar">
            <BulletList items={[
              'The calendar shows your leave, team members\' leave, holidays, and important days.',
              'Switch between month, week, day, and 3-month views.',
              'Leave events are colored by leave type. Holidays have a dashed red border. Important days have a solid colored border.',
              'Click any event to see full details.',
            ]} />
          </Section>

          <Divider sx={{ mb: 5 }} />

          <Section title="For Managers">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              In addition to all staff features, managers can:
            </Typography>
            <BulletList items={[
              'Approve or reject leave requests from direct reports via the Approvals page.',
              'Add an optional comment when approving or rejecting.',
              'View the team calendar with conflict detection — dates where 2+ team members are off are highlighted in red.',
              'View team leave balances and reports.',
              'Group Managers see group-wide data. Department Managers see department-wide data.',
            ]} />
          </Section>

          <Divider sx={{ mb: 5 }} />

          <Section title="For Admins">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Company admins have full control over the company configuration:
            </Typography>
            <BulletList items={[
              'User Management — Create, edit, delete users. Assign roles, teams, managers. Reset passwords.',
              'Leave Types — Create and manage leave types with bilingual names, default days, and color codes.',
              'Holidays — Create company holidays. Use "Seed Turkish Holidays" for quick setup.',
              'Important Days — Add visual markers to the calendar (birthdays, company events, etc.).',
              'Collective Leave — Create company-wide leave days that auto-generate requests for all employees.',
              'Settings → Organization — Choose and upgrade the hierarchy profile.',
              'Settings → Workdays — Configure working days, legal workdays, and rest days.',
              'Settings → Email — Configure SMTP for email notifications. Send test emails.',
              'Settings → Database — Connect a custom MongoDB instance for dedicated data storage.',
              'Approvals — View and approve/reject all pending requests company-wide.',
              'Team Calendar — Company-wide calendar with conflict detection.',
            ]} />
          </Section>

          <Divider sx={{ mb: 5 }} />

          <Section title="Custom Database Setup">
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              If your company requires dedicated data storage, the admin can connect a custom MongoDB instance:
            </Typography>
            <BulletList items={[
              'Go to Settings → Database tab.',
              'Enter your MongoDB connection URI (e.g., mongodb+srv://user:pass@host/db).',
              'Enter your company\'s email domain (e.g., acme.com). Public domains like gmail.com are not allowed.',
              'Click "Test Connection" to verify connectivity.',
              'Toggle "Enable Custom MongoDB" and click Save.',
              'You\'ll see a warning — after saving, you\'ll be logged out.',
              'On next login, all data starts fresh on your dedicated instance.',
              'All users with your company\'s email domain will be automatically routed to the custom database.',
              'To revert, contact your supervisor — they can reset the company to the system database.',
            ]} />
          </Section>

          <Divider sx={{ mb: 5 }} />

          <Section title="Language & Profile">
            <BulletList items={[
              'Click your avatar in the top-right corner to access your profile.',
              'Switch between English and Turkish from the language selector.',
              'The entire interface — including email notifications — will use your selected language.',
              'Update your personal information (phone, address, etc.) from the profile page.',
            ]} />
          </Section>

        </Paper>
      </Container>

      {/* Footer */}
      <Box sx={{ py: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">{BRAND.copyright}</Typography>
      </Box>
    </Box>
  );
};

export default ManualPage;
