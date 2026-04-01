// src/components/admin/Users/index.tsx - Multi-tenant: company auto-inherited from admin
import React, { useState, useEffect } from 'react';
import { useAutoClearing } from '../../../hooks/useAutoClearing';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { fetchHierarchyProfile } from '../../../store/slices/organizationSlice';
import { OrganizationService } from '../../../services/organization';
import { UsersService } from '../../../services/users';
import { User, UserRole, Group, Department, Team } from '../../../types';
import Swal from 'sweetalert2';
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
  TablePagination,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Edit,
  Delete,
  Refresh,
  PersonAdd,
  LockReset,
  Search,
} from '@mui/icons-material';
import { useLanguage } from '../../../contexts/LanguageContext';
import LocalizedDatePicker from '../../common/LocalizedDatePicker';

const ROLE_LABELS: Record<UserRole, string> = {
  staff: 'Staff',
  manager: 'Manager',
  group_manager: 'Group Manager',
  department_manager: 'Department Manager',
  admin: 'Admin',
  supervisor: 'Supervisor',
};

const ROLE_COLORS: Record<UserRole, 'default' | 'primary' | 'secondary' | 'info' | 'warning'> = {
  staff: 'default',
  manager: 'secondary',
  group_manager: 'info',
  department_manager: 'warning',
  admin: 'primary',
  supervisor: 'warning',
};

interface UserFormData {
  email: string;
  full_name: string;
  phone: string;
  hire_date: string;
  birth_date: string;
  sex: string;
  address: string;
  city: string;
  country: string;
  job_title: string;
  role: UserRole;
  group_id: string;
  department_id: string;
  team_id: string;
  manager_id: string;
}

const Users: React.FC = () => {
  const { langPackLabel } = useLanguage();
  const dispatch = useDispatch<AppDispatch>();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const { hierarchyProfile } = useSelector((state: RootState) => state.organization);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useAutoClearing(7000);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [newUserPassword, setNewUserPassword] = useState('Pp123456');
  const [initialAnnualBalance, setInitialAnnualBalance] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  // Organization data — scoped to admin's company
  const [groups, setGroups] = useState<Group[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    full_name: '',
    phone: '',
    hire_date: new Date().toISOString().split('T')[0],
    birth_date: '',
    sex: '',
    address: '',
    city: '',
    country: '',
    job_title: '',
    role: 'staff',
    group_id: '',
    department_id: '',
    team_id: '',
    manager_id: '',
  });

  useEffect(() => {
    fetchUsers();
    // hierarchy profile is already fetched by Layout
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load org data based on hierarchy profile
  useEffect(() => {
    if (!currentUser?.company_id) return;
    const profile = hierarchyProfile || 'flat';
    if (profile === 'groups') {
      fetchGroups(currentUser.company_id);
    }
    if (profile === 'departments') {
      // departments are top-level in this profile, fetch all
      fetchDepartments();
    }
    if (profile === 'teams') {
      // teams are the only level, fetch all
      fetchTeamsForCompany();
    }
  }, [hierarchyProfile, currentUser?.company_id]);

  // Track whether we're initializing the form (editing existing user) vs user interaction
  const [isInitializing, setIsInitializing] = useState(false);

  // Cascade: when group changes, fetch departments for that group (only in 'groups' profile)
  useEffect(() => {
    if (hp !== 'groups') return;
    if (formData.group_id) {
      fetchDepartments(formData.group_id);
    } else {
      setDepartments([]);
      setTeams([]);
    }
    if (!isInitializing) {
      setFormData((prev) => ({ ...prev, department_id: '', team_id: '', manager_id: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.group_id]);

  // Cascade: when department changes, fetch teams (in 'groups' and 'departments' profiles)
  useEffect(() => {
    if (hp === 'teams' || hp === 'flat') return;
    if (formData.department_id) {
      fetchTeamsForDept(formData.department_id);
    } else {
      setTeams([]);
    }
    if (!isInitializing) {
      setFormData((prev) => ({ ...prev, team_id: '', manager_id: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.department_id]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await UsersService.getAll(currentUser?.company_id);
      setUsers(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async (companyId: string) => {
    try {
      const data = await OrganizationService.getGroups(companyId);
      setGroups(data);
    } catch (err: any) {
      console.error('Failed to fetch groups:', err.message);
    }
  };

  const fetchDepartments = async (groupId?: string) => {
    try {
      const data = await OrganizationService.getDepartments(groupId);
      setDepartments(data);
    } catch (err: any) {
      console.error('Failed to fetch departments:', err.message);
    }
  };

  const fetchTeamsForDept = async (departmentId: string) => {
    try {
      const data = await OrganizationService.getTeams(departmentId);
      setTeams(data);
    } catch (err: any) {
      console.error('Failed to fetch teams:', err.message);
    }
  };

  const fetchTeamsForCompany = async () => {
    try {
      const data = await OrganizationService.getTeams();
      setTeams(data);
    } catch (err: any) {
      console.error('Failed to fetch teams:', err.message);
    }
  };

  // Hierarchy profile shorthand — used by visibility helpers and manager filtering
  const hp = hierarchyProfile || 'flat';

  // Determine which role is the "next level up" for the selected role
  const getApproverRoles = (role: UserRole): UserRole[] => {
    switch (role) {
      case 'staff':
        if (hp === 'flat') return ['manager', 'admin'];
        return ['manager'];
      case 'manager':
        if (hp === 'groups') return ['department_manager'];
        if (hp === 'departments') return ['department_manager'];
        return ['admin'];
      case 'department_manager':
        if (hp === 'groups') return ['group_manager'];
        return ['admin'];
      case 'group_manager': return ['admin'];
      default: return [];
    }
  };

  // Whether the selected role needs a manager assignment
  const needsManager = (role: UserRole) => role !== 'admin' && role !== 'supervisor';

  // Filter potential managers: users with the approver role, scoped to org level
  const getFilteredManagers = () => {
    const approverRoles = getApproverRoles(formData.role);
    if (approverRoles.length === 0) return [];
    let candidates = users.filter((u) => approverRoles.includes(u.role));
    // For roles whose only approver is admin, don't filter by org — admins are company-wide
    if (approverRoles.length === 1 && approverRoles[0] === 'admin') {
      return candidates;
    }
    // Scope by org level — but always fall back to all candidates if scoping yields empty
    if (formData.department_id && (hp === 'groups' || hp === 'departments')) {
      const scoped = candidates.filter((m) => m.department_id === formData.department_id);
      if (scoped.length > 0) candidates = scoped;
    }
    if (formData.group_id && hp === 'groups') {
      const scoped = candidates.filter((m) => m.group_id === formData.group_id);
      if (scoped.length > 0) candidates = scoped;
    }
    return candidates;
  };
  const filteredManagers = getFilteredManagers();

  const handleOpenDialog = async (user?: User) => {
    if (user) {
      setIsInitializing(true);
      setEditingUser(user);

      // Pre-load org data based on hierarchy profile
      if (hp === 'groups' && currentUser?.company_id) {
        await fetchGroups(currentUser.company_id);
        if (user.group_id) await fetchDepartments(user.group_id);
        if (user.department_id) await fetchTeamsForDept(user.department_id);
      } else if (hp === 'departments') {
        await fetchDepartments();
        if (user.department_id) await fetchTeamsForDept(user.department_id);
      } else if (hp === 'teams') {
        await fetchTeamsForCompany();
      }

      setFormData({
        email: user.email,
        full_name: user.full_name,
        phone: user.phone || '',
        hire_date: user.hire_date ? user.hire_date.split('T')[0] : '',
        birth_date: user.birth_date ? user.birth_date.split('T')[0] : '',
        sex: user.sex || '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || '',
        job_title: user.job_title || '',
        role: user.role || 'staff',
        group_id: user.group_id || '',
        department_id: user.department_id || '',
        team_id: user.team_id || '',
        manager_id: user.manager_id || '',
      });

      setOpenDialog(true);
      setTimeout(() => setIsInitializing(false), 0);
    } else {
      // New user — open create dialog
      setEditingUser(null);
      // Pre-load org data based on hierarchy profile
      if (hp === 'groups' && currentUser?.company_id) {
        await fetchGroups(currentUser.company_id);
      } else if (hp === 'departments') {
        await fetchDepartments();
      } else if (hp === 'teams') {
        await fetchTeamsForCompany();
      }
      setFormData({
        email: '',
        full_name: '',
        phone: '',
        hire_date: new Date().toISOString().split('T')[0],
        birth_date: '',
        sex: '',
        address: '',
        city: '',
        country: '',
        job_title: '',
        role: 'staff',
        group_id: '',
        department_id: '',
        team_id: '',
        manager_id: '',
      });
      setNewUserPassword('Pp123456');
      setInitialAnnualBalance('');
      setOpenDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setDepartments([]);
    setTeams([]);
  };

  const handleGroupChange = (groupId: string) => {
    setIsInitializing(false);
    setFormData((prev) => ({
      ...prev,
      group_id: groupId,
      department_id: '',
      team_id: '',
      manager_id: '',
    }));
  };

  // Hierarchy-aware visibility helpers
  // groups = all levels, departments = depts+teams, teams = only teams
  const needsGroup = (role: UserRole) =>
    hp === 'groups' && ['group_manager', 'department_manager', 'manager', 'staff'].includes(role);
  const needsDepartment = (role: UserRole) =>
    (hp === 'groups' || hp === 'departments') && ['department_manager', 'manager', 'staff'].includes(role);
  const needsTeam = (role: UserRole) =>
    hp !== 'flat' && ['manager', 'staff'].includes(role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required org fields
    if (needsGroup(formData.role) && !formData.group_id) {
      setError(langPackLabel("txtPleaseSelectGroup") || 'Please select a group.'); return;
    }
    if (needsDepartment(formData.role) && !formData.department_id) {
      setError(langPackLabel("txtPleaseSelectDepartment") || 'Please select a department.'); return;
    }
    if (needsTeam(formData.role) && !formData.team_id) {
      setError(langPackLabel("txtPleaseSelectTeam") || 'Please select a team.'); return;
    }
    if (needsManager(formData.role) && !formData.manager_id) {
      setError(langPackLabel("txtPleaseSelectManager") || 'Please select an assigned manager.'); return;
    }

    try {
      if (editingUser) {
        // ── Update existing user ──
        const updateData: Record<string, any> = {
          full_name: formData.full_name,
          phone: formData.phone || null,
          hire_date: formData.hire_date,
          birth_date: formData.birth_date || null,
          sex: formData.sex || null,
          address: formData.address || null,
          city: formData.city || null,
          country: formData.country || null,
          job_title: formData.job_title || null,
          role: formData.role,
          company_id: currentUser?.company_id || null,
          group_id: needsGroup(formData.role) ? (formData.group_id || null) : null,
          department_id: needsDepartment(formData.role) ? (formData.department_id || null) : null,
          team_id: needsTeam(formData.role) ? (formData.team_id || null) : null,
          manager_id: needsManager(formData.role) ? (formData.manager_id || null) : null,
        };

        await UsersService.update(editingUser.id, updateData);

        Swal.fire({ icon: 'success', title: langPackLabel("txtUserUpdatedTitle") || 'User updated', text: langPackLabel("txtUserUpdatedText") || 'User profile has been updated successfully.', timer: 2000, showConfirmButton: false });
      } else {
        // ── Create new user ──
        const createData: Record<string, any> = {
          email: formData.email,
          full_name: formData.full_name,
          phone: formData.phone || null,
          hire_date: formData.hire_date,
          birth_date: formData.birth_date || null,
          sex: formData.sex || null,
          address: formData.address || null,
          city: formData.city || null,
          country: formData.country || null,
          job_title: formData.job_title || null,
          role: formData.role,
          group_id: needsGroup(formData.role) ? (formData.group_id || null) : null,
          department_id: needsDepartment(formData.role) ? (formData.department_id || null) : null,
          team_id: needsTeam(formData.role) ? (formData.team_id || null) : null,
          manager_id: needsManager(formData.role) ? (formData.manager_id || null) : null,
          cached_carryover: parseFloat(initialAnnualBalance) || 0,
        };

        await UsersService.create(createData);

        Swal.fire({ icon: 'success', title: langPackLabel("txtUserCreatedTitle") || 'User created', text: langPackLabel("txtUserCreatedText") || 'New user has been created successfully.', timer: 2000, showConfirmButton: false });
      }

      handleCloseDialog();
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (userId: string, userEmail: string) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: langPackLabel("txtDeleteUserTitle") || 'Delete user?',
      html: `${langPackLabel("txtDeleteUserConfirm") || "Are you sure you want to delete"} <strong>${userEmail}</strong>?`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: langPackLabel("txtDelete") || 'Delete',
    });
    if (result.isConfirmed) {
      try {
        await UsersService.delete(userId);
        fetchUsers();
        Swal.fire({ icon: 'success', title: langPackLabel("txtDeleted") || 'Deleted', text: langPackLabel("txtUserDeletedText") || 'User has been deleted.', timer: 2500, showConfirmButton: false });
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleResetPassword = async (userId: string, userEmail: string) => {
    const result = await Swal.fire({
      icon: 'question',
      title: langPackLabel("txtResetPasswordTitle") || 'Reset password?',
      html: `${langPackLabel("txtResetPasswordConfirm") || "Reset password for"} <strong>${userEmail}</strong> ${langPackLabel("txtResetPasswordDefault") || "to default (Pp123456)?"}`,
      showCancelButton: true,
      confirmButtonText: langPackLabel("txtResetPassword") || 'Reset',
    });
    if (result.isConfirmed) {
      try {
        await UsersService.resetPassword(userId);
        fetchUsers();
        Swal.fire({ icon: 'success', title: langPackLabel("txtPasswordResetTitle") || 'Password reset', text: langPackLabel("txtPasswordResetText") || 'Password reset to Pp123456. User will be prompted to change it on next login.', timer: 2500, showConfirmButton: false });
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const getRoleLabel = (user: User): string => {
    return ROLE_LABELS[user.role] || user.role;
  };

  const getRoleColor = (user: User) => {
    return ROLE_COLORS[user.role] || 'default';
  };

  const stats = {
    totalUsers: users.length,
    incompleteProfiles: users.filter(u => !u.full_name || u.full_name === u.email.split('@')[0]).length,
    pendingPasswordReset: users.filter(u => u.requires_password_change).length,
    admins: users.filter(u => u.role === 'admin').length,
  };

  if (loading) {
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
        <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600 }}>{langPackLabel("txtUserManagement") || "User Management"}</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchUsers}
            size="small"
          >{langPackLabel("txtRefresh") || "Refresh"}</Button>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => handleOpenDialog()}
            size="small"
          >
            {langPackLabel("txtAddNewUser") || "Add User"}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      {/* Stats Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
        {[
          { label: langPackLabel("txtTotalUsers") || "Total", value: stats.totalUsers, color: 'primary.main' },
          { label: langPackLabel("txtAdmins") || "Admins", value: stats.admins, color: 'secondary.main' },
          { label: langPackLabel("txtPendingReset") || "Pending Reset", value: stats.pendingPasswordReset, color: 'warning.main' },
          { label: langPackLabel("txtIncomplete") || "Incomplete", value: stats.incompleteProfiles, color: 'error.main' },
        ].map((s, i) => (
          <Card key={i} sx={{ flex: '1 1 130px', minWidth: 110 }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</Typography>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Search */}
      <TextField
        size="small" fullWidth placeholder={langPackLabel("txtSearch") || "Search users…"}
        value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }} sx={{ mb: 2 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
      />

      {/* Users Table */}
      <Paper sx={{ mb: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><strong>{langPackLabel("txtUser") || "User"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtContact") || "Contact"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtRole") || "Role"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtStatus") || "Status"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtHireDate") || "Hire Date"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtLastLogin") || "Last Login"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtActions") || "Actions"}</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                const filtered = users.filter((u) =>
                  !searchQuery ||
                  u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.role.toLowerCase().includes(searchQuery.toLowerCase())
                );
                const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
                return paginated.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: 12,
                        }}
                      >
                        {user.full_name?.charAt(0).toUpperCase() || 'U'}
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {user.full_name || 'Unnamed User'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          ID: {user.id.substring(0, 8)}...
                        </Typography>
                        {(!user.full_name || user.full_name === user.email.split('@')[0]) && (
                          <Chip
                            label={langPackLabel("txtIncomplete") || "Incomplete"}
                            size="small"
                            color="warning"
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography>{user.email}</Typography>
                    {user.phone && (
                      <Typography variant="body2" color="textSecondary">
                        📱 {user.phone}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getRoleLabel(user)}
                      color={getRoleColor(user)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.requires_password_change ? 'Reset Required' : 'Active'}
                      color={user.requires_password_change ? 'warning' : 'success'}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(user.hire_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() + ' ' + new Date(user.last_login).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(user)}
                        color="primary"
                        title="Edit user"
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleResetPassword(user.id, user.email)}
                        color="warning"
                        title="Reset password"
                      >
                        <LockReset />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(user.id, user.email)}
                        color="error"
                        title="Delete user"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ));
              })()}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={users.filter((u) => !searchQuery || u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()) || u.role.toLowerCase().includes(searchQuery.toLowerCase())).length}
          page={page}
          onPageChange={(_e, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 15, 25, 50]}
        />
      </Paper>

      {/* Create/Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          {editingUser ? (langPackLabel("txtEditUserProfile") || 'Edit User Profile') : (langPackLabel("txtCreateNewUser") || 'Create New User')}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            {!editingUser && (
              <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
                <TextField
                  autoFocus
                  size="small"
                  label={langPackLabel("txtEmailAddress") || "Email Address"}
                  type="email"
                  fullWidth
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <TextField
                  size="small"
                  label={langPackLabel("txtPassword") || "Password"}
                  type="text"
                  fullWidth
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  helperText={langPackLabel("txtDefaultPasswordHelper") || "Default: Pp123456"}
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
              <TextField
                autoFocus={!!editingUser}
                size="small"
                label={langPackLabel("txtFullName") || "Full Name"}
                type="text"
                fullWidth
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
              <TextField
                size="small"
                label={langPackLabel("txtJobTitle") || "Job Title"}
                type="text"
                fullWidth
                value={formData.job_title}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              />
            </Box>

            {editingUser && (
              <Box sx={{ mb: 1.5 }}>
                <TextField
                  size="small"
                  label={langPackLabel("txtEmailAddress") || "Email Address"}
                  type="email"
                  fullWidth
                  disabled
                  value={formData.email}
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
              <TextField
                size="small"
                label={langPackLabel("txtPhone") || "Phone"}
                type="tel"
                fullWidth
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <LocalizedDatePicker
                label={langPackLabel("txtBirthDate") || "Birth Date"}
                value={formData.birth_date}
                onChange={(v) => setFormData({ ...formData, birth_date: v })}
                size="small"
                fullWidth
              />
              <FormControl fullWidth size="small">
                <InputLabel>{langPackLabel("txtSex") || "Sex"}</InputLabel>
                <Select
                  value={formData.sex}
                  label={langPackLabel("txtSex") || "Sex"}
                  onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                >
                  <MenuItem value=""><em>{langPackLabel("txtNone") || "None"}</em></MenuItem>
                  <MenuItem value="male">{langPackLabel("txtMale") || "Male"}</MenuItem>
                  <MenuItem value="female">{langPackLabel("txtFemale") || "Female"}</MenuItem>
                  <MenuItem value="other">{langPackLabel("txtOther") || "Other"}</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ mb: 1.5 }}>
              <TextField
                size="small"
                label={langPackLabel("txtAddress") || "Address"}
                type="text"
                fullWidth
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
              <TextField
                size="small"
                label={langPackLabel("txtCity") || "City"}
                type="text"
                fullWidth
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
              <TextField
                size="small"
                label={langPackLabel("txtCountry") || "Country"}
                type="text"
                fullWidth
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
              <LocalizedDatePicker
                label={langPackLabel("txtHireDate") || "Hire Date"}
                value={formData.hire_date}
                onChange={(v) => setFormData({ ...formData, hire_date: v })}
                size="small"
                fullWidth
                required
              />
              {!editingUser && (
                <TextField
                  size="small"
                  label={langPackLabel("txtAnnualLeaveCarryover") || "Annual Leave Carryover (days)"}
                  type="number"
                  fullWidth
                  value={initialAnnualBalance}
                  onChange={(e) => setInitialAnnualBalance(e.target.value)}
                  helperText={langPackLabel("txtCarryoverHelperText") || "From previous system. Negative for deficit."}
                  slotProps={{ htmlInput: { step: 0.5 } }}
                />
              )}
            </Box>

            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>
              {langPackLabel("txtRoleAndOrganization") || "Role & Organization"}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
              {/* Role Select - filtered by hierarchy */}
              <FormControl fullWidth size="small">
                <InputLabel>{langPackLabel("txtRole") || "Role"}</InputLabel>
                <Select
                  value={formData.role}
                  label={langPackLabel("txtRole") || "Role"}
                  onChange={(e) => {
                    const newRole = e.target.value as UserRole;
                    setFormData((prev) => ({
                      ...prev,
                      role: newRole,
                      group_id: needsGroup(newRole) ? prev.group_id : '',
                      department_id: needsDepartment(newRole) ? prev.department_id : '',
                      team_id: needsTeam(newRole) ? prev.team_id : '',
                      manager_id: newRole !== 'admin' && newRole !== 'supervisor' ? '' : '',
                    }));
                  }}
                  required
                >
                  <MenuItem value="staff">{langPackLabel("txtStaff") || "Staff"}</MenuItem>
                  {hp !== 'flat' && <MenuItem value="manager">{langPackLabel("txtManager") || "Manager"}</MenuItem>}
                  {(hp === 'departments' || hp === 'groups') && <MenuItem value="department_manager">{langPackLabel("txtDeptManagers") || "Department Manager"}</MenuItem>}
                  {hp === 'groups' && <MenuItem value="group_manager">{langPackLabel("txtGroupManagers") || "Group Manager"}</MenuItem>}
                  <MenuItem value="admin">{langPackLabel("txtAdmins") || "Admin"}</MenuItem>
                </Select>
              </FormControl>

              {/* Group Dropdown */}
              {needsGroup(formData.role) && (
                <FormControl fullWidth size="small" required>
                  <InputLabel>{langPackLabel("txtGroup") || "Group"} *</InputLabel>
                  <Select
                    value={formData.group_id}
                    label={`${langPackLabel("txtGroup") || "Group"} *`}
                    onChange={(e) => handleGroupChange(e.target.value as string)}
                    required
                  >
                    {groups.map((group) => (
                      <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
              {/* Department Dropdown */}
              {needsDepartment(formData.role) && (
                <FormControl fullWidth size="small" disabled={hp === 'groups' && !formData.group_id} required>
                  <InputLabel>{langPackLabel("txtDepartment") || "Department"} *</InputLabel>
                  <Select
                    value={formData.department_id}
                    label={`${langPackLabel("txtDepartment") || "Department"} *`}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value as string })}
                    required
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Team Dropdown */}
              {needsTeam(formData.role) && (
                <FormControl fullWidth size="small" disabled={(hp === 'groups' || hp === 'departments') && !formData.department_id} required>
                  <InputLabel>{langPackLabel("txtTeam") || "Team"} *</InputLabel>
                  <Select
                    value={formData.team_id}
                    label={`${langPackLabel("txtTeam") || "Team"} *`}
                    onChange={(e) => setFormData({ ...formData, team_id: e.target.value as string })}
                    required
                  >
                    {teams.map((team) => (
                      <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Manager Dropdown */}
              {needsManager(formData.role) && (
                <FormControl fullWidth size="small" required>
                  <InputLabel>{langPackLabel("txtAssignedManager") || "Assigned Manager"} *</InputLabel>
                  <Select
                    value={formData.manager_id}
                    label={`${langPackLabel("txtAssignedManager") || "Assigned Manager"} *`}
                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value as string })}
                    required
                  >
                    {filteredManagers
                      .filter((m) => m.id !== editingUser?.id)
                      .map((manager) => (
                        <MenuItem key={manager.id} value={manager.id}>
                          {manager.full_name || manager.email}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{langPackLabel("txtCancel") || "Cancel"}</Button>
            <Button type="submit" variant="contained">
              {editingUser ? (langPackLabel("txtUpdateProfile") || 'Update Profile') : (langPackLabel("txtCreateUser") || 'Create User')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add User Instructions Dialog */}
      <Dialog open={showInstructions} onClose={() => setShowInstructions(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PersonAdd color="primary" />
            <Typography variant="h6">{langPackLabel("txtHowToAddUser") || "How to Add a New User"}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              {langPackLabel("txtUserCreationTwoSteps") || "User creation requires two steps due to security restrictions."}
            </Alert>

            <Typography variant="h6" sx={{ mt: 3, mb: 2, color: 'primary.main' }}>
              {langPackLabel("txtStep1RegisterUser") || "Step 1: Register the User"}
            </Typography>

            <Box sx={{ pl: 2 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {langPackLabel("txtStep1Instruction1") || '1. Ask the new user to go to the Sign Up page'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {langPackLabel("txtStep1Instruction2") || '2. Enter their email and a password (default: Pp123456)'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {langPackLabel("txtStep1Instruction3") || '3. Click "Sign Up" to create their account'}
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" sx={{ mt: 3, mb: 2, color: 'primary.main' }}>
              {langPackLabel("txtStep2CompleteProfile") || "Step 2: Complete Profile in This App"}
            </Typography>

            <Box sx={{ pl: 2 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {langPackLabel("txtStep2Instruction1") || "1. Ask the user to log in once with their credentials"}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {langPackLabel("txtStep2Instruction2") || "2. Their profile will be created automatically"}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {langPackLabel("txtStep2Instruction3") || '3. Come back to this page and refresh the list'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {langPackLabel("txtStep2Instruction4") || '4. Click "Edit" on the new user to set:'}
              </Typography>
              <Box sx={{ pl: 3 }}>
                <Typography variant="body2">• {langPackLabel("txtFullName") || "Full name"}</Typography>
                <Typography variant="body2">• {langPackLabel("txtPhone") || "Phone number"}</Typography>
                <Typography variant="body2">• {langPackLabel("txtHireDate") || "Hire date"}</Typography>
                <Typography variant="body2">• {langPackLabel("txtRole") || "Role"}</Typography>
                <Typography variant="body2">• {langPackLabel("txtCompany") || "Company"}, {langPackLabel("txtGroup") || "Group"}, {langPackLabel("txtDepartment") || "Department"}</Typography>
                <Typography variant="body2">• {langPackLabel("txtAssignedManager") || "Assigned Manager"}</Typography>
              </Box>
            </Box>

            <Alert severity="success" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>{langPackLabel("txtTip") || "Tip"}:</strong> {langPackLabel("txtSelfRegisterTip") || "Users can self-register too! They just need to:"}
                <ol>
                  <li>{langPackLabel("txtTipStep1") || "Go to the login page"}</li>
                  <li>{langPackLabel("txtTipStep2") || 'Click "Sign up" (if available)'}</li>
                  <li>{langPackLabel("txtTipStep3") || "Use their email and set a password"}</li>
                  <li>{langPackLabel("txtTipStep4") || "Their profile will auto-create with default settings"}</li>
                </ol>
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInstructions(false)} variant="contained">
            {langPackLabel("txtGotIt") || "Got it!"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Footer Actions */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="textSecondary">
              {langPackLabel("txtNeedHelp") || "Need Help?"}
              <Button
                variant="text"
                onClick={() => setShowInstructions(true)}
                size="small"
              >
                {langPackLabel("txtViewUserCreationGuide") || "View User Creation Guide"}
              </Button>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Users;
