// src/components/admin/CollectiveLeave/index.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
} from '@mui/material';
import { Add, Refresh, Delete } from '@mui/icons-material';
import { RootState, AppDispatch } from '../../../store';
import {
  createCollectiveLeaveThunk,
  fetchCollectiveLeaves,
  fetchHolidays,
} from '../../../store/slices/leaveSlice';
import {
  fetchGroups,
  fetchDepartments,
  fetchTeams,
  selectWorkdayConfig,
  selectLegalWorkdays,
} from '../../../store/slices/organizationSlice';
import { countLeaveDays } from '../../../utils/leaveDayCounter';
import { CollectiveLeave } from '../../../types';
import { apiClient } from '../../../config/api';
import Swal from 'sweetalert2';
import { CollectiveLeaveService } from '../../../services/collectiveLeave';
import { useAutoClearing } from '../../../hooks/useAutoClearing';
import { useLanguage } from '../../../contexts/LanguageContext';
import LocalizedDatePicker from '../../common/LocalizedDatePicker';

type Scope = 'company' | 'group' | 'department' | 'team';

const scopeLabels: Record<Scope, string> = {
  company: 'Company',
  group: 'Group',
  department: 'Department',
  team: 'Team',
};

const CollectiveLeavePage: React.FC = () => {
  const { langPackLabel } = useLanguage();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const collectiveLeaves = useSelector((state: RootState) => state.leave.collectiveLeaves);
  const holidays = useSelector((state: RootState) => state.leave.holidays);
  const loading = useSelector((state: RootState) => state.leave.loading);
  const workdayConfig = useSelector(selectWorkdayConfig);
  const legalWorkdays = useSelector(selectLegalWorkdays);
  const groups = useSelector((state: RootState) => state.organization.groups);
  const departments = useSelector((state: RootState) => state.organization.departments);
  const teams = useSelector((state: RootState) => state.organization.teams);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [scope, setScope] = useState<Scope>('company');
  const [scopeId, setScopeId] = useState('');
  const [error, setError] = useAutoClearing(7000);
  const [success, setSuccess] = useAutoClearing(7000);
  const [negativeBalanceWarning, setNegativeBalanceWarning] = useState<string[]>([]);

  const companyId = user?.company_id;

  // Fetch collective leaves and holidays on mount
  useEffect(() => {
    if (companyId) {
      dispatch(fetchCollectiveLeaves(companyId));
      dispatch(fetchHolidays(companyId));
      dispatch(fetchGroups(companyId));
      dispatch(fetchDepartments(undefined));
      dispatch(fetchTeams(undefined));
    }
  }, [dispatch, companyId]);

  // When scope is 'company', auto-set scopeId to companyId
  useEffect(() => {
    if (scope === 'company' && companyId) {
      setScopeId(companyId);
    } else {
      setScopeId('');
    }
  }, [scope, companyId]);

  // Calculate working days from the selected date range
  const calculatedDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    if (endDate < startDate) return 0;
    return countLeaveDays({ startDate, endDate, holidays, workdays: workdayConfig, legalWorkdays });
  }, [startDate, endDate, holidays, workdayConfig, legalWorkdays]);

  // Scope ID options based on selected scope
  const scopeIdOptions = useMemo(() => {
    switch (scope) {
      case 'group':
        return groups.map((g) => ({ id: g.id, name: g.name }));
      case 'department':
        return departments.map((d) => ({ id: d.id, name: d.name }));
      case 'team':
        return teams.map((t) => ({ id: t.id, name: t.name }));
      default:
        return [];
    }
  }, [scope, groups, departments, teams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !user) return;

    setError(null);
    setSuccess(null);
    setNegativeBalanceWarning([]);

    try {
      const result = await dispatch(
        createCollectiveLeaveThunk({
          startDate,
          endDate,
          scope,
          scopeId,
          companyId,
          createdBy: user.id,
        })
      ).unwrap();

      setSuccess(
        `Collective leave created: ${result.totalDays} working days, ${result.affectedEmployees} employees affected.`
      );

      if (result.negativeBalanceEmployees.length > 0) {
        // Resolve employee IDs to full names
        try {
          const empData: any[] = await apiClient.get('/users');
          const negIds = new Set(result.negativeBalanceEmployees);
          const names = (empData ?? [])
            .filter((u: any) => negIds.has(u.id || u._id))
            .map((u: any) => u.full_name);
          setNegativeBalanceWarning(names.length > 0 ? names : result.negativeBalanceEmployees);
        } catch {
          setNegativeBalanceWarning(result.negativeBalanceEmployees);
        }
      }

      // Reset form
      setStartDate('');
      setEndDate('');
      setScope('company');
      setScopeId(companyId);

      // Refresh the list
      dispatch(fetchCollectiveLeaves(companyId));
    } catch (err: any) {
      setError(typeof err === 'string' ? err : err.message || langPackLabel("txtSomethingWentWrong") || 'An error occurred');
    }
  };

  const handleDelete = async (cl: CollectiveLeave) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: langPackLabel("txtDeleteCollectiveLeave") || 'Delete collective leave?',
      html: `${langPackLabel("txtDeleteCollectiveLeaveDesc") || "This will delete the collective leave from"} <strong>${formatDate(cl.start_date)}</strong> – <strong>${formatDate(cl.end_date)}</strong> ${langPackLabel("txtAndRemoveRequests") || "and remove all associated leave requests from employees."}`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: langPackLabel("txtDelete") || 'Delete',
    });
    if (result.isConfirmed) {
      try {
        await CollectiveLeaveService.deleteCollectiveLeave(cl.id);
        Swal.fire({ icon: 'success', title: langPackLabel("txtDeleted") || 'Deleted', text: langPackLabel("txtCollectiveLeaveDeleted") || 'Collective leave and associated requests have been removed.', timer: 2500, showConfirmButton: false });
        if (companyId) dispatch(fetchCollectiveLeaves(companyId));
      } catch (err: any) {
        setError(err.message || langPackLabel("txtSomethingWentWrong") || 'Failed to delete collective leave');
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600 }}>
          {langPackLabel("txtCollectiveLeaveManagement") || "Collective Leave Management"}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Refresh />}
          onClick={() => companyId && dispatch(fetchCollectiveLeaves(companyId))}
        >{langPackLabel("txtRefresh") || "Refresh"}</Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {negativeBalanceWarning.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setNegativeBalanceWarning([])}>
          <Typography variant="subtitle2" gutterBottom>
            {langPackLabel("txtNegativeBalanceWarning") || "The following employees have a negative leave balance:"}
          </Typography>
          <Typography variant="body2">
            {negativeBalanceWarning.length} {langPackLabel("txtEmployeesWithNegativeBalance") || "employee(s) with negative balance:"} {negativeBalanceWarning.join(', ')}
          </Typography>
        </Alert>
      )}

      {/* Create Collective Leave Form */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
          {langPackLabel("txtCreateCollectiveLeave") || "Create Collective Leave"}
        </Typography>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-start' }}>
            <LocalizedDatePicker
              label={langPackLabel("txtStartDate") || "Start Date"}
              value={startDate}
              onChange={setStartDate}
              size="small"
              required
              sx={{ minWidth: 150 }}
            />
            <LocalizedDatePicker
              label={langPackLabel("txtEndDate") || "End Date"}
              value={endDate}
              onChange={setEndDate}
              size="small"
              required
              sx={{ minWidth: 150 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>{langPackLabel("txtScope") || "Scope"}</InputLabel>
              <Select
                value={scope}
                label={langPackLabel("txtScope") || "Scope"}
                onChange={(e) => setScope(e.target.value as Scope)}
              >
                {(Object.keys(scopeLabels) as Scope[]).map((key) => (
                  <MenuItem key={key} value={key}>
                    {scopeLabels[key]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {scope !== 'company' && (
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel>{langPackLabel("txtScopeSelection") || "Scope Selection"}</InputLabel>
                <Select
                  value={scopeId}
                  label={langPackLabel("txtScopeSelection") || "Scope Selection"}
                  required
                  onChange={(e) => setScopeId(e.target.value)}
                >
                  {scopeIdOptions.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={`${calculatedDays} ${langPackLabel("txtWorkingDays") || "working days"}`}
                color={calculatedDays > 0 ? 'primary' : 'default'}
                variant="outlined"
                size="small"
              />
              <Button
                type="submit"
                variant="contained"
                size="small"
                startIcon={<Add />}
                disabled={loading || calculatedDays === 0 || !scopeId}
              >
                {langPackLabel("txtCreate") || "Create"}
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>

      {/* Collective Leaves Table */}
      <Paper sx={{ mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>{langPackLabel("txtStart") || "Start"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtEnd") || "End"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtTotalDays") || "Total Days"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtScope") || "Scope"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtCreated") || "Created"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtActions") || "Actions"}</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && collectiveLeaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box sx={{ py: 4 }}>
                      <CircularProgress size={32} />
                    </Box>
                  </TableCell>
                </TableRow>
              ) : collectiveLeaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {langPackLabel("txtNoCollectiveLeaveRecords") || "No collective leave records found."}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                collectiveLeaves.map((cl: CollectiveLeave) => (
                  <TableRow key={cl.id} hover>
                    <TableCell>{formatDate(cl.start_date)}</TableCell>
                    <TableCell>{formatDate(cl.end_date)}</TableCell>
                    <TableCell>
                      <Chip label={`${cl.total_days} days`} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={scopeLabels[cl.scope] || cl.scope}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatDateTime(cl.created_at)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(cl)}
                        title="Delete collective leave"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default CollectiveLeavePage;
