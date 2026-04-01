// src/components/manager/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { useAutoClearing } from '../../hooks/useAutoClearing';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
import { LeaveService } from '../../services/leave';
import { HolidaysService } from '../../services/holidays';
import { EnhancedLeaveBalanceSummary, Holiday } from '../../types';
import { selectWorkdayConfig } from '../../store/slices/organizationSlice';
import { useLanguage } from '../../contexts/LanguageContext';
import { localizedBalanceName, formatLocalDate } from '../../utils/localize';
import { getDayNames } from '../../utils/calendarLocalizer';

interface TeamStats {
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
  isHoliday: boolean;
  holidayName: string;
}

const ManagerDashboard: React.FC = () => {
  const { langPackLabel, language } = useLanguage();
  const DAY_NAMES = getDayNames(language);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const workdayConfig = useSelector(selectWorkdayConfig);
  const [stats, setStats] = useState<TeamStats>({
    totalMembers: 0,
    onLeaveToday: 0,
    pendingApprovals: 0,
    upcomingLeaves: 0,
  });
  const [weekAvailability, setWeekAvailability] = useState<WeekDayAvailability[]>([]);
  const [personalBalances, setPersonalBalances] = useState<EnhancedLeaveBalanceSummary[]>([]);
  const [myUpcomingLeaves, setMyUpcomingLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useAutoClearing(7000);

  useEffect(() => {
    fetchDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch team members (staff assigned to this manager)
      if (!currentUser?.id) {
        setError(langPackLabel("txtNoAuthenticatedUser") || 'No authenticated user found');
        return;
      }

      const teamMembers: { id: string; full_name: string }[] = await apiClient.get('/users', {
        manager_id: currentUser.id,
        select: 'id,full_name',
      });

      const todayLocal = new Date();
      const today = `${todayLocal.getFullYear()}-${(todayLocal.getMonth() + 1).toString().padStart(2, '0')}-${todayLocal.getDate().toString().padStart(2, '0')}`;

      const memberIds = (teamMembers ?? []).map((m) => m.id);

      // Fetch pending and on-leave data via scoped requests
      let pendingCount = 0;
      let onLeaveTodayCount = 0;
      let upcomingCount = 0;

      if (memberIds.length > 0) {
        const pendingRequests: any[] = await apiClient.get('/leave-requests/scope', {
          status: 'pending',
          user_ids: memberIds.join(','),
        });
        pendingCount = (pendingRequests ?? []).length;

        const onLeaveRequests: any[] = await apiClient.get('/leave-requests/scope', {
          status: 'approved',
          user_ids: memberIds.join(','),
        });
        onLeaveTodayCount = (onLeaveRequests ?? []).filter(
          (r: any) => (r.start_date || '').split('T')[0] <= today && (r.end_date || '').split('T')[0] >= today
        ).length;

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        const futureDateStr = `${futureDate.getFullYear()}-${(futureDate.getMonth() + 1).toString().padStart(2, '0')}-${futureDate.getDate().toString().padStart(2, '0')}`;

        const upcomingRequests: any[] = await apiClient.get('/leave-requests/scope', {
          status: 'approved,pending',
          user_ids: memberIds.join(','),
          start_date: today,
          end_date: futureDateStr,
        });
        upcomingCount = (upcomingRequests ?? []).filter(
          (r: any) => (r.start_date || '').split('T')[0] > today
        ).length;
      }

      setStats({
        totalMembers: teamMembers?.length ?? 0,
        onLeaveToday: onLeaveTodayCount,
        pendingApprovals: pendingCount,
        upcomingLeaves: upcomingCount,
      });

      // Build 4-week availability
      await buildWeekAvailability(teamMembers ?? []);

      // Fetch personal leave balances
      if (currentUser) {
        try {
          const bal = await BalanceService.getBalances(currentUser.id, currentUser.hire_date, currentUser.birth_date || '', currentUser.company_id);
          setPersonalBalances(bal);
        } catch { /* skip personal balance errors */ }

        try {
          const result = await LeaveService.getRequests(currentUser.id);
          const leaves = Array.isArray(result) ? result : [];
          const now = new Date();
          const upcoming = leaves
            .filter((r: any) => (r.status === 'approved' || r.status === 'pending') && new Date(r.end_date) >= now)
            .sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
            .slice(0, 5);
          setMyUpcomingLeaves(upcoming);
        } catch { /* skip */ }
      }
    } catch (err: any) {
      setError(err.message || langPackLabel("txtFailedToLoad") || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const buildWeekAvailability = async (
    teamMembers: { id: string; full_name: string }[]
  ) => {
    const sortedWorkdays = [...workdayConfig].sort((a, b) => a - b);
    const dateLocale = language === 'tr' ? 'tr-TR' : 'en-US';

    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    const weekDays: Date[] = [];
    for (let week = 0; week < 4; week++) {
      for (const wd of sortedWorkdays) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + week * 7 + wd);
        weekDays.push(d);
      }
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    const toLocalDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const rangeStart = toLocalDate(weekDays[0]);
    const rangeEnd = toLocalDate(weekDays[weekDays.length - 1]);

    // Fetch holidays
    let holidays: Holiday[] = [];
    try {
      if (currentUser?.company_id) {
        holidays = await HolidaysService.getAll(currentUser.company_id) || [];
      }
    } catch { /* skip */ }

    const memberIds = teamMembers.map((m) => m.id);
    if (memberIds.length === 0) {
      setWeekAvailability(
        weekDays.map((d) => {
          const dateStr = toLocalDate(d);
          const holiday = holidays.find((h) => {
            const hStart = (h.holiday_date || '').split('T')[0];
            const hEnd = (h.holiday_end_date || h.holiday_date || '').split('T')[0];
            return dateStr >= hStart && dateStr <= hEnd;
          });
          return {
            date: d,
            label: d.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' }),
            dayName: DAY_NAMES[d.getDay()],
            onLeaveCount: 0,
            memberNames: [],
            isHoliday: !!holiday,
            holidayName: holiday?.name || '',
          };
        })
      );
      return;
    }

    const weekLeaves: any[] = [];
    try {
      const weekLeavesData: any[] = await apiClient.get('/leave-requests/scope', {
        status: 'approved,pending',
        user_ids: memberIds.join(','),
        start_date: rangeStart,
        end_date: rangeEnd,
      });
      weekLeaves.push(...(weekLeavesData ?? []));
    } catch (err) {
      console.error('Error fetching week leaves:', err);
    }

    const availability: WeekDayAvailability[] = weekDays.map((d) => {
      const dateStr = toLocalDate(d);
      const onLeave = weekLeaves.filter((l: any) => {
        const lStart = (l.start_date || '').split('T')[0];
        const lEnd = (l.end_date || '').split('T')[0];
        return lStart <= dateStr && lEnd >= dateStr;
      });
      const names = onLeave.map((l: any) => {
        const name = l.user_id?.full_name ?? (l.user as any)?.full_name ?? 'Unknown';
        const leaveType = l.leave_type_id?.name ?? (l.leave_type as any)?.name;
        return leaveType ? `${name} (${leaveType})` : name;
      });
      const holiday = holidays.find((h) => {
        const hStart = (h.holiday_date || '').split('T')[0];
        const hEnd = (h.holiday_end_date || h.holiday_date || '').split('T')[0];
        return dateStr >= hStart && dateStr <= hEnd;
      });
      return {
        date: d,
        label: d.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' }),
        dayName: DAY_NAMES[d.getDay()],
        onLeaveCount: onLeave.length,
        memberNames: names,
        isHoliday: !!holiday,
        holidayName: holiday?.name || '',
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

  const todayDate = new Date();
  const todayStr = `${todayDate.getFullYear()}-${(todayDate.getMonth() + 1).toString().padStart(2, '0')}-${todayDate.getDate().toString().padStart(2, '0')}`;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600 }}>
          {langPackLabel("txtDashboard") || "Manager Dashboard"}
        </Typography>
        <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={fetchDashboardData}>{langPackLabel("txtRefresh") || "Refresh"}</Button>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        {/* Total Team Members */}
        <Card sx={{ flex: '1 1 140px', minWidth: 140 }}>
          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <People color="primary" sx={{ mr: 0.5, fontSize: 20 }} />
              <Typography variant="body2" fontWeight={600}>{langPackLabel("txtTeamMembers") || "Team Members"}</Typography>
            </Box>
            <Typography variant="h5" color="primary" fontWeight={700}>
              {stats.totalMembers}
            </Typography>
          </CardContent>
        </Card>

        {/* On Leave Today */}
        <Card sx={{ flex: '1 1 140px', minWidth: 140 }}>
          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <BeachAccess sx={{ mr: 0.5, color: 'warning.main', fontSize: 20 }} />
              <Typography variant="body2" fontWeight={600}>{langPackLabel("txtOnLeaveToday") || "On Leave Today"}</Typography>
            </Box>
            <Typography variant="h5" sx={{ color: 'warning.main' }} fontWeight={700}>
              {stats.onLeaveToday}
            </Typography>
          </CardContent>
        </Card>

        {/* Pending Approvals — Clickable */}
        <Card sx={{ flex: '1 1 140px', minWidth: 140 }}>
          <CardActionArea onClick={() => navigate('/manager/approvals')}>
            <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PendingActions sx={{ mr: 0.5, color: 'error.main', fontSize: 20 }} />
                <Typography variant="body2" fontWeight={600}>{langPackLabel("txtPendingApprovals") || "Pending Approvals"}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="h5" sx={{ color: 'error.main' }} fontWeight={700}>
                  {stats.pendingApprovals}
                </Typography>
                <ArrowForward color="action" sx={{ fontSize: 18 }} />
              </Box>
            </CardContent>
          </CardActionArea>
        </Card>

        {/* Upcoming Leaves */}
        <Card sx={{ flex: '1 1 140px', minWidth: 140 }}>
          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <EventNote sx={{ mr: 0.5, color: 'info.main', fontSize: 20 }} />
              <Typography variant="body2" fontWeight={600}>{langPackLabel("txtUpcomingLeaves") || "Upcoming Leaves"}</Typography>
            </Box>
            <Typography variant="h5" sx={{ color: 'info.main' }} fontWeight={700}>
              {stats.upcomingLeaves}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {langPackLabel("txtNext30Days") || "Next 30 days"}
            </Typography>
          </CardContent>
        </Card>

        {/* My Upcoming Leaves */}
        <Card sx={{ flex: '1 1 140px', minWidth: 140 }}>
          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <BeachAccess sx={{ mr: 0.5, color: 'success.main', fontSize: 20 }} />
              <Typography variant="body2" fontWeight={600}>{langPackLabel("txtMyLeaves") || "My Leaves"}</Typography>
            </Box>
            <Typography variant="h5" sx={{ color: 'success.main' }} fontWeight={700}>
              {myUpcomingLeaves.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {myUpcomingLeaves.length > 0
                ? `${langPackLabel("txtNext") || "Next"}: ${formatLocalDate(myUpcomingLeaves[0].start_date, language)}`
                : langPackLabel("txtNoUpcomingLeaves") || "No upcoming leaves"}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Personal Leave Balances */}
      {personalBalances.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            {langPackLabel("txtMyLeaveBalances") || "My Leave Balances"}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            {personalBalances.filter((b) => {
              const name = b.leave_type_name.toLowerCase();
              return name.includes('annual') || name.includes('casual') || name.includes('sick') || b.used > 0;
            }).map((balance) => (
              <Card
                key={balance.leave_type_id}
                sx={{ flex: '1 1 140px', minWidth: 140, borderTop: 3, borderColor: balance.color_code }}
              >
                <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {localizedBalanceName(balance, language)}
                  </Typography>
                  <Typography variant="h5" sx={{ color: balance.remaining < 0 ? 'error.main' : balance.color_code }} fontWeight={700}>
                    {balance.remaining}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{langPackLabel("txtRemaining") || "remaining"}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
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

      {/* Team Availability — 4 Weeks */}
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
        {langPackLabel("txtTeamAvailability") || "Team Availability — Next 4 Weeks"}
      </Typography>
      <Paper sx={{ mb: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: 60 }}>{langPackLabel("txtWeek") || "Week"}</TableCell>
                {[...workdayConfig].sort((a, b) => a - b).map((dayIdx) => (
                  <TableCell key={dayIdx} align="center" sx={{ fontWeight: 600 }}>
                    {DAY_NAMES[dayIdx]}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {[0, 1, 2, 3].map((weekIdx) => {
                const workdayCount = [...workdayConfig].length;
                const weekDays = weekAvailability.slice(weekIdx * workdayCount, weekIdx * workdayCount + workdayCount);
                if (weekDays.length === 0) return null;
                const weekLabel = weekDays[0]?.label;
                return (
                  <TableRow key={weekIdx}>
                    <TableCell>
                      <Typography variant="caption" fontWeight={600}>{weekLabel}</Typography>
                    </TableCell>
                    {weekDays.map((day) => {
                      const pad2 = (n: number) => n.toString().padStart(2, '0');
                      const cellDateStr = `${day.date.getFullYear()}-${pad2(day.date.getMonth() + 1)}-${pad2(day.date.getDate())}`;
                      const isToday = cellDateStr === todayStr;
                      return (
                      <TableCell
                        key={day.label}
                        align="center"
                        sx={{
                          bgcolor: day.isHoliday ? 'error.light' : isToday ? 'primary.light' : 'transparent',
                          verticalAlign: 'top',
                        }}
                      >
                        <Typography variant="caption" display="block" color="text.secondary">
                          {day.label}
                        </Typography>
                        {day.isHoliday ? (
                          <Typography variant="caption" display="block" color="error.dark" fontWeight={600}>
                            {day.holidayName}
                          </Typography>
                        ) : day.onLeaveCount === 0 ? (
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
                      );
                    })}
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

export default ManagerDashboard;
