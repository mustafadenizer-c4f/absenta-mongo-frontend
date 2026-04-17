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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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

const CodeBlock: React.FC<{ children: string }> = ({ children }) => (
  <Paper variant="outlined" sx={{ p: 2, bgcolor: '#1e1e2e', borderRadius: 2, overflow: 'auto', mb: 2 }}>
    <Typography component="pre" sx={{ m: 0, fontFamily: 'monospace', fontSize: '0.82rem', color: '#cdd6f4', whiteSpace: 'pre-wrap' }}>
      {children}
    </Typography>
  </Paper>
);

const DevGuidePage: React.FC = () => {
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
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>Developer Guide</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Technical documentation for developers working with {BRAND.name}.
        </Typography>

        <Paper sx={{ p: { xs: 3, md: 4 } }}>

          <Section title="Tech Stack">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Layer</TableCell>
                    <TableCell>Technology</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    ['Frontend', 'React 19, TypeScript, Material UI 7, Redux Toolkit, React Router 7'],
                    ['Backend', 'Node.js, Express 4, TypeScript, Mongoose 8'],
                    ['Database', 'MongoDB (shared + per-tenant + optional custom instances)'],
                    ['Auth', 'JWT (access 8h + refresh 30d), bcrypt, AES-256-CBC'],
                    ['Email', 'Nodemailer with per-company SMTP'],
                    ['Testing', 'Jest, fast-check (property-based testing)'],
                  ].map(([layer, tech]) => (
                    <TableRow key={layer}>
                      <TableCell sx={{ fontWeight: 600 }}>{layer}</TableCell>
                      <TableCell>{tech}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Section>

          <Divider sx={{ mb: 5 }} />

          <Section title="Quick Start">
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Backend</Typography>
            <CodeBlock>{`cd server
npm install
cp .env.example .env   # configure your environment variables
npm run dev             # starts on port 5000`}</CodeBlock>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Frontend</Typography>
            <CodeBlock>{`cd frontend
npm install
npm start               # starts on port 3000`}</CodeBlock>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>First Run</Typography>
            <CodeBlock>{`# Supervisor account is auto-created on first server start
# Seed i18n labels:
cd server && npm run seed:labels

# Login as supervisor, change default password, create your first company`}</CodeBlock>
          </Section>

          <Divider sx={{ mb: 5 }} />

          <Section title="Environment Variables">
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Backend (server/.env)</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Variable</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Required</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    ['PORT', 'Server port (default: 5000)', 'No'],
                    ['MONGODB_URI', 'MongoDB connection string', 'Yes'],
                    ['JWT_SECRET', 'Access token signing key', 'Yes'],
                    ['JWT_REFRESH_SECRET', 'Refresh token signing key', 'Yes'],
                    ['SMTP_ENCRYPTION_KEY', 'AES key for SMTP & custom MongoDB URI encryption', 'Yes'],
                    ['FRONTEND_URL', 'Frontend URL for CORS and password reset emails', 'Yes'],
                  ].map(([v, d, r]) => (
                    <TableRow key={v}>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{v}</TableCell>
                      <TableCell>{d}</TableCell>
                      <TableCell>{r}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Frontend (frontend/.env)</Typography>
              <CodeBlock>{`REACT_APP_API_URL=http://localhost:5000/api`}</CodeBlock>
            </Box>
          </Section>

          <Divider sx={{ mb: 5 }} />

          <Section title="Architecture">
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Multi-Tenant Database</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Each company gets its own MongoDB database named <code>t_&#123;companyId&#125;</code>. A shared database (<code>absenta</code>) holds cross-tenant data. The <code>tenantContext</code> middleware resolves the correct database on every request.
            </Typography>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Custom MongoDB Connections</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Companies can optionally connect their own MongoDB instance. The <code>getTenantModels()</code> function checks the Company document for <code>custom_mongo_enabled</code> and routes to the custom URI. Connections are pooled per URI (max 10) and cached. The <code>DomainRouting</code> table maps email domains to custom instances for transparent login routing.
            </Typography>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Authentication Flow</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Login follows a two-step resolution:
            </Typography>
            <CodeBlock>{`1. Extract email domain → query DomainRouting table
   → if match found & enabled → authenticate against custom MongoDB
2. Fall through to AuthLookup → find user in shared tenant DB
   → skip users with migrated_to_custom flag (unless stale)
3. Supervisor users → authenticate against shared User collection`}</CodeBlock>
          </Section>

          <Divider sx={{ mb: 5 }} />

          <Section title="API Endpoints">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Group</TableCell>
                    <TableCell>Base Path</TableCell>
                    <TableCell>Auth</TableCell>
                    <TableCell>Key Operations</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    ['Auth', '/api/auth', 'Mixed', 'Login, refresh, logout, forgot/reset password'],
                    ['Users', '/api/users', 'Yes', 'CRUD, password reset, language'],
                    ['Leave Requests', '/api/leave-requests', 'Yes', 'Create, list, edit, cancel, approve/reject'],
                    ['Balances', '/api/balances', 'Yes', 'Calculate balances, carryover'],
                    ['Leave Types', '/api/leave-types', 'Yes', 'CRUD (admin)'],
                    ['Holidays', '/api/holidays', 'Yes', 'CRUD (admin)'],
                    ['Important Days', '/api/important-days', 'Yes', 'CRUD (admin)'],
                    ['Organization', '/api/organization', 'Yes', 'Settings, SMTP, custom MongoDB, org structure'],
                    ['Supervisor', '/api/supervisor', 'Supervisor', 'Companies, reset DB, default leave types'],
                    ['Languages', '/api/languages', 'Yes', 'Labels CRUD'],
                  ].map(([g, p, a, o]) => (
                    <TableRow key={g}>
                      <TableCell sx={{ fontWeight: 600 }}>{g}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{p}</TableCell>
                      <TableCell>{a}</TableCell>
                      <TableCell>{o}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Section>

          <Divider sx={{ mb: 5 }} />

          <Section title="CLI Scripts">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Command</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    ['npm run dev', 'Dev server with hot reload (nodemon + ts-node)'],
                    ['npm run build', 'Compile TypeScript to dist/'],
                    ['npm start', 'Run compiled production server'],
                    ['npm run seed:labels', 'Seed/update i18n labels (upsert-safe)'],
                    ['npm run reset:supervisor', 'Reset supervisor password to default'],
                    ['npm test', 'Run Jest test suite'],
                  ].map(([cmd, desc]) => (
                    <TableRow key={cmd}>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{cmd}</TableCell>
                      <TableCell>{desc}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Section>

          <Divider sx={{ mb: 5 }} />

          <Section title="Project Structure">
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Backend (server/src/)</Typography>
            <CodeBlock>{`config/          — database.ts, tenantDb.ts (multi-tenant + custom connection pooling)
controllers/     — authController, customMongoController, supervisorController, ...
middleware/      — authenticate, authorize, tenantContext, errorHandler
models/          — User, Company, DomainRouting, Holiday, ImportantDay, ...
routes/          — Express route definitions
services/        — emailService (Nodemailer)
utils/           — connectionValidator, domainValidator, encryption, jwt, password, ...`}</CodeBlock>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Frontend (frontend/src/)</Typography>
            <CodeBlock>{`components/      — admin/, auth/, common/, manager/, staff/, supervisor/, public/
contexts/        — LanguageContext (i18n)
config/          — api client, brand config
services/        — API service classes
store/           — Redux store and slices
types/           — TypeScript interfaces`}</CodeBlock>
          </Section>

          <Divider sx={{ mb: 5 }} />

          <Section title="Deployment">
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Frontend</Typography>
            <CodeBlock>{`npm run build
# Upload build/ to S3
# CloudFront error pages: 403 → /index.html (200), 404 → /index.html (200)
# Invalidate cache: /*`}</CodeBlock>

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Backend</Typography>
            <Typography variant="body2" color="text.secondary">
              Deploy the compiled <code>dist/</code> folder to any Node.js host (EC2, ECS, Railway, etc.). Ensure MongoDB is accessible and environment variables are configured.
            </Typography>
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

export default DevGuidePage;
