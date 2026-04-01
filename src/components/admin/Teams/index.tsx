// src/components/admin/Teams/index.tsx
import React, { useState, useEffect } from 'react';
import { useAutoClearing } from '../../../hooks/useAutoClearing';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import {
  fetchGroups,
  fetchDepartments,
  fetchTeams,
  fetchHierarchyProfile,
  createTeam,
  updateTeam,
  deleteTeam,
  clearOrganizationError,
} from '../../../store/slices/organizationSlice';
import { Team } from '../../../types';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, CircularProgress,
  Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Add, Edit, Delete, Refresh, Groups } from '@mui/icons-material';
import { useLanguage } from '../../../contexts/LanguageContext';

const Teams: React.FC = () => {
  const { langPackLabel } = useLanguage();
  const dispatch = useDispatch<AppDispatch>();
  const { departments, teams, groups, loading, hierarchyProfile } = useSelector((state: RootState) => state.organization);
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const hp = hierarchyProfile || 'flat';
  const showDeptColumn = hp === 'groups' || hp === 'departments';
  const showGroupColumn = hp === 'groups';

  const [error, setError] = useAutoClearing(7000);
  const [filterDeptId, setFilterDeptId] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [dialogGroupId, setDialogGroupId] = useState('');

  // Departments filtered by selected group in the dialog
  const dialogDepartments = dialogGroupId
    ? departments.filter((d) => d.group_id === dialogGroupId)
    : departments;

  useEffect(() => {
    if (currentUser?.company_id) {
      dispatch(fetchGroups(currentUser.company_id));
      dispatch(fetchHierarchyProfile(currentUser.company_id));
    }
    dispatch(fetchDepartments(undefined));
    dispatch(fetchTeams(undefined));
  }, [dispatch, currentUser]);

  const filteredTeams = filterDeptId
    ? teams.filter((t) => t.department_id === filterDeptId)
    : teams;

  const getDeptName = (deptId: string) =>
    departments.find((d) => d.id === deptId)?.name || 'Unknown';

  const getGroupName = (deptId: string) => {
    const dept = departments.find((d) => d.id === deptId);
    if (!dept) return '';
    return groups.find((g) => g.id === dept.group_id)?.name || '';
  };

  const handleOpenDialog = (team?: Team) => {
    if (team) {
      setEditingTeam(team);
      setName(team.name);
      setDepartmentId(team.department_id || '');
      // Find the group for this team's department
      const dept = departments.find((d) => d.id === team.department_id);
      setDialogGroupId(dept?.group_id || '');
    } else {
      setEditingTeam(null);
      setName('');
      setDepartmentId(filterDeptId || '');
      setDialogGroupId('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTeam(null);
    setName('');
    setDepartmentId('');
    setDialogGroupId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTeam) {
        await dispatch(updateTeam({ id: editingTeam.id, name, departmentId: departmentId || undefined })).unwrap();
      } else {
        await dispatch(createTeam({ name, departmentId: departmentId || undefined, companyId: currentUser?.company_id })).unwrap();
      }
      handleCloseDialog();
    } catch (err: any) {
      setError(typeof err === 'string' ? err : err.message || langPackLabel("txtSomethingWentWrong") || 'An error occurred');
    }
  };

  const handleDeleteClick = (team: Team) => {
    setDeletingTeam(team);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTeam) return;
    try {
      await dispatch(deleteTeam(deletingTeam.id)).unwrap();
    } catch (err: any) {
      setError(typeof err === 'string' ? err : err.message || langPackLabel("txtSomethingWentWrong") || 'An error occurred');
    }
    setDeleteConfirmOpen(false);
    setDeletingTeam(null);
  };

  const handleRefresh = () => {
    setError(null);
    dispatch(clearOrganizationError());
    if (currentUser?.company_id) dispatch(fetchGroups(currentUser.company_id));
    dispatch(fetchDepartments(undefined));
    dispatch(fetchTeams(undefined));
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  if (loading && teams.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600 }}>
          {langPackLabel("txtTeamsManagement") || "Teams Management"}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" startIcon={<Refresh />} onClick={handleRefresh}>{langPackLabel("txtRefresh") || "Refresh"}</Button>
          <Button variant="contained" size="small" startIcon={<Add />} onClick={() => handleOpenDialog()}>{langPackLabel("txtAddTeam") || "Add Team"}</Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

      {showDeptColumn && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 250 }}>
            <InputLabel>{langPackLabel("txtFilterByDepartment") || "Filter by Department"}</InputLabel>
            <Select value={filterDeptId} label={langPackLabel("txtFilterByDepartment") || "Filter by Department"} onChange={(e) => setFilterDeptId(e.target.value)}>
              <MenuItem value="">{langPackLabel("txtAllDepartments") || "All Departments"}</MenuItem>
              {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Paper>
      )}

      <Paper sx={{ mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>{langPackLabel("txtName") || "Name"}</strong></TableCell>
                {showGroupColumn && <TableCell><strong>{langPackLabel("txtGroup") || "Group"}</strong></TableCell>}
                {showDeptColumn && <TableCell><strong>{langPackLabel("txtDepartment") || "Department"}</strong></TableCell>}
                <TableCell><strong>{langPackLabel("txtCreatedAt") || "Created At"}</strong></TableCell>
                <TableCell><strong>{langPackLabel("txtActions") || "Actions"}</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTeams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2 + (showGroupColumn ? 1 : 0) + (showDeptColumn ? 1 : 0)} align="center">
                    <Box sx={{ py: 4 }}>
                      <Groups sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                      <Typography color="text.secondary">{langPackLabel("txtNoTeamsYet") || 'No teams yet. Click "Add Team" to get started.'}</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeams.map((team) => (
                  <TableRow key={team.id} hover>
                    <TableCell><Typography fontWeight="medium">{team.name}</Typography></TableCell>
                    {showGroupColumn && <TableCell>{getGroupName(team.department_id)}</TableCell>}
                    {showDeptColumn && <TableCell>{getDeptName(team.department_id)}</TableCell>}
                    <TableCell>{formatDate(team.created_at)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size="small" onClick={() => handleOpenDialog(team)} color="primary"><Edit /></IconButton>
                        <IconButton size="small" onClick={() => handleDeleteClick(team)} color="error"><Delete /></IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTeam ? (langPackLabel("txtEditTeam") || 'Edit Team') : (langPackLabel("txtAddNewTeam") || 'Add New Team')}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField autoFocus margin="dense" label={langPackLabel("txtTeamName") || "Team Name"} fullWidth required value={name} onChange={(e) => setName(e.target.value)} />
            {showGroupColumn && (
              <FormControl fullWidth margin="dense" required>
                <InputLabel>{langPackLabel("txtGroup") || "Group"}</InputLabel>
                <Select value={dialogGroupId} label="Group" onChange={(e) => {
                  setDialogGroupId(e.target.value);
                  setDepartmentId(''); // reset department when group changes
                }}>
                  {groups.map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            {showDeptColumn && (
              <FormControl fullWidth margin="dense" required disabled={showGroupColumn && !dialogGroupId}>
                <InputLabel>{langPackLabel("txtDepartment") || "Department"}</InputLabel>
                <Select value={departmentId} label="Department" onChange={(e) => setDepartmentId(e.target.value)}>
                  {dialogDepartments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>{langPackLabel("txtCancel") || "Cancel"}</Button>
            <Button type="submit" variant="contained" disabled={!name || (showDeptColumn && !departmentId)}>{editingTeam ? (langPackLabel("txtUpdateProfile") || 'Update') : (langPackLabel("txtCreate") || 'Create')}</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => { setDeleteConfirmOpen(false); setDeletingTeam(null); }}>
        <DialogTitle>{langPackLabel("txtConfirmDelete") || "Confirm Delete"}</DialogTitle>
        <DialogContent>
          <Typography>{langPackLabel("txtDeleteTeamConfirm") || 'Are you sure you want to delete the team'} "{deletingTeam?.name}"? {langPackLabel("txtCannotBeUndone") || "This action cannot be undone."}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteConfirmOpen(false); setDeletingTeam(null); }}>{langPackLabel("txtCancel") || "Cancel"}</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">{langPackLabel("txtDelete") || "Delete"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Teams;
