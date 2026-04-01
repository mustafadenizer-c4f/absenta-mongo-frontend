// src/components/staff/Dashboard.tsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  List,
  ListItem,
  ListItemText,
  Tooltip,
} from '@mui/material';
import {
  Add,
  CalendarMonth,
  EventNote,
  InfoOutlined,
  WarningAmber,
} from '@mui/icons-material';
import { RootState, AppDispatch } from '../../store';
import {
  fetchLeaveBalances,
  fetchLeaveRequests,
  fetchHolidays,
} from '../../store/slices/leaveSlice';
import { EnhancedLeaveBalanceSummary, LeaveRequest, Holiday } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { localizedLeaveTypeName, localizedBalanceName, localizedStatus, formatLocalDate } from '../../utils/localize';

const statusColorMap: Record<LeaveRequest['status'], 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
};

const tierLabelMap: Record<string, string> = {
  tier1: 'Tier 1',
  tier2: 'Tier 2',
  tier3: 'Tier 3',
};

const StaffDashboard: React.FC = () => {
  const { langPackLabel, language } = useLanguage();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { balances, requests, holidays, loading, error } = useSelector(
    (state: RootState) => state.leave
  );

  useEffect(() => {
    if (user) {
      dispatch(fetchLeaveBalances({ userId: user.id, hireDate: user.hire_date, birthDate: user.birth_date || '', companyId: user.company_id }));
      dispatch(fetchLeaveRequests(user.id));
      dispatch(fetchHolidays(user.company_id));
    }
  }, [dispatch, user]);

  const recentRequests = [...requests]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const upcomingHolidays = holidays
    .filter((h) => new Date(h.holiday_date) >= new Date())
    .sort((a, b) => new Date(a.holiday_date).getTime() - new Date(b.holiday_date).getTime());

  if (loading && balances.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600 }}>
          {langPackLabel("txtDashboard") || "My Dashboard"}
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<Add />}
          onClick={() => navigate('/staff/request')}
        >{langPackLabel("txtRequestLeave") || "Request Leave"}</Button>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                if (user) {
                  dispatch(fetchLeaveBalances({ userId: user.id, hireDate: user.hire_date, birthDate: user.birth_date || '', companyId: user.company_id }));
                  dispatch(fetchLeaveRequests(user.id));
                  dispatch(fetchHolidays(user.company_id));
                }
              }}
            >
              {langPackLabel("txtRetry") || "Retry"}
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Leave Balance Cards */}
      <Typography variant="subtitle1" sx={{ mb: 0.5, fontWeight: 600 }}>
        {langPackLabel("txtMyLeaveBalances") || "Leave Balances"}
      </Typography>
      {balances.length > 0 && balances[0].period_start && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
          {langPackLabel("txtPeriod") || "Period"}: {formatLocalDate(balances[0].period_start, language)} — {formatLocalDate(balances[0].period_end, language)}
        </Typography>
      )}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        {balances.filter((b: EnhancedLeaveBalanceSummary) => {
          const name = b.leave_type_name.toLowerCase();
          return name.includes('annual') || name.includes('casual') || name.includes('sick') || b.used > 0;
        }).map((balance: EnhancedLeaveBalanceSummary) => (
          <Card
            key={balance.leave_type_id}
            sx={{
              flex: '1 1 160px',
              minWidth: 160,
              borderTop: 3,
              borderColor: balance.color_code,
            }}
          >
            <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {localizedBalanceName(balance, language)}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  {balance.is_age_eligible && (
                    <Tooltip title="Age-based minimum entitlement applies (≤18 or ≥50)">
                      <InfoOutlined fontSize="small" color="info" />
                    </Tooltip>
                  )}
                </Box>
              </Box>
              <Typography
                variant="h5"
                sx={{ color: balance.remaining < 0 ? 'error.main' : balance.color_code }}
                fontWeight={700}
              >
                {balance.remaining}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {langPackLabel("txtRemaining") || "remaining"}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="caption" color="text.secondary">
                  {langPackLabel("txtAllocated") || "Allocated"}: {balance.allocated}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {langPackLabel("txtUsed") || "Used"}: {balance.used}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {langPackLabel("txtPendingLabel") || "Pending"}: {balance.pending}
                </Typography>
              </Box>
              {/* Enhanced balance details */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                {balance.base_entitlement != null && (
                  <Typography variant="caption" color="text.secondary">
                    {langPackLabel("txtBase") || "Base"}: {balance.base_entitlement}
                  </Typography>
                )}
                {balance.carried_over > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {langPackLabel("txtCarryover") || "Carryover"}: {balance.carried_over}
                  </Typography>
                )}
                {balance.negative_from_previous > 0 && (
                  <Typography variant="caption" sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <WarningAmber sx={{ fontSize: 14 }} />
                    {langPackLabel("txtDeficit") || "Deficit"}: -{balance.negative_from_previous}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
        {balances.length === 0 && !loading && (
          <Typography variant="body2" color="text.secondary">
            {langPackLabel("txtNoLeaveBalances") || "No leave balances available."}
          </Typography>
        )}
      </Box>

      {/* Recent Leave Requests */}
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
        <EventNote color="primary" sx={{ fontSize: 20 }} /> {langPackLabel("txtRecentRequests") || "Recent Requests"}
      </Typography>
      <Paper sx={{ mb: 3 }}>
        {recentRequests.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{langPackLabel("txtType") || "Type"}</TableCell>
                  <TableCell>{langPackLabel("txtDates") || "Dates"}</TableCell>
                  <TableCell>{langPackLabel("txtDays") || "Days"}</TableCell>
                  <TableCell>{langPackLabel("txtStatus") || "Status"}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentRequests.map((req: LeaveRequest) => (
                  <TableRow key={req.id} hover>
                    <TableCell>{localizedLeaveTypeName(req.leave_type, language)}</TableCell>
                    <TableCell>
                      {formatLocalDate(req.start_date, language)} –{' '}
                      {formatLocalDate(req.end_date, language)}
                    </TableCell>
                    <TableCell>{req.total_days}</TableCell>
                    <TableCell>
                      <Chip
                        label={localizedStatus(req.status, langPackLabel)}
                        color={statusColorMap[req.status]}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {langPackLabel("txtNoLeaveRequestsFound") || "No leave requests yet."}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Upcoming Holidays */}
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CalendarMonth color="primary" sx={{ fontSize: 20 }} /> {langPackLabel("txtUpcomingHolidays") || "Upcoming Holidays"}
      </Typography>
      <Paper sx={{ mb: 3 }}>
        {upcomingHolidays.length > 0 ? (
          <List disablePadding>
            {upcomingHolidays.map((holiday: Holiday) => (
              <ListItem key={holiday.id} divider>
                <ListItemText
                  primary={holiday.name}
                  secondary={new Date(holiday.holiday_date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {langPackLabel("txtNoUpcomingHolidays") || "No upcoming holidays."}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default StaffDashboard;
