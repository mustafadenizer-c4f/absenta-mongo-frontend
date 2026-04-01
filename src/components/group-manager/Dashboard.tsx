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
import { HolidaysService } from '../../services/holidays';
import { EnhancedLeaveBalanceSummary, Holiday } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { localizedBalanceName } from '../../utils/localize';
import { getDayNames } from '../../utils/calendarLocalizer';

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
  isHoliday: boolean;
  holidayName: string;
}

const GroupManagerDashboard: React.FC = () => {
  const { langPackLabel, language } = useLanguage();
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

    const weekDays: Date[] = [];
    for (let week = 0; week < 4; week++) {
      for (let day = 0; day < 5; day++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + week * 7 + day);
        weekDays.push(d);
      }
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    const toLocalDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const dateLocale = language === 'tr' ? 'tr-TR' : 'en-US';
    const rangeStart = toLocalDate(weekDays[0]);
    const rangeEnd = toLocalDate(weekDays[weekDays.length - 1]);

    // Fetch holidays
    let holidays: Holiday[] = [];
    try {
      if (currentUser?.company_id) {
        holidays = await HolidaysService.getAll(currentUser.company_id) || [];
      }
    } catch { /* skip */ }

    const memberIds = groupMembers.map((m) => m.id);
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
            dayName: d.toLocaleDateString(dateLocale, { weekday: 'short' }),
            onLeaveCount: 0,
            memberNames: [],
            isHoliday: !!holiday,
            holidayName: holiday?.name || '',
          };
        })
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

    const dayNames = getDayNames(language);
    const availability: WeekDayAvailability[] = weekDays.map((d) => {
      const dateStr = toLocalDate(d);
      const onLeave = (weekLeavesData ?? []).filter((l: any) => {
        const lStart = (l.start_date || '').split('T')[0];
        const lEnd = (l.end_date || '').split('T')[0];
        return lStart <= dateStr && lEnd >= dateStr;
      });
      const names = onLeave.map((l: any) => l.user_id?.full_name ?? (l.user as any)?.full_name ?? 'Unknown');
      const holiday = holidays.find((h) => {
        const hStart = (h.holiday_date || '').split('T')[0];
        const hEnd = (h.holiday_end_date || h.holiday_date || '').split('T')[0];
        return dateStr >= hStart && dateStr <= hEnd;
      });
      return {
        date: d,
        label: d.toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' }),
        dayName: dayNames[d.getDay()],
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

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600 }}>
          {langPackLabel("txtDashboard") || "Group Manager Dashboard"}
        </Typography>
        <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={fetchDashboardData}>{langPackLabel("txtRefresh") || "Refresh"}</Button>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        {/* Team Size */}
        <Card sx={{ flex: '1 1 140px', minWidth: 140 }}>
          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <People color="primary" sx={{ mr: 0.5, fontSize: 20 }} />
              <Typography variant="body2" fontWeight={600}>{langPackLabel("txtTeamSize") || "Team Size"}</Typography>
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
          <CardActionArea onClick={() => navigate('/group-manager/approvals')}>
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

      {/* Group Availability — 4 Weeks */}
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
        {langPackLabel("txtGroupAvailability") || "Group Availability — Next 4 Weeks"}
      </Typography>
      <Paper sx={{ mb: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, width: 60 }}>{langPackLabel("txtWeek") || "Week"}</TableCell>
                {getDayNames(language).slice(1, 6).map((day) => (
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

export default GroupManagerDashboard;
