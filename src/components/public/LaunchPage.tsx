import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  alpha,
  keyframes,
} from '@mui/material';
import {
  CheckCircle,
  Storage,
  Security,
  Translate,
  CalendarMonth,
  Email,
  Groups,
  Gavel,
  ArrowForward,
  Login,
  MenuBook,
  Code,
  TrendingUp,
  Shield,
  Speed,
  Verified,
  EventAvailable,
  PersonAdd,
  Settings,
  Business,
  ThumbUp,
} from '@mui/icons-material';
import { BRAND } from '../../config/brand';

const GRADIENT = 'linear-gradient(135deg, #6f72ffff 0%, #F87171 100%)';
const GRADIENT_DARK = 'linear-gradient(135deg, #4F46E5 0%, #DC2626 100%)';
const GRADIENT_SUBTLE = 'linear-gradient(135deg, #EEF2FF 0%, #FEF2F2 100%)';

/* ── Animations ─────────────────────────────────────────────── */

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-12px) rotate(1deg); }
  66% { transform: translateY(-6px) rotate(-1deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

/* ── Decorative floating shapes ─────────────────────────────── */

const FloatingShape: React.FC<{
  size: number; top: string; left: string; delay: number; color: string; opacity?: number;
}> = ({ size, top, left, delay, color, opacity = 0.12 }) => (
  <Box sx={{
    position: 'absolute', top, left, width: size, height: size,
    borderRadius: '50%', bgcolor: color, opacity,
    animation: `${float} ${6 + delay}s ease-in-out infinite`,
    animationDelay: `${delay}s`, pointerEvents: 'none',
  }} />
);

/* ── Stats counter ──────────────────────────────────────────── */

const stats = [
  { value: '6', label: 'User Roles', icon: <Groups /> },
  { value: '4', label: 'Hierarchy Profiles', icon: <Business /> },
  { value: '2', label: 'Languages', icon: <Translate /> },
  { value: '∞', label: 'Companies', icon: <TrendingUp /> },
];

/* ── Features ───────────────────────────────────────────────── */

const features = [
  {
    icon: <Gavel sx={{ fontSize: 40 }} />,
    title: 'Turkish Labor Law Compliance',
    description: 'Full İş Kanunu Madde 53 support out of the box. Seniority tiers, age-based adjustments, sick leave rules — all calculated automatically.',
    gradient: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)',
  },
  {
    icon: <Verified sx={{ fontSize: 40 }} />,
    title: 'Extensible for Any Country',
    description: 'The entitlement engine is designed to be modular. Custom compliance modules can be developed for any jurisdiction. Your country, your rules.',
    gradient: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
  },
  {
    icon: <Storage sx={{ fontSize: 40 }} />,
    title: 'Bring Your Own Database',
    description: 'Connect your own MongoDB instance. Your employee data stays on your infrastructure. Login routing happens transparently via email domain.',
    gradient: 'linear-gradient(135deg, #F87171 0%, #DC2626 100%)',
  },
  {
    icon: <Security sx={{ fontSize: 40 }} />,
    title: 'True Multi-Tenant Isolation',
    description: 'Every company gets its own database. No shared tables, no row-level filtering. Add a custom MongoDB for complete physical isolation.',
    gradient: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
  },
  {
    icon: <Groups sx={{ fontSize: 40 }} />,
    title: 'Flexible Hierarchy',
    description: 'Four profiles — Flat, Teams, Departments, Groups. Start simple, upgrade as you grow. The UI adapts automatically.',
    gradient: 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)',
  },
  {
    icon: <Translate sx={{ fontSize: 40 }} />,
    title: 'Bilingual from Day One',
    description: 'Every screen, every email, every label — English and Turkish. Users pick their language. Labels are editable at runtime.',
    gradient: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)',
  },
  {
    icon: <CalendarMonth sx={{ fontSize: 40 }} />,
    title: 'Smart Calendars',
    description: 'Month, week, day, and 3-month views. Leave events, holidays, important days. Conflict detection for managers.',
    gradient: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
  },
  {
    icon: <Email sx={{ fontSize: 40 }} />,
    title: 'Email Notifications',
    description: 'Per-company SMTP. Notifications on submission, approval, rejection — in the recipient\'s language. Non-blocking delivery.',
    gradient: 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)',
  },
];

/* ── Steps ──────────────────────────────────────────────────── */

const steps = [
  { icon: <Business sx={{ fontSize: 28 }} />, title: 'Create Company', description: 'Supervisor creates a company — admin user, database, and leave types are set up automatically.' },
  { icon: <Settings sx={{ fontSize: 28 }} />, title: 'Configure', description: 'Admin sets hierarchy, workdays, email, and optionally connects a custom database.' },
  { icon: <PersonAdd sx={{ fontSize: 28 }} />, title: 'Add Employees', description: 'Assign roles, teams, managers. Employees get a default password and change it on first login.' },
  { icon: <EventAvailable sx={{ fontSize: 28 }} />, title: 'Request Leave', description: 'Employees pick a type, select dates, add a reason. Working days are calculated automatically.' },
  { icon: <ThumbUp sx={{ fontSize: 28 }} />, title: 'Approve', description: 'Manager approves with one click. Email sent. Balances update in real time.' },
];

/* ── Mock Dashboard Preview ─────────────────────────────────── */

const DashboardPreview: React.FC = () => (
  <Paper elevation={8} sx={{
    borderRadius: 3, overflow: 'hidden', maxWidth: 700, mx: 'auto',
    boxShadow: '0 25px 60px rgba(99, 102, 241, 0.25)',
    border: '1px solid', borderColor: alpha('#818CF8', 0.15),
  }}>
    {/* Title bar */}
    <Box sx={{ background: GRADIENT, px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ display: 'flex', gap: 0.6 }}>
        {['#FF5F57', '#FFBD2E', '#28C840'].map((c) => (
          <Box key={c} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c }} />
        ))}
      </Box>
      <Typography variant="caption" sx={{ color: alpha('#fff', 0.7), ml: 1, fontFamily: 'monospace' }}>{BRAND.name} Dashboard</Typography>
    </Box>
    {/* Content */}
    <Box sx={{ p: 3, bgcolor: '#F5F5FF' }}>
      {/* Stat cards row */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
        {[
          { label: 'Annual Leave', used: 5, total: 14, color: '#4CAF50' },
          { label: 'Sick Leave', used: 2, total: 10, color: '#F44336' },
          { label: 'Casual Leave', used: 1, total: 5, color: '#FF9800' },
        ].map((b) => (
          <Paper key={b.label} sx={{ flex: 1, p: 1.5, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{b.label}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: b.color }}>{b.total - b.used}</Typography>
              <Typography variant="caption" color="text.secondary">/ {b.total} days</Typography>
            </Box>
            <Box sx={{ mt: 1, height: 4, borderRadius: 2, bgcolor: alpha(b.color, 0.15) }}>
              <Box sx={{ height: '100%', borderRadius: 2, bgcolor: b.color, width: `${(b.used / b.total) * 100}%` }} />
            </Box>
          </Paper>
        ))}
      </Box>
      {/* Calendar preview */}
      <Paper sx={{ p: 1.5, borderRadius: 2 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>April 2026</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.3 }}>
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
            <Typography key={d} variant="caption" sx={{ textAlign: 'center', fontWeight: 600, color: 'text.secondary', fontSize: '0.65rem' }}>{d}</Typography>
          ))}
          {Array.from({ length: 2 }, (_, i) => (
            <Box key={`e${i}`} />
          ))}
          {Array.from({ length: 30 }, (_, i) => {
            const day = i + 1;
            const isLeave = [13, 14, 15, 16, 17].includes(day);
            const isHoliday = day === 23;
            const isToday = day === 17;
            return (
              <Box key={day} sx={{
                textAlign: 'center', py: 0.3, borderRadius: 1, fontSize: '0.65rem',
                bgcolor: isHoliday ? alpha('#F44336', 0.15) : isLeave ? alpha('#4CAF50', 0.15) : 'transparent',
                color: isHoliday ? '#D32F2F' : isLeave ? '#2E7D32' : 'text.primary',
                fontWeight: isToday ? 700 : 400,
                border: isToday ? '1.5px solid #818CF8' : 'none',
              }}>
                {day}
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  </Paper>
);

/* ── Main Component ─────────────────────────────────────────── */

const LaunchPage: React.FC = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', overflow: 'hidden' }}>
      {/* Nav */}
      <Box sx={{
        background: 'transparent', py: 1.5, px: { xs: 1.5, md: 3 },
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component="img" src="/logos/logo_white.png" alt={BRAND.name} sx={{ height: 32 }} />
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>{BRAND.name}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
          <Button component={RouterLink} to="/manual" size="small" sx={{ color: '#fff', textTransform: 'none', minWidth: 'auto', px: { xs: 1, md: 1.5 } }} startIcon={<MenuBook />}>
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Manual</Box>
          </Button>
          <Button component={RouterLink} to="/dev" size="small" sx={{ color: '#fff', textTransform: 'none', minWidth: 'auto', px: { xs: 1, md: 1.5 } }} startIcon={<Code />}>
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Dev</Box>
          </Button>
          <Button component={RouterLink} to="/login" variant="outlined" size="small" sx={{ color: '#fff', borderColor: alpha('#fff', 0.4), whiteSpace: 'nowrap', '&:hover': { borderColor: '#fff', bgcolor: alpha('#fff', 0.1) } }} startIcon={<Login />}>Sign In</Button>
        </Box>
      </Box>

      {/* Hero with floating shapes */}
      <Box sx={{
        background: GRADIENT, pt: 14, pb: 12, textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <FloatingShape size={300} top="-80px" left="-100px" delay={0} color="#fff" opacity={0.06} />
        <FloatingShape size={200} top="20%" left="80%" delay={1.5} color="#fff" opacity={0.05} />
        <FloatingShape size={150} top="60%" left="10%" delay={3} color="#fff" opacity={0.04} />
        <FloatingShape size={100} top="10%" left="50%" delay={2} color="#F87171" opacity={0.1} />
        <FloatingShape size={80} top="70%" left="70%" delay={4} color="#818CF8" opacity={0.08} />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ animation: `${slideUp} 0.8s ease-out` }}>
            <Chip label="Now Available" sx={{
              bgcolor: alpha('#fff', 0.18), color: '#fff', fontWeight: 600, mb: 2.5,
              backdropFilter: 'blur(10px)', border: '1px solid', borderColor: alpha('#fff', 0.2),
              fontSize: '0.85rem', height: 32,
            }} />
            <Typography variant="h2" sx={{
              color: '#fff', fontWeight: 800, mb: 2,
              fontSize: { xs: '2.2rem', md: '3.2rem' },
              lineHeight: 1.15,
              textShadow: '0 2px 20px rgba(0,0,0,0.15)',
            }}>
              Employee Leave Management<br />
              <Box component="span" sx={{
                background: 'linear-gradient(90deg, #fff 0%, #FDE68A 50%, #fff 100%)',
                backgroundSize: '200% auto',
                animation: `${shimmer} 4s linear infinite`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Done Right
              </Box>
            </Typography>
            <Typography variant="h6" sx={{
              color: alpha('#fff', 0.85), fontWeight: 400, mb: 4,
              maxWidth: 560, mx: 'auto', lineHeight: 1.6,
            }}>
              Built for Turkish labor law. Bilingual. Multi-tenant.
              With optional dedicated database isolation. Extensible for any country.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 6 }}>
              <Button component={RouterLink} to="/login" variant="contained" size="large" sx={{
                bgcolor: '#fff', color: '#fff', fontWeight: 700, background: GRADIENT_DARK,
                '&:hover': { background: GRADIENT, transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.15)' },
                px: 4, py: 1.3, fontSize: '1rem', transition: 'all 0.2s',
              }}>
                Get Started
              </Button>
              <Button component={RouterLink} to="/manual" variant="outlined" size="large" sx={{
                color: '#fff', borderColor: alpha('#fff', 0.4), fontWeight: 600,
                '&:hover': { borderColor: '#fff', bgcolor: alpha('#fff', 0.1), transform: 'translateY(-2px)' },
                px: 4, py: 1.3, fontSize: '1rem', transition: 'all 0.2s',
              }}>
                Learn More
              </Button>
            </Box>
          </Box>

          {/* Dashboard preview */}
          <Box sx={{ animation: `${slideUp} 1s ease-out 0.3s both` }}>
            <DashboardPreview />
          </Box>
        </Container>
      </Box>

      {/* Stats bar */}
      <Box sx={{ background: GRADIENT_SUBTLE, py: 5 }}>
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 3 }}>
            {stats.map((s, i) => (
              <Box key={i} sx={{ textAlign: 'center', animation: `${slideUp} 0.6s ease-out ${0.1 * i}s both` }}>
                <Box sx={{ color: 'primary.main', mb: 0.5 }}>{s.icon}</Box>
                <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.dark', lineHeight: 1 }}>{s.value}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>{s.label}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Features with gradient icon backgrounds */}
      <Container maxWidth="lg" sx={{ py: 10 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Chip label="Features" size="small" sx={{ mb: 1.5, bgcolor: alpha('#818CF8', 0.1), color: 'primary.dark', fontWeight: 600 }} />
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5 }}>
            What Makes {BRAND.name} Different
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
            Purpose-built for companies operating in Turkey, with features nobody else offers.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
          {features.map((f, i) => (
            <Card key={i} sx={{
              flex: '1 1 300px', maxWidth: 360,
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 40px rgba(99, 102, 241, 0.15)' },
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{
                  width: 56, height: 56, borderRadius: 2.5,
                  background: f.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', mb: 2, boxShadow: `0 8px 20px ${alpha(f.gradient.includes('#818CF8') ? '#818CF8' : f.gradient.includes('#F87171') ? '#F87171' : f.gradient.includes('#34D399') ? '#34D399' : f.gradient.includes('#FBBF24') ? '#FBBF24' : f.gradient.includes('#A78BFA') ? '#A78BFA' : f.gradient.includes('#38BDF8') ? '#38BDF8' : '#FB923C', 0.3)}`,
                }}>
                  {f.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{f.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{f.description}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>

      {/* How It Works — timeline style */}
      <Box sx={{ background: GRADIENT_SUBTLE, py: 10 }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Chip label="How It Works" size="small" sx={{ mb: 1.5, bgcolor: alpha('#818CF8', 0.1), color: 'primary.dark', fontWeight: 600 }} />
            <Typography variant="h3" sx={{ fontWeight: 800 }}>Up and Running in 5 Minutes</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
            {/* Vertical line */}
            <Box sx={{
              position: 'absolute', left: 27, top: 28, bottom: 28, width: 2,
              background: `linear-gradient(to bottom, ${alpha('#818CF8', 0.3)}, ${alpha('#F87171', 0.3)})`,
            }} />
            {steps.map((s, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', py: 2, position: 'relative' }}>
                <Box sx={{
                  width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                  background: GRADIENT, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                  zIndex: 1,
                }}>
                  {s.icon}
                </Box>
                <Paper sx={{
                  flex: 1, p: 2.5, borderRadius: 2.5,
                  transition: 'all 0.2s',
                  '&:hover': { boxShadow: '0 8px 25px rgba(99, 102, 241, 0.12)' },
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Step {i + 1}: {s.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">{s.description}</Typography>
                </Paper>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Trust indicators */}
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
          {[
            { icon: <Shield sx={{ fontSize: 32 }} />, title: 'AES-256 Encryption', desc: 'All credentials encrypted at rest' },
            { icon: <Speed sx={{ fontSize: 32 }} />, title: 'Connection Pooling', desc: 'Max 10 connections per custom URI' },
            { icon: <Verified sx={{ fontSize: 32 }} />, title: 'Compliance Ready', desc: 'Turkish law built-in, extensible to any country' },
          ].map((t, i) => (
            <Paper key={i} variant="outlined" sx={{
              flex: '1 1 200px', maxWidth: 280, p: 3, textAlign: 'center',
              borderColor: alpha('#818CF8', 0.15), borderRadius: 3,
              transition: 'all 0.2s',
              '&:hover': { borderColor: 'primary.main', boxShadow: `0 0 0 1px ${alpha('#818CF8', 0.2)}` },
            }}>
              <Box sx={{ color: 'primary.main', mb: 1, animation: `${pulse} 3s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }}>{t.icon}</Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>{t.title}</Typography>
              <Typography variant="caption" color="text.secondary">{t.desc}</Typography>
            </Paper>
          ))}
        </Box>
      </Container>

      <Divider />

      {/* Feature checklist */}
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="h3" sx={{ fontWeight: 800 }}>Everything You Need</Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          {[
            'Leave request submission with half-day support',
            'Manager approval workflow with comments',
            'Turkish labor law entitlement engine (extensible to other countries)',
            'Real-time balance tracking per leave type',
            'Collective leave for company-wide days off',
            'Custom MongoDB with encrypted URI storage',
            'Domain-based transparent login routing',
            'Per-company SMTP email notifications',
            'Bilingual UI — English and Turkish',
            'Interactive calendars with conflict detection',
            'Configurable workday and legal workday rules',
            'Six user roles with granular permissions',
            'Supervisor emergency database reset',
            'In-app bilingual user and system manuals',
            'Automatic carryover and period tracking',
            'Overlap detection and covering person assignment',
          ].map((item, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', py: 1 }}>
              <CheckCircle sx={{ color: 'success.main', fontSize: 20, flexShrink: 0 }} />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{item}</Typography>
            </Box>
          ))}
        </Box>
      </Container>

      {/* CTA */}
      <Box sx={{
        background: GRADIENT, py: 8, textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <FloatingShape size={200} top="-50px" left="-50px" delay={0} color="#fff" opacity={0.06} />
        <FloatingShape size={150} top="50%" left="85%" delay={2} color="#fff" opacity={0.05} />
        <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h3" sx={{ color: '#fff', fontWeight: 800, mb: 2 }}>Ready to get started?</Typography>
          <Typography variant="body1" sx={{ color: alpha('#fff', 0.85), mb: 4, fontSize: '1.1rem' }}>
            Leave management that respects your time, your language, and your data.
          </Typography>
          <Button component={RouterLink} to="/login" variant="contained" size="large" endIcon={<ArrowForward />} sx={{
            bgcolor: '#fff', color: '#fff', fontWeight: 700, background: GRADIENT_DARK,
            '&:hover': { background: GRADIENT, transform: 'translateY(-2px)', boxShadow: '0 8px 25px rgba(0,0,0,0.2)' },
            px: 5, py: 1.5, fontSize: '1.05rem', transition: 'all 0.2s',
          }}>
            Sign In
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 4, textAlign: 'center', bgcolor: 'background.paper' }}>
        <Typography variant="body2" color="text.secondary">{BRAND.copyright}</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1 }}>
          <Button component={RouterLink} to="/manual" size="small" color="inherit" sx={{ textTransform: 'none', color: 'text.secondary' }}>User Manual</Button>
          <Button component={RouterLink} to="/dev" size="small" color="inherit" sx={{ textTransform: 'none', color: 'text.secondary' }}>Developer Guide</Button>
          <Button component={RouterLink} to="/login" size="small" color="inherit" sx={{ textTransform: 'none', color: 'text.secondary' }}>Sign In</Button>
        </Box>
      </Box>
    </Box>
  );
};

export default LaunchPage;
