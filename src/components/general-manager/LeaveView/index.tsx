// src/components/general-manager/LeaveView/index.tsx — Department Manager Leave View
import React, { useEffect, useState, useCallback } from 'react';
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
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import { useAuth } from '../../../hooks/useAuth';
import { apiClient } from '../../../config/api';
import { LeaveRequest, Team } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { localizedStatus } from '../../../utils/localize';

const statusColor: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
};

const DepartmentManagerLeaveView: React.FC = () => {
  const { langPackLabel } = useLanguage();
  const { user: currentUser } = useAuth();

  const [teams, setTeams] = useState<Team[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useAutoClearing(7000);

  // Filters
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Load teams for the department manager's department
  useEffect(() => {
    if (!currentUser?.department_id) return;
    const loadTeams = async () => {
      try {
        const data: Team[] = await apiClient.get('/teams', { department_id: currentUser.department_id! });
        setTeams(data ?? []);
      } catch (err) {
        console.error('Failed to load teams:', err);
      }
    };
    loadTeams();
  }, [currentUser?.department_id]);

  // Fetch leave requests scoped to department
  const fetchRequests = useCallback(async () => {
    if (!currentUser?.department_id) return;
    setLoading(true);
    setError(null);
    try {
      // Get users in this department, optionally filtered by team
      let userParams: Record<string, any> = { department_id: currentUser.department_id! };
      if (teamFilter) {
        userParams.team_id = teamFilter;
      }

      const deptUsers: { id: string }[] = await apiClient.get('/users', { ...userParams, select: 'id' });

      const userIds = (deptUsers ?? []).map((u) => u.id);
      if (userIds.length === 0) {
        setRequests([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const params: Record<string, any> = {
        user_ids: userIds.join(','),
      };
      if (statusFilter) {
        params.status = statusFilter;
      }

      const data: LeaveRequest[] = await apiClient.get('/leave-requests/scope', params);

      // Client-side pagination
      const allRequests = (data ?? []) as LeaveRequest[];
      setTotalCount(allRequests.length);
      const paged = allRequests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
      setRequests(paged);
    } catch (err: any) {
      setError(err.message || langPackLabel("txtFailedToLoad") || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  }, [currentUser, page, rowsPerPage, teamFilter, statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleTeamChange = (e: SelectChangeEvent) => {
    setTeamFilter(e.target.value);
    setPage(0);
  };

  const handleStatusChange = (e: SelectChangeEvent) => {
    setStatusFilter(e.target.value);
    setPage(0);
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const teamMap = new Map(teams.map((t) => [t.id, t.name]));

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, color: 'primary.main', fontWeight: 600 }}>
        Leave Requests
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>{langPackLabel("txtTeam") || "Team"}</InputLabel>
            <Select value={teamFilter} label={langPackLabel("txtTeam") || "Team"} onChange={handleTeamChange}>
              <MenuItem value="">{langPackLabel("txtAllTeams") || "All Teams"}</MenuItem>
              {teams.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{langPackLabel("txtStatus") || "Status"}</InputLabel>
            <Select value={statusFilter} label={langPackLabel("txtStatus") || "Status"} onChange={handleStatusChange}>
              <MenuItem value="">{langPackLabel("txtAll") || "All"}</MenuItem>
              <MenuItem value="pending">{langPackLabel("txtPending") || "Pending"}</MenuItem>
              <MenuItem value="approved">{langPackLabel("txtApproved") || "Approved"}</MenuItem>
              <MenuItem value="rejected">{langPackLabel("txtRejected") || "Rejected"}</MenuItem>
              <MenuItem value="cancelled">{langPackLabel("txtCancelled") || "Cancelled"}</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : requests.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No leave requests found.
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{langPackLabel("txtEmployee") || "Employee"}</TableCell>
                    <TableCell>{langPackLabel("txtTeam") || "Team"}</TableCell>
                    <TableCell>{langPackLabel("txtLeaveType") || "Leave Type"}</TableCell>
                    <TableCell>{langPackLabel("txtDates") || "Dates"}</TableCell>
                    <TableCell>{langPackLabel("txtDays") || "Days"}</TableCell>
                    <TableCell>{langPackLabel("txtStatus") || "Status"}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id} hover>
                      <TableCell>{req.user?.full_name ?? 'Unknown'}</TableCell>
                      <TableCell>
                        {req.user?.team_id ? teamMap.get(req.user.team_id) ?? '—' : '—'}
                      </TableCell>
                      <TableCell>
                        {req.leave_type ? (
                          <Chip
                            label={req.leave_type.name}
                            size="small"
                            sx={{ backgroundColor: req.leave_type.color_code, color: '#fff' }}
                          />
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {new Date(req.start_date).toLocaleDateString()} –{' '}
                        {new Date(req.end_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{req.total_days}</TableCell>
                      <TableCell>
                        <Chip
                          label={localizedStatus(req.status, langPackLabel)}
                          size="small"
                          color={statusColor[req.status] ?? 'default'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handlePageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default DepartmentManagerLeaveView;
