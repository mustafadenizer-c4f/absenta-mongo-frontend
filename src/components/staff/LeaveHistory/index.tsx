// src/components/staff/LeaveHistory/index.tsx
import React, { useEffect, useState, useCallback } from 'react';
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
  TableSortLabel,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { Cancel as CancelIcon, FilterList as FilterListIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { cancelLeaveRequest, fetchHolidays } from '../../../store/slices/leaveSlice';
import { LeaveService, LeaveRequestFilters } from '../../../services/leave';
import { apiClient } from '../../../config/api';
import { LeaveRequest, LeaveType } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { localizedLeaveTypeName, localizedStatus, formatLocalDate } from '../../../utils/localize';
import LocalizedDatePicker from '../../common/LocalizedDatePicker';

const statusColorMap: Record<LeaveRequest['status'], 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
};

type SortField = 'date' | 'status';
type SortDirection = 'asc' | 'desc';

const MANAGER_ROLES = ['manager', 'group_manager', 'department_manager'];

const LeaveHistory: React.FC = () => {
  const { langPackLabel, language } = useLanguage();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const isManager = user ? MANAGER_ROLES.includes(user.role) : false;

  // Data state
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ id: string; full_name: string; team_id?: string }[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Cancel dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<LeaveRequest | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LeaveRequest | null>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editing, setEditing] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LeaveRequest | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // Fetch leave types and team members on mount
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const data: LeaveType[] = await apiClient.get('/leave-types');
        setLeaveTypes((data || []).filter((lt: LeaveType) => lt.is_active));
      } catch (err) {
        console.error('Failed to fetch leave types:', err);
      }
    };
    const fetchTeam = async () => {
      if (!user || !isManager) return;
      try {
        let params: Record<string, any> = {};
        if (user.role === 'department_manager' && user.department_id) {
          params.department_id = user.department_id;
          // Also fetch teams for this department
          const teamData: { id: string; name: string }[] = await apiClient.get('/teams', {
            department_id: user.department_id,
          });
          setTeams(teamData || []);
        } else if (user.role === 'group_manager' && user.group_id) {
          params.group_id = user.group_id;
        } else {
          params.manager_id = user.id;
        }
        const data: { id: string; full_name: string; team_id?: string }[] = await apiClient.get('/users', params);
        setTeamMembers((data || []).filter((u) => u.id !== user.id));
      } catch (err) {
        console.error('Failed to fetch team:', err);
      }
    };
    fetchLeaveTypes();
    fetchTeam();
    dispatch(fetchHolidays(user?.company_id));
  }, [dispatch, user?.company_id, user?.id, isManager]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch leave requests
  const fetchRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const filters: LeaveRequestFilters = { page, pageSize: rowsPerPage };
      if (statusFilter) filters.status = statusFilter;
      if (leaveTypeFilter) filters.leaveTypeId = leaveTypeFilter;
      if (startDateFilter) filters.startDate = startDateFilter;
      if (endDateFilter) filters.endDate = endDateFilter;

      let result: { data: LeaveRequest[]; count: number };

      if (isManager && teamMembers.length > 0) {
        // Determine which team members to include based on team filter
        const filteredMembers = teamFilter
          ? teamMembers.filter((m) => m.team_id === teamFilter)
          : teamMembers;

        // Determine user IDs to query
        let queryUserIds: string[];
        if (userFilter === 'team_only') {
          // "Only Team" — team members only, exclude manager
          queryUserIds = filteredMembers.map((m) => m.id);
        } else if (userFilter && userFilter !== user.id) {
          // Specific team member selected
          queryUserIds = [userFilter];
        } else if (userFilter === user.id) {
          // "Me" selected — only manager's own
          queryUserIds = [user.id];
        } else if (teamFilter) {
          // Team selected, no employee filter — show only that team's members (not me)
          queryUserIds = filteredMembers.map((m) => m.id);
        } else {
          // Default (no team, no employee filter): me + all team
          queryUserIds = [user.id, ...filteredMembers.map((m) => m.id)];
        }

        if (queryUserIds.length === 0) {
          result = { data: [], count: 0 };
        } else if (queryUserIds.length === 1 && queryUserIds[0] === user.id) {
          // Only the manager's own requests — use /my
          result = await LeaveService.getRequestsByUser(user.id, filters);
        } else {
          // Team member(s) — use /scope with user_ids
          result = await LeaveService.getRequestsByUsers(queryUserIds, filters);
        }
      } else {
        result = await LeaveService.getRequestsByUser(user.id, filters);
      }

      let data = result.data as LeaveRequest[];
      data = [...data].sort((a, b) => {
        if (sortField === 'date') {
          return sortDirection === 'asc'
            ? new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
            : new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        }
        return sortDirection === 'asc' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
      });

      setRequests(data);
      setTotalCount(result.count);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || (langPackLabel("txtFailedToLoadHistory") || 'Failed to load leave history'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [user, isManager, teamMembers, page, rowsPerPage, statusFilter, leaveTypeFilter, startDateFilter, endDateFilter, userFilter, teamFilter, sortField, sortDirection]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handlePageChange = (_: unknown, newPage: number) => setPage(newPage);
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };
  const handleSortChange = (field: SortField) => {
    if (sortField === field) setSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDirection('asc'); }
  };
  const handleClearFilters = () => { setStatusFilter(''); setLeaveTypeFilter(''); setStartDateFilter(''); setEndDateFilter(''); setUserFilter(''); setTeamFilter(''); setPage(0); };
  const handleCancelClick = (request: LeaveRequest) => { setCancelTarget(request); setCancelDialogOpen(true); };
  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await dispatch(cancelLeaveRequest(cancelTarget.id)).unwrap();
      setSnackbar({ open: true, message: langPackLabel("txtRequestCancelledSuccess") || 'Leave request cancelled successfully.', severity: 'success' });
      setCancelDialogOpen(false); setCancelTarget(null); fetchRequests();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || (langPackLabel("txtFailedToCancelRequest") || 'Failed to cancel request'), severity: 'error' });
    } finally { setCancelling(false); }
  };
  const handleCancelDialogClose = () => { if (!cancelling) { setCancelDialogOpen(false); setCancelTarget(null); } };

  // Edit handlers
  const handleEditClick = (request: LeaveRequest) => {
    setEditTarget(request);
    setEditStartDate(request.start_date.split('T')[0]);
    setEditEndDate(request.end_date.split('T')[0]);
    setEditReason(request.reason || '');
    setEditDialogOpen(true);
  };
  const handleEditConfirm = async () => {
    if (!editTarget) return;
    setEditing(true);
    try {
      await LeaveService.editRequest(editTarget.id, {
        start_date: editStartDate,
        end_date: editEndDate,
        reason: editReason,
      });
      setSnackbar({ open: true, message: langPackLabel("txtRequestUpdatedReapproval") || 'Request updated and sent for re-approval.', severity: 'success' });
      setEditDialogOpen(false); setEditTarget(null); fetchRequests();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || (langPackLabel("txtFailedToUpdateRequest") || 'Failed to update request'), severity: 'error' });
    } finally { setEditing(false); }
  };
  const handleEditDialogClose = () => { if (!editing) { setEditDialogOpen(false); setEditTarget(null); } };

  // Delete handlers
  const handleDeleteClick = (request: LeaveRequest) => { setDeleteTarget(request); setDeleteDialogOpen(true); };
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await LeaveService.deleteRequest(deleteTarget.id);
      setSnackbar({ open: true, message: langPackLabel("txtRequestDeleted") || 'Leave request deleted.', severity: 'success' });
      setDeleteDialogOpen(false); setDeleteTarget(null); fetchRequests();
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || (langPackLabel("txtFailedToDeleteRequest") || 'Failed to delete request'), severity: 'error' });
    } finally { setDeleting(false); }
  };
  const handleDeleteDialogClose = () => { if (!deleting) { setDeleteDialogOpen(false); setDeleteTarget(null); } };
  const isTeamView = isManager && !!teamFilter;
  const hasActiveFilters = statusFilter || leaveTypeFilter || startDateFilter || endDateFilter || userFilter || teamFilter;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, color: 'primary.main', fontWeight: 600 }}>
        {isTeamView && userFilter !== user?.id ? (langPackLabel("txtTeamLeaveHistory") || 'Team Leave History') : (langPackLabel("txtLeaveHistory") || 'Leave History')}
      </Typography>

      {/* Filter Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterListIcon color="action" />
          <Typography variant="subtitle1" fontWeight={600}>{langPackLabel("txtFilters") || "Filters"}</Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
          {isManager && teams.length > 0 && (
            <TextField
              select
              label={langPackLabel("txtTeam") || "Team"}
              value={teamFilter}
              onChange={(e) => { setTeamFilter(e.target.value); setUserFilter(''); setPage(0); }}
              size="small"
              sx={{ minWidth: 130 }}
            >
              <MenuItem value="">{langPackLabel("txtAllTeams") || "All Teams"}</MenuItem>
              {teams.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </TextField>
          )}
          {isManager && teamMembers.length > 0 && (
            <TextField
              select
              label={langPackLabel("txtEmployee") || "Employee"}
              value={userFilter}
              onChange={(e) => { setUserFilter(e.target.value); setPage(0); }}
              size="small"
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">{langPackLabel("txtAllMeTeam") || "All (Me + Team)"}</MenuItem>
              <MenuItem value={user!.id}>{langPackLabel("txtMe") || "Me"} ({user!.full_name})</MenuItem>
              <MenuItem value="team_only">{langPackLabel("txtOnlyTeam") || "Only Team"}</MenuItem>
              {(teamFilter ? teamMembers.filter((m) => m.team_id === teamFilter) : teamMembers).map((m) => (
                <MenuItem key={m.id} value={m.id}>{m.full_name}</MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            select label={langPackLabel("txtStatus") || "Status"} value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            size="small" sx={{ minWidth: 110 }}
          >
            <MenuItem value="">{langPackLabel("txtAll") || "All"}</MenuItem>
            <MenuItem value="pending">{langPackLabel("txtPending") || "Pending"}</MenuItem>
            <MenuItem value="approved">{langPackLabel("txtApproved") || "Approved"}</MenuItem>
            <MenuItem value="rejected">{langPackLabel("txtRejected") || "Rejected"}</MenuItem>
            <MenuItem value="cancelled">{langPackLabel("txtCancelled") || "Cancelled"}</MenuItem>
          </TextField>
          <TextField
            select label={langPackLabel("txtLeaveType") || "Leave Type"} value={leaveTypeFilter}
            onChange={(e) => { setLeaveTypeFilter(e.target.value); setPage(0); }}
            size="small" sx={{ minWidth: 130 }}
          >
            <MenuItem value="">{langPackLabel("txtAll") || "All"}</MenuItem>
            {leaveTypes.map((lt) => (<MenuItem key={lt.id} value={lt.id}>{lt.name}</MenuItem>))}
          </TextField>
          <LocalizedDatePicker label={langPackLabel("txtFromDate") || "From"} value={startDateFilter}
            onChange={(v) => { setStartDateFilter(v); setPage(0); }}
            size="small" sx={{ minWidth: 130 }} />
          <LocalizedDatePicker label={langPackLabel("txtToDate") || "To"} value={endDateFilter}
            onChange={(v) => { setEndDateFilter(v); setPage(0); }}
            size="small" sx={{ minWidth: 130 }} />
          {hasActiveFilters && (
            <Button variant="outlined" size="small" onClick={handleClearFilters}>{langPackLabel("txtClearFilters") || "Clear"}</Button>
          )}
        </Box>
      </Paper>

      {/* Table */}
      <Paper>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px"><CircularProgress /></Box>
        ) : requests.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {hasActiveFilters ? (langPackLabel("txtNoLeaveRequestsMatchFilters") || 'No leave requests match your filters.') : (langPackLabel("txtNoLeaveRequestsFound") || 'No leave requests found.')}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {isManager && <TableCell sx={{ fontWeight: 600 }}>{langPackLabel("txtWho") || "Who"}</TableCell>}
                    <TableCell>
                      <TableSortLabel active={sortField === 'date'} direction={sortField === 'date' ? sortDirection : 'asc'} onClick={() => handleSortChange('date')}>{langPackLabel("txtDates") || "Dates"}</TableSortLabel>
                    </TableCell>
                    <TableCell>{langPackLabel("txtLeaveType") || "Leave Type"}</TableCell>
                    <TableCell>{langPackLabel("txtTotalDays") || "Total Days"}</TableCell>
                    <TableCell>{langPackLabel("txtReason") || "Reason"}</TableCell>
                    <TableCell>{langPackLabel("txtRequested") || "Requested"}</TableCell>
                    <TableCell>{langPackLabel("txtApproved") || "Approved"}</TableCell>
                    <TableCell>{langPackLabel("txtApprovedBy") || "Approved By"}</TableCell>
                    <TableCell>
                      <TableSortLabel active={sortField === 'status'} direction={sortField === 'status' ? sortDirection : 'asc'} onClick={() => handleSortChange('status')}>{langPackLabel("txtStatus") || "Status"}</TableSortLabel>
                    </TableCell>
                    <TableCell>{langPackLabel("txtActions") || "Actions"}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id} hover>
                      {isManager && (
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">{req.user?.full_name ?? '—'}</Typography>
                        </TableCell>
                      )}
                      <TableCell>
                        {formatLocalDate(req.start_date, language)} –{' '}
                        {formatLocalDate(req.end_date, language)}
                      </TableCell>
                      <TableCell>{localizedLeaveTypeName(req.leave_type, language)}</TableCell>
                      <TableCell>{req.total_days}</TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {req.reason || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{formatLocalDate(req.created_at, language)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{formatLocalDate(req.approved_at, language)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{(req as any).approved_by_user?.full_name || '—'}</Typography>
                      </TableCell>
                      <TableCell><Chip label={localizedStatus(req.status, langPackLabel)} color={statusColorMap[req.status]} size="small" /></TableCell>
                      <TableCell>
                        {(() => {
                          const isPending = req.status === 'pending';
                          const isApprovedFuture = req.status === 'approved' && new Date(req.end_date) >= new Date(new Date().toISOString().split('T')[0] + 'T00:00:00');
                          const canModify = (isPending || isApprovedFuture) && req.user_id === user?.id && req.reason !== 'Collective leave';
                          return canModify ? (
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton size="small" color="primary" onClick={() => handleEditClick(req)} title={langPackLabel("txtEditDates") || "Edit dates"}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => handleDeleteClick(req)} title={langPackLabel("txtDeleteRequest") || "Delete request"}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ) : null;
                        })()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination component="div" count={totalCount} page={page} onPageChange={handlePageChange}
              rowsPerPage={rowsPerPage} onRowsPerPageChange={handleRowsPerPageChange} rowsPerPageOptions={[5, 10, 25]} />
          </>
        )}
      </Paper>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onClose={handleCancelDialogClose}>
        <DialogTitle>{langPackLabel("txtCancelLeaveRequest") || "Cancel Leave Request"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {langPackLabel("txtCancelLeaveConfirm") || "Are you sure you want to cancel this leave request"}
            {cancelTarget && (<>
              {' '}{langPackLabel("txtFor") || "for"} <strong>{formatLocalDate(cancelTarget.start_date, language)} – {formatLocalDate(cancelTarget.end_date, language)}</strong>
              {' '}({cancelTarget.total_days} {cancelTarget.total_days !== 1 ? (langPackLabel("txtDays") || 'days') : (langPackLabel("txtDay") || 'day')})
            </>)}? {langPackLabel("txtCannotBeUndone") || "This action cannot be undone."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDialogClose} disabled={cancelling}>{langPackLabel("txtNoKeepIt") || "No, Keep It"}</Button>
          <Button onClick={handleCancelConfirm} color="error" variant="contained" disabled={cancelling}
            startIcon={cancelling ? <CircularProgress size={16} /> : undefined}>
            {cancelling ? (langPackLabel("txtCancelling") || 'Cancelling...') : (langPackLabel("txtYesCancelRequest") || 'Yes, Cancel Request')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{langPackLabel("txtEditLeaveRequest") || "Edit Leave Request"}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {langPackLabel("txtUpdateDatesBelow") || "Update the dates below. The request will be reset to pending for re-approval."}
          </DialogContentText>
          <Box sx={{ mt: 1, mb: 2 }}>
            <LocalizedDatePicker label={langPackLabel("txtStartDate") || "Start Date"} value={editStartDate}
              onChange={setEditStartDate} fullWidth />
          </Box>
          <Box sx={{ mb: 2 }}>
            <LocalizedDatePicker label={langPackLabel("txtEndDate") || "End Date"} value={editEndDate}
              onChange={setEditEndDate} fullWidth />
          </Box>
          <TextField label={langPackLabel("txtReasonOptional") || "Reason (Optional)"} multiline rows={2} fullWidth value={editReason}
            onChange={(e) => setEditReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditDialogClose} disabled={editing}>{langPackLabel("txtCancel") || "Cancel"}</Button>
          <Button onClick={handleEditConfirm} variant="contained" disabled={editing}
            startIcon={editing ? <CircularProgress size={16} /> : undefined}>
            {editing ? (langPackLabel("txtSaving") || 'Saving…') : (langPackLabel("txtSaveResubmit") || 'Save & Re-submit')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>{langPackLabel("txtDeleteLeaveRequest") || "Delete Leave Request"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {langPackLabel("txtDeleteLeaveConfirm") || "Are you sure you want to permanently delete this leave request"}
            {deleteTarget && (<>
              {' '}{langPackLabel("txtFor") || "for"} <strong>{formatLocalDate(deleteTarget.start_date, language)} – {formatLocalDate(deleteTarget.end_date, language)}</strong>
              {' '}({deleteTarget.total_days} {deleteTarget.total_days !== 1 ? (langPackLabel("txtDays") || 'days') : (langPackLabel("txtDay") || 'day')})
            </>)}? {langPackLabel("txtCannotBeUndone") || "This action cannot be undone."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} disabled={deleting}>{langPackLabel("txtNoKeepIt") || "No, Keep It"}</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : undefined}>
            {deleting ? (langPackLabel("txtDeleting") || 'Deleting...') : (langPackLabel("txtYesDelete") || 'Yes, Delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeaveHistory;
