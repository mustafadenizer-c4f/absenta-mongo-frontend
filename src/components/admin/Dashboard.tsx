// src/components/admin/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { useAutoClearing } from "../../hooks/useAutoClearing";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { UsersService } from "../../services/users";
import { LeaveService } from "../../services/leave";
import {
  Box, Typography, Paper, Button, CircularProgress, Alert,
  Card, CardContent, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip,
} from "@mui/material";
import { People, ManageAccounts, Person, Refresh, BeachAccess } from "@mui/icons-material";
import { useLanguage } from "../../contexts/LanguageContext";
import { localizedLeaveTypeName } from "../../utils/localize";

const AdminDashboard: React.FC = () => {
  const { langPackLabel, language } = useLanguage();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const { hierarchyProfile } = useSelector((state: RootState) => state.organization);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useAutoClearing(7000);
  const [onLeaveToday, setOnLeaveToday] = useState<any[]>([]);

  const hp = hierarchyProfile || 'flat';

  useEffect(() => {
    fetchUsers();
    fetchTeamAvailability();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await UsersService.getAll(currentUser?.company_id);
      setUsers(data || []);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const fetchTeamAvailability = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await LeaveService.getTeamRequests({ status: 'approved', startDate: today, endDate: today });
      setOnLeaveToday(data || []);
    } catch {}
  };

  // Build stat cards based on hierarchy
  const statCards: { label: string; value: number; color: string; icon: React.ReactNode }[] = [
    { label: langPackLabel("txtTotalUsers") || "Total", value: users.length, color: "primary.main", icon: <People fontSize="small" /> },
  ];

  if (hp === 'groups') {
    statCards.push({ label: langPackLabel("txtGroupManagers") || "Grp Mgrs", value: users.filter((u) => u.role === 'group_manager').length, color: "warning.main", icon: <ManageAccounts fontSize="small" /> });
    statCards.push({ label: langPackLabel("txtDeptManagers") || "Dept Mgrs", value: users.filter((u) => u.role === 'department_manager').length, color: "info.main", icon: <ManageAccounts fontSize="small" /> });
    statCards.push({ label: langPackLabel("txtManagers") || "Managers", value: users.filter((u) => u.role === 'manager').length, color: "secondary.main", icon: <ManageAccounts fontSize="small" /> });
  } else if (hp === 'departments') {
    statCards.push({ label: langPackLabel("txtDeptManagers") || "Dept Mgrs", value: users.filter((u) => u.role === 'department_manager').length, color: "info.main", icon: <ManageAccounts fontSize="small" /> });
    statCards.push({ label: langPackLabel("txtManagers") || "Managers", value: users.filter((u) => u.role === 'manager').length, color: "secondary.main", icon: <ManageAccounts fontSize="small" /> });
  } else if (hp === 'teams') {
    statCards.push({ label: langPackLabel("txtManagers") || "Managers", value: users.filter((u) => u.role === 'manager').length, color: "secondary.main", icon: <ManageAccounts fontSize="small" /> });
  }

  statCards.push({ label: langPackLabel("txtStaff") || "Staff", value: users.filter((u) => u.role === 'staff').length, color: "success.main", icon: <Person fontSize="small" /> });
  statCards.push({ label: langPackLabel("txtOnLeaveToday") || "On Leave", value: onLeaveToday.length, color: "error.main", icon: <BeachAccess fontSize="small" /> });

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;

  if (error) return <Alert severity="error" sx={{ mb: 3 }}>{error}<Button onClick={fetchUsers} sx={{ ml: 2 }}>Retry</Button></Alert>;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 1 }}>
        <Typography variant="h5" sx={{ color: "primary.main", fontWeight: 600 }}>{langPackLabel("txtDashboard") || "Dashboard"}</Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={() => { fetchUsers(); fetchTeamAvailability(); }} size="small">{langPackLabel("txtRefresh") || "Refresh"}</Button>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 3 }}>
        {statCards.map((s, i) => (
          <Card key={i} sx={{ flex: "1 1 120px", minWidth: 100 }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 1, py: 1.5, px: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Box sx={{ color: s.color }}>{s.icon}</Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</Typography>
                <Typography variant="caption" color="text.secondary" noWrap>{s.label}</Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Who's On Leave Today */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          {langPackLabel("txtOnLeaveToday") || "On Leave Today"} ({onLeaveToday.length})
        </Typography>
        {onLeaveToday.length > 0 ? (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{langPackLabel("txtName") || "Name"}</TableCell>
                  <TableCell>{langPackLabel("txtType") || "Type"}</TableCell>
                  <TableCell>{langPackLabel("txtUntil") || "Until"}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {onLeaveToday.map((req: any) => (
                  <TableRow key={req.id} hover>
                    <TableCell><Typography variant="body2">{req.user?.full_name ?? "Unknown"}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{localizedLeaveTypeName(req.leave_type, language)}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{new Date(req.end_date).toLocaleDateString()}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Chip label={langPackLabel("txtEveryoneAvailable") || "Everyone is available today"} color="success" size="small" />
        )}
      </Paper>

      {/* Quick Actions + System Info */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        <Card sx={{ flex: "1 1 280px", minWidth: 260 }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>{langPackLabel("txtQuickActions") || "Quick Actions"}</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button variant="outlined" size="small" startIcon={<People />} onClick={() => (window.location.href = "/admin/users")} fullWidth sx={{ justifyContent: "flex-start" }}>{langPackLabel("txtManageUsers") || "Users"}</Button>
              <Button variant="outlined" size="small" startIcon={<ManageAccounts />} onClick={() => (window.location.href = "/admin/leave-types")} fullWidth sx={{ justifyContent: "flex-start" }}>{langPackLabel("txtManageLeaveTypes") || "Leave Types"}</Button>
              <Button variant="outlined" size="small" startIcon={<Person />} onClick={() => (window.location.href = "/admin/holidays")} fullWidth sx={{ justifyContent: "flex-start" }}>{langPackLabel("txtManageHolidays") || "Holidays"}</Button>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: "1 1 280px", minWidth: 260 }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>{langPackLabel("txtSystemInfo") || "System Info"}</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography variant="body2"><strong>{langPackLabel("txtCurrentUser") || "User"}:</strong> {currentUser?.full_name}</Typography>
              <Typography variant="body2"><strong>{langPackLabel("txtEmail") || "Email"}:</strong> {currentUser?.email}</Typography>
              <Typography variant="body2"><strong>{langPackLabel("txtHierarchy") || "Hierarchy"}:</strong> {hp}</Typography>
              <Typography variant="body2" component="div">
                <strong>{langPackLabel("txtStatus") || "Status"}:</strong>
                <Chip label={currentUser?.requires_password_change ? "Reset Required" : "Active"} size="small" color={currentUser?.requires_password_change ? "warning" : "success"} sx={{ ml: 1 }} />
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
