// src/components/group-manager/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAutoClearing } from '../../hooks/useAutoClearing';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  People,
  BeachAccess,
  PendingActions,
  EventNote,
  Refresh,
  ArrowForward,
} from '@mui/icons-material';
import { apiClient } from '../../config/api';
import { useAuth } from '../../hooks/useAuth';
import { BalanceService } from '../../services/balance';
import { EnhancedLeaveBalanceSummary } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface GroupStats {
  totalMembers: number;
  onLeaveToday: number;
  pendingApprovals: number;
  upcomingLeaves: number;
}

interface WeekDayAvailability {
  date: Date;
  label: string;
  dayName: string;
  onLeaveCount: number;
  memberNames: string[];
}

const GroupManagerDashboard: React.FC = () => {
  const { langPackLabel } = useLanguage();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<GroupStats>({
    totalMembers: 0,
    onLeaveToday: 0,
    pendingApprovals: 0,
    upcomingLeaves: 0,
  });
  const [weekAvailability, setWeekAvailability] = useState<WeekDayAvailability[]>([]);
  const [personalBalances, setPersonalBalances] = useState<EnhancedLeaveBalanceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useAutoClearing(7000);

  useEffect(() => {
    fetchDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!currentUser?.id || !currentUser?.group_id) {
        setError(langPackLabel("txtNoAuthenticatedUser") || 'No authenticated user or group assignment found');
        return;
      }

      // Fetch all users in the same group
      const groupMembers: { id: string; full_name: string }[] = await apiClient.get('/users', {
        group_id: currentUser.group_id,
        select: 'id,full_name',
      });

      const memberIds = (groupMembers ?? []).map((m) => m.id);
      const today = new Date().toISOString().split('T')[0];

      let pendingCount = 0;
      let onLeaveTodayCount = 0;
      let upcomingCount = 0;

      if (memberIds.length > 0) {
        const pendingData: any[] = await apiClient.get('/leave-requests/scope', {
          status: 'pending',
          user_ids: memberIds.join(','),
        });
        pendingCount = (pendingData ?? []).length;

        const approvedData: any[] = await apiClient.get('/leave-requests/scope', {
          status: 'approved',
          user_ids: memberIds.join(','),
        });
        onLeaveTodayCount = (approvedData ?? []).filter(
          (r: any) => r.start_date <= today && r.end_date >= today
        ).length;

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        const futureDateStr = futureDate.toISOString().split('T')[0];

        const upcomingData: any[] = await apiClient.get('/leave-requests/scope', {
          status: 'approved,pending',
          user_ids: memberIds.join(','),
          start_date: today,
          end_date: futureDateStr,
        });
        upcomingCount = (upcomingData ?? []).filter(
          (r: any) => r.start_date > today
        ).length;
      }

      setStats({
        totalMembers: groupMembers?.length ?? 0,
        onLeaveToday: onLeaveTodayCount,
        pendingApprovals: pendingCount,
        upcomingLeaves: upcomingCount,
      });

      // Build 4-week availability
      await buildWeekAvailability(groupMembers ?? []);

      // Fetch personal leave balances
      if (currentUser) {
        try {
          const bal = await BalanceService.getBalances(currentUser.id, currentUser.hire_date, currentUser.birth_date || '', currentUser.company_id);
          setPersonalBalances(bal);
        } catch { /* skip personal balance errors */ }
      }
    } catch (err: any) {
      setError(err.message || langPackLabel("txtFailedToLoad") || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const buildWeekAvailability = async (
    groupMembers: { id: string; full_name: string }[]
  ) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    // Generate 4 weeks of weekdays (Mon-Fri)
    const weekDays: Date[] = [];
    for (let week = 0; week < 4; week++) {
      for (let day = 0; day < 5; day++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + week * 7 + day);
        weekDays.push(d);
      }
    }

    const rangeStart = weekDays[0].toISOString().split('T')[0];
    const rangeEnd = weekDays[weekDays.length - 1].toISOString().split('T')[0];

    const memberIds = groupMembers.map((m) => m.id);
    if (memberIds.length === 0) {
      setWeekAvailability(
        weekDays.map((d) => ({
          date: d,
          label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
          onLeaveCount: 0,
          memberNames: [],
        }))
      );
      return;
    }

    let weekLeavesData: any[] = [];
    try {
      weekLeavesData = await apiClient.get('/leave-requests/scope', {
        status: 'approved',
        user_ids: memberIds.join(','),
        start_date: rangeStart,
        end_date: rangeEnd,
      });
    } catch (err) {
      console.error('Error fetching week leaves:', err);
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const availability: WeekDayAvailability[] = weekDays.map((d) => {
      const dateStr = d.toISOString().split('T')[0];
      const onLeave = (weekLeavesData ?? []).filter(
        (l: any) => l.start_date <= dateStr && l.end_date >= dateStr
      );
      const names = onLeave.map((l: any) => l.user_id?.full_name ?? (l.user as any)?.full_name ?? 'Unknown');
      return {
        date: d,
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        dayName: dayNames[d.getDay()],
        onLeaveCount: onLeave.length,
        memberNames: names,
      };
    });

    setWeekAvailability(availability);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
        <Button onClick={fetchDashboardData} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 600 }}>
          {langPackLabel("txtDashboard") || "Group Manager Dashboard"}
        </Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchDashboardData}>{langPackLabel("txtRefresh") || "Refresh"}</Button>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {/* Team Size */}
        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <People color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">{langPackLabel("txtTeamSize") || "Team Size"}</Typography>
            </Box>
            <Typography variant="h4" color="primary">
              {stats.totalMembers}
            </Typography>
          </CardContent>
        </Card>

        {/* On Leave Today */}
        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BeachAccess sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="h6">{langPackLabel("txtOnLeaveToday") || "On Leave Today"}</Typography>
            </Box>
            <Typography variant="h4" sx={{ color: 'warning.main' }}>
              {stats.onLeaveToday}
            </Typography>
          </CardContent>
        </Card>

        {/* Pending Approvals — Clickable */}
        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardActionArea onClick={() => navigate('/group-manager/approvals')}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PendingActions sx={{ mr: 1, color: 'error.main' }} />
                <Typography variant="h6">{langPackLabel("txtPendingApprovals") || "Pending Approvals"}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h4" sx={{ color: 'error.main' }}>
                  {stats.pendingApprovals}
                </Typography>
                <ArrowForward color="action" />
              </Box>
            </CardContent>
          </CardActionArea>
        </Card>

        {/* Upcoming Leaves */}
        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <EventNote sx={{ mr: 1, color: 'info.main' }} />
              <Typography variant="h6">{langPackLabel("txtUpcomingLeaves") || "Upcoming Leaves"}</Typography>
            </Box>
            <Typography variant="h4" sx={{ color: 'info.main' }}>
              {stats.upcomingLeaves}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {langPackLabel("txtNext30Days") || "Next 30 days"}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Personal Leave Balances */}
      {personalBalances.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            {langPackLabel("txtMyLeaveBalances") || "My Leave Balances"}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
            {personalBalances.filter((b) => {
              const name = b.leave_type_name.toLowerCase();
              return name.includes('annual') || name.includes('casual') || name.includes('sick') || b.used > 0;
            }).map((balance) => (
              <Card
                key={balance.leave_type_id}
                sx={{ flex: '1 1 200px', minWidth: '200px', borderTop: 4, borderColor: balance.color_code }}
              >
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {balance.leave_type_name}
                  </Typography>
                  <Typography variant="h4" sx={{ color: balance.remaining < 0 ? 'error.main' : balance.color_code, mb: 1 }}>
                    {balance.remaining}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">{langPackLabel("txtRemaining") || "remaining"}</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">{langPackLabel("txtAllocated") || "Allocated"}: {balance.allocated}</Typography>
                    <Typography variant="caption" color="text.secondary">{langPackLabel("txtUsed") || "Used"}: {balance.used}</Typography>
                    <Typography variant="caption" color="text.secondary">{langPackLabel("txtPendingLabel") || "Pending"}: {balance.pending}</Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </>
      )}

      {/* Group Availability — 4 Weeks */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        {langPackLabel("txtGroupAvailability") || "Group Availability — Next 4 Weeks"}
      </Typography>
      <Paper sx={{ mb: 4, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: 60 }}>{langPackLabel("txtWeek") || "Week"}</TableCell>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => (
                  <TableCell key={day} align="center" sx={{ fontWeight: 600 }}>
                    {day}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {[0, 1, 2, 3].map((weekIdx) => {
                const weekDays = weekAvailability.slice(weekIdx * 5, weekIdx * 5 + 5);
                if (weekDays.length === 0) return null;
                const weekLabel = weekDays[0]?.label;
                return (
                  <TableRow key={weekIdx}>
                    <TableCell>
                      <Typography variant="caption" fontWeight={600}>{weekLabel}</Typography>
                    </TableCell>
                    {weekDays.map((day) => (
                      <TableCell
                        key={day.label}
                        align="center"
                        sx={{
                          bgcolor:
                            day.date.toISOString().split('T')[0] === todayStr
                              ? 'primary.light'
                              : 'transparent',
                          verticalAlign: 'top',
                        }}
                      >
                        <Typography variant="caption" display="block" color="text.secondary">
                          {day.label}
                        </Typography>
                        {day.onLeaveCount === 0 ? (
                          <Chip label="✓" color="success" size="small" variant="outlined" />
                        ) : (
                          <Box>
                            <Chip
                              label={`${day.onLeaveCount}`}
                              color="warning"
                              size="small"
                              sx={{ mb: 0.5 }}
                            />
                            {day.memberNames.map((name, idx) => (
                              <Typography key={idx} variant="caption" display="block" color="text.secondary" noWrap>
                                {name}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default GroupManagerDashboard;
