// src/components/supervisor/SystemGuide.tsx — System Manual for Supervisors
import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const Section: React.FC<{ title: string; defaultExpanded?: boolean; children: React.ReactNode }> = ({
  title, defaultExpanded = false, children,
}) => (
  <Accordion defaultExpanded={defaultExpanded} sx={{ mb: 1 }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography variant="h6" fontWeight={600}>{title}</Typography>
    </AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>
);

const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box component="code" sx={{
    display: 'block', bgcolor: 'grey.100', p: 1.5, borderRadius: 1,
    fontFamily: 'monospace', fontSize: '0.85rem', my: 1, whiteSpace: 'pre-wrap',
  }}>
    {children}
  </Box>
);

const SystemGuide: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1, color: 'primary.main', fontWeight: 600 }}>
        System Manual
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Server administration guide for the Absenta platform supervisor.
      </Typography>

      {/* ── First Run ── */}
      <Section title="1. First Run Setup" defaultExpanded>
        <Typography variant="body2" sx={{ mb: 2 }}>
          On the very first server start, a default supervisor account is automatically created:
        </Typography>
        <Code>
          Email:    cloud4feed.dev@gmail.com{'\n'}
          Password: Pp123456{'\n'}
          (Password change required on first login)
        </Code>
        <Alert severity="warning" sx={{ mt: 2 }}>
          Change the default password immediately after first login. This is the only account with full system access.
        </Alert>
      </Section>

      {/* ── Company Management ── */}
      <Section title="2. Company Management">
        <Typography variant="body2" sx={{ mb: 2 }}>
          As supervisor, you create and manage all companies in the system. Each company gets its own isolated database automatically.
        </Typography>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Creating a Company</Typography>
        <List dense>
          <ListItem><ListItemText primary="Go to the Dashboard and click 'Add Company'" /></ListItem>
          <ListItem><ListItemText primary="Provide company name, contact email, and admin email" /></ListItem>
          <ListItem><ListItemText primary="An admin user is automatically created with the default password (Pp123456)" /></ListItem>
          <ListItem><ListItemText primary="Default leave types (Annual, Sick, Casual, etc.) are automatically seeded" /></ListItem>
          <ListItem><ListItemText primary="A separate tenant database is created for the company's data" /></ListItem>
        </List>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, mt: 2 }}>Activating / Deactivating Companies</Typography>
        <Typography variant="body2">
          Toggle a company's status to deactivate it. Deactivated companies prevent all their users from logging in. Data is preserved and can be reactivated at any time.
        </Typography>
      </Section>

      {/* ── Password Reset ── */}
      <Section title="3. Password Reset">
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Resetting a Company Admin Password</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          From the Dashboard, click the reset password button next to any company's admin user. This resets their password to the default (Pp123456) and forces a password change on next login.
        </Typography>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Resetting the Supervisor Password</Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          The supervisor account has no company and no SMTP configuration, so the "Forgot Password" email flow does not work for this account. If you lose access, use the CLI command:
        </Typography>
        <Code>
          cd server{'\n'}
          npm run reset:supervisor
        </Code>
        <Typography variant="body2" sx={{ mt: 1 }}>
          This resets the supervisor password back to <strong>Pp123456</strong> and requires a password change on next login.
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          This command requires direct access to the server machine and the MongoDB connection.
        </Alert>
      </Section>

      {/* ── Database Architecture ── */}
      <Section title="4. Database Architecture">
        <Typography variant="body2" sx={{ mb: 2 }}>
          Absenta uses a multi-tenant database architecture for data isolation between companies.
        </Typography>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Shared Database (absenta)</Typography>
        <List dense>
          <ListItem><ListItemText primary="Companies — company records and SMTP configuration" /></ListItem>
          <ListItem><ListItemText primary="Users — all user accounts across all companies" /></ListItem>
          <ListItem><ListItemText primary="Labels — i18n translation labels (shared across all companies)" /></ListItem>
          <ListItem><ListItemText primary="RefreshTokens, PasswordResetTokens — authentication tokens" /></ListItem>
        </List>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1, mt: 2 }}>Per-Company Database (absenta_tenant_&#123;companyId&#125;)</Typography>
        <List dense>
          <ListItem><ListItemText primary="Groups, Departments, Teams — organizational structure" /></ListItem>
          <ListItem><ListItemText primary="LeaveTypes — company-specific leave type definitions" /></ListItem>
          <ListItem><ListItemText primary="Holidays — company-specific public holidays" /></ListItem>
          <ListItem><ListItemText primary="LeaveRequests — all leave requests for the company's employees" /></ListItem>
          <ListItem><ListItemText primary="LeaveBalances — leave balance records" /></ListItem>
          <ListItem><ListItemText primary="CollectiveLeaves — company-wide collective leave records" /></ListItem>
        </List>
        <Alert severity="info" sx={{ mt: 1 }}>
          Tenant databases are created automatically when a company is added. No manual database setup is needed.
        </Alert>
      </Section>

      {/* ── Label Management ── */}
      <Section title="5. Label Management">
        <Typography variant="body2" sx={{ mb: 2 }}>
          Labels are the i18n translation strings used throughout the application. They are shared across all companies.
        </Typography>
        <List dense>
          <ListItem><ListItemText primary="Go to Label Management from the sidebar" /></ListItem>
          <ListItem><ListItemText primary="Each label has a key (labeltext), English value, and Turkish value" /></ListItem>
          <ListItem><ListItemText primary="Edit existing labels to customize text shown in the UI" /></ListItem>
          <ListItem><ListItemText primary="Add new labels if new features require them" /></ListItem>
          <ListItem><ListItemText primary="Changes take effect after users refresh or re-login" /></ListItem>
        </List>
      </Section>

      {/* ── CLI Commands ── */}
      <Section title="6. CLI Commands Reference">
        <Typography variant="body2" sx={{ mb: 2 }}>
          Available server commands (run from the <code>server/</code> directory):
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText
              primary={<code>npm run dev</code>}
              secondary="Start the development server with hot reload"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={<code>npm run build</code>}
              secondary="Compile TypeScript to JavaScript for production"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={<code>npm start</code>}
              secondary="Start the production server (requires build first)"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={<code>npm run seed</code>}
              secondary="Create the supervisor user if it doesn't exist"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={<code>npm run reset:supervisor</code>}
              secondary="Reset supervisor password to default (Pp123456)"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={<code>npm run seed:labels</code>}
              secondary={<>Seed or update i18n translation labels. Labels are defined in <code>server/scripts/seed-labels.ts</code> — add new entries to the <code>labels</code> array in that file, then run this command.</>}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={<code>npm test</code>}
              secondary="Run the test suite"
            />
          </ListItem>
        </List>
      </Section>

      {/* ── Environment Variables ── */}
      <Section title="7. Environment Variables">
        <Typography variant="body2" sx={{ mb: 2 }}>
          Configure these in the <code>.env</code> file in the server directory:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText
              primary={<code>PORT</code>}
              secondary="Server port (default: 5000)"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={<code>MONGODB_URI</code>}
              secondary="MongoDB connection string (default: mongodb://localhost:27017/absenta)"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={<code>JWT_SECRET</code>}
              secondary="Secret key for signing access tokens"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={<code>JWT_REFRESH_SECRET</code>}
              secondary="Secret key for signing refresh tokens"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={<code>SMTP_ENCRYPTION_KEY</code>}
              secondary="Key used to encrypt company SMTP passwords at rest"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary={<code>FRONTEND_URL</code>}
              secondary="Frontend URL used in password reset emails and CORS"
            />
          </ListItem>
        </List>
        <Alert severity="warning" sx={{ mt: 1 }}>
          Always use strong, unique values for JWT_SECRET, JWT_REFRESH_SECRET, and SMTP_ENCRYPTION_KEY in production.
        </Alert>
      </Section>
    </Box>
  );
};

export default SystemGuide;
