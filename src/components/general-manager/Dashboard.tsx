// src/components/general-manager/Dashboard.tsx — Department Manager Dashboard
import React, { useEffect, useState } from 'react';
import { useAutoClearing } from '../../hooks/useAutoClearing';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Button,
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
  Groups as GroupsIcon,
  Refresh,
} from '@mui/icons-material';
import { apiClient } from '../../config/api';
import { useAuth } from '../../hooks/useAuth';
import { BalanceService } from '../../services/balance';
import { EnhancedLeaveBalanceSummary } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface DeptStats {
  totalEmployees: number;
  onLeaveToday: number;
  pendingRequests: number;
  teamsCount: number;
}

interface TeamBreakdown {
  teamId: string;
  teamName: string;
  teamSize: number;
  pendingRequests: number;
  onLeaveToday: number;
}

const DepartmentManagerDashboard: React.FC = () => {
  const { langPackLabel } = useLanguage();
  const { user: currentUser } = useAuth();
  const [stats, setStats] = useState<DeptStats>({
    totalEmployees: 0,
    onLeaveToday: 0,
    pendingRequests: 0,
    teamsCount: 0,
  });
  const [teamBreakdown, setTeamBreakdown] = useState<TeamBreakdown[]>([]);
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

      if (!currentUser?.id || !currentUser?.department_id) {
        setError(langPackLabel("txtNoAuthenticatedUser") || 'No authenticated user or department assignment found');
        return;
      }

      const departmentId = currentUser.department_id;
      const today = new Date().toISOString().split('T')[0];

      // Fetch teams in this department
      const deptTeams: { id: string; name: string }[] = await apiClient.get('/teams', { department_id: departmentId });

      // Fetch all users in this department
      const deptUsers: { id: string; full_name: string; team_id: string }[] = await apiClient.get('/users', { department_id: departmentId });

      const userIds = (deptUsers ?? []).map((u) => u.id);

      let pendingCount = 0;
      let onLeaveCount = 0;

      if (userIds.length > 0) {
        const pendingData: any[] = await apiClient.get('/leave-requests/scope', {
          status: 'pending',
          user_ids: userIds.join(','),
        });
        pendingCount = (pendingData ?? []).length;

        const approvedData: any[] = await apiClient.get('/leave-requests/scope', {
          status: 'approved',
          user_ids: userIds.join(','),
        });
        onLeaveCount = (approvedData ?? []).filter(
          (r: any) => r.start_date <= today && r.end_date >= today
        ).length;
      }

      setStats({
        totalEmployees: deptUsers?.length ?? 0,
        onLeaveToday: onLeaveCount,
        pendingRequests: pendingCount,
        teamsCount: deptTeams?.length ?? 0,
      });

      // Build team-level breakdown
      await buildTeamBreakdown(deptTeams ?? [], deptUsers ?? [], today);

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

  const buildTeamBreakdown = async (
    teams: { id: string; name: string }[],
    deptUsers: { id: string; full_name: string; team_id: string }[],
    today: string
  ) => {
    if (teams.length === 0) {
      setTeamBreakdown([]);
      return;
    }

    const teamUserMap: Record<string, string[]> = {};
    for (const team of teams) {
      teamUserMap[team.id] = deptUsers
        .filter((u) => u.team_id === team.id)
        .map((u) => u.id);
    }

    const allTeamUserIds = Object.values(teamUserMap).flat();

    let pendingData: any[] = [];
    let onLeaveData: any[] = [];

    if (allTeamUserIds.length > 0) {
      pendingData = await apiClient.get('/leave-requests/scope', {
        status: 'pending',
        user_ids: allTeamUserIds.join(','),
      });

      const approvedData: any[] = await apiClient.get('/leave-requests/scope', {
        status: 'approved',
        user_ids: allTeamUserIds.join(','),
      });
      onLeaveData = (approvedData ?? []).filter(
        (r: any) => r.start_date <= today && r.end_date >= today
      );
    }

    const breakdown: TeamBreakdown[] = teams.map((team) => {
      const memberIds = teamUserMap[team.id] || [];
      return {
        teamId: team.id,
        teamName: team.name,
        teamSize: memberIds.length,
        pendingRequests: (pendingData ?? []).filter((r: any) => memberIds.includes(r.user_id?._id || r.user_id)).length,
        onLeaveToday: (onLeaveData ?? []).filter((r: any) => memberIds.includes(r.user_id?._id || r.user_id)).length,
      };
    });

    setTeamBreakdown(breakdown);
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

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 600 }}>
          {langPackLabel("txtDashboard") || "Department Manager Dashboard"}
        </Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchDashboardData}>{langPackLabel("txtRefresh") || "Refresh"}</Button>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <People color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">{langPackLabel("txtDepartmentEmployees") || "Department Employees"}</Typography>
            </Box>
            <Typography variant="h4" color="primary">
              {stats.totalEmployees}
            </Typography>
          </CardContent>
        </Card>

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

        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PendingActions sx={{ mr: 1, color: 'error.main' }} />
              <Typography variant="h6">{langPackLabel("txtPendingRequests") || "Pending Requests"}</Typography>
            </Box>
            <Typography variant="h4" sx={{ color: 'error.main' }}>
              {stats.pendingRequests}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <GroupsIcon sx={{ mr: 1, color: 'info.main' }} />
              <Typography variant="h6">{langPackLabel("txtTeams") || "Teams"}</Typography>
            </Box>
            <Typography variant="h4" sx={{ color: 'info.main' }}>
              {stats.teamsCount}
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

      {/* Team-Level Breakdown */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        {langPackLabel("txtTeamBreakdown") || "Team Breakdown"}
      </Typography>
      <Paper sx={{ mb: 4, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>{langPackLabel("txtTeamName") || "Team Name"}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>{langPackLabel("txtTeamSize") || "Team Size"}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>{langPackLabel("txtPendingRequests") || "Pending Requests"}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>{langPackLabel("txtOnLeaveToday") || "On Leave Today"}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {teamBreakdown.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography color="text.secondary">{langPackLabel("txtNoTeamsFound") || "No teams found"}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                teamBreakdown.map((team) => (
                  <TableRow key={team.teamId}>
                    <TableCell>{team.teamName}</TableCell>
                    <TableCell align="center">{team.teamSize}</TableCell>
                    <TableCell align="center">{team.pendingRequests}</TableCell>
                    <TableCell align="center">{team.onLeaveToday}</TableCell>
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

export default DepartmentManagerDashboard;
