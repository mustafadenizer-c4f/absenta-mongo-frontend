// src/components/supervisor/Dashboard.tsx — Supervisor Overview / Profile
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../store';
import {
  Box, Typography, Card, CardContent, CardActionArea, CircularProgress, Chip, Avatar,
} from '@mui/material';
import {
  Business, Translate, MenuBook, EventNote, Person, ArrowForward,
} from '@mui/icons-material';
import { SupervisorService } from '../../services/supervisor';
import { LanguageService } from '../../services/language';
import { CompanyWithAdmin } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { formatLocalDate } from '../../utils/localize';

const SupervisorDashboard: React.FC = () => {
  const { langPackLabel, language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [companies, setCompanies] = useState<CompanyWithAdmin[]>([]);
  const [labelCount, setLabelCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [comps, labels] = await Promise.all([
          SupervisorService.getCompaniesWithAdmins(),
          LanguageService.getAllLabels(),
        ]);
        setCompanies(comps);
        setLabelCount(labels.length);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const activeCount = companies.filter((c) => c.status).length;
  const inactiveCount = companies.filter((c) => !c.status).length;

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;

  return (
    <Box>
      {/* Profile Header */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, py: 3 }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 28 }}>
            {user?.full_name?.charAt(0).toUpperCase() || 'S'}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>{user?.full_name || 'Supervisor'}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>{user?.email}</Typography>
            <Chip label="Supervisor" size="small" sx={{ mt: 0.5, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
          </Box>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        {[
          { label: langPackLabel("txtCompanies") || 'Companies', value: companies.length, color: '#667eea', icon: <Business /> },
          { label: langPackLabel("txtActive") || 'Active', value: activeCount, color: '#34D399', icon: <Business /> },
          { label: langPackLabel("txtInactive") || 'Inactive', value: inactiveCount, color: '#FB7185', icon: <Business /> },
          { label: langPackLabel("txtLabelManagement") || 'Labels', value: labelCount, color: '#F59E0B', icon: <Translate /> },
        ].map((s, i) => (
          <Card key={i} sx={{ flex: '1 1 160px', minWidth: 140 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, '&:last-child': { pb: 2 } }}>
              <Avatar sx={{ bgcolor: s.color + '20', color: s.color, width: 44, height: 44 }}>{s.icon}</Avatar>
              <Box>
                <Typography variant="h4" fontWeight={700} sx={{ color: s.color }}>{s.value}</Typography>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Quick Navigation */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>{langPackLabel("txtQuickActions") || "Quick Actions"}</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        {[
          { label: langPackLabel("txtCompanies") || 'Manage Companies', icon: <Business />, path: '/supervisor/companies', desc: `${companies.length} companies` },
          { label: langPackLabel("txtDefaultLeaveTypes") || 'Default Leave Types', icon: <EventNote />, path: '/supervisor/default-leave-types', desc: 'Configure defaults for new companies' },
          { label: langPackLabel("txtLabelManagement") || 'Label Management', icon: <Translate />, path: '/supervisor/labels', desc: `${labelCount} labels` },
          { label: langPackLabel("txtAppManual") || 'System Guide', icon: <MenuBook />, path: '/supervisor/guide', desc: 'Documentation & help' },
        ].map((item, i) => (
          <Card key={i} sx={{ flex: '1 1 240px', minWidth: 220 }}>
            <CardActionArea onClick={() => navigate(item.path)} sx={{ p: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 0 }}>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>{item.icon}</Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>{item.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
                </Box>
                <ArrowForward color="action" fontSize="small" />
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>

      {/* Recent Companies */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>{langPackLabel("txtCompanies") || "Recent Companies"}</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {companies.slice(0, 6).map((c) => (
          <Card key={c.id} sx={{ flex: '1 1 280px', minWidth: 260, cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => navigate('/supervisor/companies')}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>{c.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{c.admin_user?.email || '—'}</Typography>
                  {c.admin_user?.last_login && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      {langPackLabel("txtLastLogin") || "Last login"}: {formatLocalDate(c.admin_user.last_login, language)}
                    </Typography>
                  )}
                </Box>
                <Chip label={c.status ? (langPackLabel("txtActive") || 'Active') : (langPackLabel("txtInactive") || 'Inactive')} color={c.status ? 'success' : 'error'} size="small" />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default SupervisorDashboard;
