// src/components/group-manager/Balances/index.tsx — Group-scoped balances (batched queries)
import React, { useEffect, useState } from 'react';
import { useAutoClearing } from '../../../hooks/useAutoClearing';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Popover,
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { apiClient } from '../../../config/api';
import { BalanceService } from '../../../services/balance';
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../contexts/LanguageContext';

interface LeaveTypeInfo {
  id: string;
  name: string;
  color_code: string;
  default_days: number;
}

interface RequestDetail {
  start_date: string;
  total_days: number;
  status: string;
}

interface CellData {
  allocated: number;
  used: number;
  pending: number;
  remaining: number;
  usedDetails: RequestDetail[];
  pendingDetails: RequestDetail[];
}

interface StaffRow {
  userId: string;
  fullName: string;
  periodLabel: string;
  cells: CellData[];
}

const GroupBalances: React.FC = () => {
  const { langPackLabel } = useLanguage();
  const { user } = useAuth();
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useAutoClearing(7000);
  const [popover, setPopover] = useState<{ anchor: HTMLElement; details: RequestDetail[] } | null>(null);

  const formatDate = (d: string) => new Date(d).toLocaleDateString();

  useEffect(() => {
    if (user?.group_id) fetchData();
  }, [user?.group_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const types: LeaveTypeInfo[] = await apiClient.get('/leave-types');
      setLeaveTypes(types || []);

      const staff: { id: string; full_name: string; hire_date: string }[] = await apiClient.get('/users', {
        group_id: user!.group_id!,
      });
      if (!staff || staff.length === 0) { setRows([]); setLoading(false); return; }

      const memberIds = staff.map((s) => s.id);

      const staffPeriods = staff.map((s) => {
        const period = BalanceService.getCurrentPeriod(s.hire_date);
        return { ...s, period };
      });
      const minStart = staffPeriods.reduce((min, sp) => sp.period.start < min ? sp.period.start : min, staffPeriods[0].period.start);
      const maxEnd = staffPeriods.reduce((max, sp) => sp.period.end > max ? sp.period.end : max, staffPeriods[0].period.end);

      const [allApproved, allPending] = await Promise.all([
        apiClient.get('/leave-requests/scope', { user_ids: memberIds.join(','), status: 'approved', start_date: minStart, end_date: maxEnd }),
        apiClient.get('/leave-requests/scope', { user_ids: memberIds.join(','), status: 'pending', start_date: minStart, end_date: maxEnd }),
      ]);

      const result: StaffRow[] = staff.map((s) => {
        const period = BalanceService.getCurrentPeriod(s.hire_date);
        const { start: ps, end: pe } = period;
        const ua = (allApproved || []).filter((r: any) => (r.user_id === s.id || r.user_id?._id === s.id) && r.start_date >= ps && r.start_date <= pe);
        const up = (allPending || []).filter((r: any) => (r.user_id === s.id || r.user_id?._id === s.id) && r.start_date >= ps && r.start_date <= pe);

        const cells: CellData[] = (types || []).map((lt) => {
          const allocated = lt.default_days;
          const usedReqs = ua.filter((r: any) => (r.leave_type_id === lt.id || r.leave_type_id?._id === lt.id));
          const pendReqs = up.filter((r: any) => (r.leave_type_id === lt.id || r.leave_type_id?._id === lt.id));
          const used = usedReqs.reduce((sum: number, r: any) => sum + r.total_days, 0);
          const pending = pendReqs.reduce((sum: number, r: any) => sum + r.total_days, 0);
          return {
            allocated, used, pending, remaining: allocated - used - pending,
            usedDetails: usedReqs.map((r: any) => ({ start_date: r.start_date, total_days: r.total_days, status: 'approved' })),
            pendingDetails: pendReqs.map((r: any) => ({ start_date: r.start_date, total_days: r.total_days, status: 'pending' })),
          };
        });
        return { userId: s.id, fullName: s.full_name, periodLabel: `${formatDate(ps)} — ${formatDate(pe)}`, cells };
      });
      setRows(result);

      const visibleIdx = (types || []).map((lt, idx) => {
        const name = lt.name.toLowerCase();
        if (name.includes('annual') || name.includes('casual') || name.includes('sick')) return true;
        return result.some((r) => r.cells[idx].used > 0);
      });
      setLeaveTypes(types.filter((_, idx) => visibleIdx[idx]));
      setRows(result.map((r) => ({ ...r, cells: r.cells.filter((_, idx) => visibleIdx[idx]) })));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (e: React.MouseEvent<HTMLElement>, details: RequestDetail[]) => {
    if (details.length > 0) setPopover({ anchor: e.currentTarget, details });
  };

  if (loading) {
    return (<Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>);
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 600 }}>{langPackLabel("txtGroupLeaveBalances") || "Group Leave Balances"}</Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchData}>{langPackLabel("txtRefresh") || "Refresh"}</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
      {rows.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">{langPackLabel("txtNoGroupMembersFound") || "No group members found."}</Typography></Paper>
      ) : (
        <Paper>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>{langPackLabel("txtEmployee") || "Employee"}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{langPackLabel("txtPeriod") || "Period"}</TableCell>
                  {leaveTypes.map((lt) => (
                    <TableCell key={lt.id} align="center" sx={{ fontWeight: 600 }}>
                      <Chip label={lt.name} size="small" sx={{ bgcolor: lt.color_code, color: '#fff', fontWeight: 600 }} />
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.userId} hover>
                    <TableCell><Typography fontWeight="medium">{row.fullName}</Typography></TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{row.periodLabel}</Typography></TableCell>
                    {row.cells.map((c, idx) => (
                      <TableCell
                        key={idx}
                        align="center"
                        sx={{ cursor: (c.usedDetails.length + c.pendingDetails.length) > 0 ? 'pointer' : 'default' }}
                        onClick={(e) => handleCellClick(e, [...c.usedDetails, ...c.pendingDetails])}
                      >
                        <Typography variant="body2" fontWeight="bold" color={c.remaining < 0 ? 'error.main' : 'text.primary'}>{c.remaining}</Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {c.allocated} {langPackLabel("txtAllocated") || "alloc"} · {c.used} {langPackLabel("txtUsed") || "used"} · {c.pending} {langPackLabel("txtPendingLabel") || "pend"}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Popover
        open={Boolean(popover)}
        anchorEl={popover?.anchor}
        onClose={() => setPopover(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        {popover && (
          <Box sx={{ p: 2, minWidth: 220 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>{langPackLabel("txtRequestDetails") || "Request Details"}</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ py: 0.5, fontWeight: 600 }}>{langPackLabel("txtStartDate") || "Start Date"}</TableCell>
                  <TableCell sx={{ py: 0.5, fontWeight: 600 }} align="right">{langPackLabel("txtDays") || "Days"}</TableCell>
                  <TableCell sx={{ py: 0.5, fontWeight: 600 }}>{langPackLabel("txtStatus") || "Status"}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {popover.details.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell sx={{ py: 0.5 }}>{formatDate(d.start_date)}</TableCell>
                    <TableCell sx={{ py: 0.5 }} align="right">{d.total_days}</TableCell>
                    <TableCell sx={{ py: 0.5 }}>
                      <Chip label={d.status} size="small" color={d.status === 'approved' ? 'success' : 'warning'} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Popover>
    </Box>
  );
};

export default GroupBalances;
