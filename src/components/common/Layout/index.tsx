// src/components/common/Layout/index.tsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../../store/slices/authSlice";
import { fetchHierarchyProfile, resetOrganizationState } from "../../../store/slices/organizationSlice";
import { resetLeaveState } from "../../../store/slices/leaveSlice";
import { resetUserState } from "../../../store/slices/userSlice";
import { RootState, AppDispatch } from "../../../store";
import { useLanguage } from "../../../contexts/LanguageContext";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  CalendarToday,
  Settings,
  Logout,
  ChevronLeft,
  ChevronRight,
  PostAdd,
  History,
  EventNote,
  CheckCircle,
  Groups,
  BeachAccess,
  AccountBalance,
  Business,
  MenuBook,
  Diversity3,
  EventBusy,
  CorporateFare,
  GroupWork,
  Translate,
} from "@mui/icons-material";

const drawerWidth = 220;

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { langPackLabel } = useLanguage();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { hierarchyProfile } = useSelector((state: RootState) => state.organization);

  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Fetch hierarchy profile (and workday config) on mount for all users
  useEffect(() => {
    if (user?.company_id) {
      dispatch(fetchHierarchyProfile(user.company_id));
    }
  }, [dispatch, user?.company_id]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await dispatch(logout());
    dispatch(resetOrganizationState());
    dispatch(resetLeaveState());
    dispatch(resetUserState());
    navigate("/login");
    handleMenuClose();
  };

  const handleProfile = () => {
    navigate("/profile");
    handleMenuClose();
  };

  interface MenuSection {
    header: string;
    items: { text: string; icon: React.ReactNode; path: string }[];
  }

  const getMenuSections = (): MenuSection[] => {
    const sections: MenuSection[] = [];
    const role = user?.role;

    // Supervisor items — visible to supervisor role
    if (role === 'supervisor') {
      sections.push({
        header: langPackLabel("txtNavDashboard") || "Supervisor",
        items: [
          { text: langPackLabel("txtNavDashboard") || "Dashboard", icon: <Dashboard />, path: "/supervisor/dashboard" },
          { text: langPackLabel("txtNavCompanies") || "Companies", icon: <Business />, path: "/supervisor/dashboard" },
          { text: langPackLabel("txtNavLabelManagement") || "Label Management", icon: <Translate />, path: "/supervisor/labels" },
        ],
      });
    }

    // Staff items — visible to staff role
    if (role === 'staff') {
      sections.push({
        header: langPackLabel("txtStaff") || "Staff",
        items: [
          { text: langPackLabel("txtNavDashboard") || "Dashboard", icon: <Dashboard />, path: "/staff/dashboard" },
          { text: langPackLabel("txtNavRequestLeave") || "Request Leave", icon: <PostAdd />, path: "/staff/request" },
          { text: langPackLabel("txtNavLeaveHistory") || "Leave History", icon: <History />, path: "/staff/history" },
          { text: langPackLabel("txtNavCalendar") || "Calendar", icon: <EventNote />, path: "/staff/calendar" },
        ],
      });
    }

    // Manager items — visible to managers
    if (role === 'manager') {
      sections.push({
        header: langPackLabel("txtManager") || "Manager",
        items: [
          { text: langPackLabel("txtNavDashboard") || "Dashboard", icon: <Dashboard />, path: "/manager/dashboard" },
          { text: langPackLabel("txtNavRequestLeave") || "Request Leave", icon: <PostAdd />, path: "/staff/request" },
          { text: langPackLabel("txtNavLeaveHistory") || "Leave History", icon: <History />, path: "/staff/history" },
          { text: langPackLabel("txtNavApprovals") || "Approvals", icon: <CheckCircle />, path: "/manager/approvals" },
          { text: langPackLabel("txtNavTeamView") || "Team View", icon: <Groups />, path: "/manager/team" },
          { text: langPackLabel("txtNavTeamBalances") || "Team Balances", icon: <AccountBalance />, path: "/manager/balances" },
        ],
      });
    }

    // Group Manager items — visible to group managers
    if (role === 'group_manager') {
      sections.push({
        header: langPackLabel("txtGroupManagers") || "Group Manager",
        items: [
          { text: langPackLabel("txtNavDashboard") || "Dashboard", icon: <Dashboard />, path: "/group-manager/dashboard" },
          { text: langPackLabel("txtNavRequestLeave") || "Request Leave", icon: <PostAdd />, path: "/staff/request" },
          { text: langPackLabel("txtNavLeaveHistory") || "Leave History", icon: <History />, path: "/staff/history" },
          { text: langPackLabel("txtNavGroupApprovals") || "Group Approvals", icon: <CheckCircle />, path: "/group-manager/approvals" },
          { text: langPackLabel("txtNavGroupTeamView") || "Group Team View", icon: <Groups />, path: "/group-manager/team" },
          { text: langPackLabel("txtNavGroupBalances") || "Group Balances", icon: <AccountBalance />, path: "/group-manager/balances" },
        ],
      });
    }

    // Department Manager items — visible to department managers
    if (role === 'department_manager') {
      sections.push({
        header: langPackLabel("txtDeptManagers") || "Department Manager",
        items: [
          { text: langPackLabel("txtNavDashboard") || "Dashboard", icon: <Dashboard />, path: "/department-manager/dashboard" },
          { text: langPackLabel("txtNavRequestLeave") || "Request Leave", icon: <PostAdd />, path: "/staff/request" },
          { text: langPackLabel("txtNavLeaveHistory") || "Leave History", icon: <History />, path: "/staff/history" },
          { text: langPackLabel("txtNavApprovals") || "Approvals", icon: <CheckCircle />, path: "/department-manager/approvals" },
          { text: langPackLabel("txtNavTeamCalendar") || "Team Calendar", icon: <EventNote />, path: "/department-manager/team" },
          { text: langPackLabel("txtBalances") || "Balances", icon: <AccountBalance />, path: "/department-manager/balances" },
        ],
      });
    }

    // Admin items — visible to admins, hierarchy-aware
    if (role === 'admin') {
      const hp = hierarchyProfile || 'flat';
      const showGroups = hp === 'groups';
      const showDepartments = hp === 'groups' || hp === 'departments';
      const showTeams = hp !== 'flat'; // teams, departments, groups all show teams

      const adminItems: { text: string; icon: React.ReactNode; path: string }[] = [
        { text: langPackLabel("txtNavDashboard") || "Dashboard", icon: <Dashboard />, path: "/" },
        { text: langPackLabel("txtNavApprovals") || "Approvals", icon: <CheckCircle />, path: "/admin/approvals" },
        { text: langPackLabel("txtNavTeamCalendar") || "Team Calendar", icon: <EventNote />, path: "/admin/calendar" },
        { text: langPackLabel("txtNavUserManagement") || "User Management", icon: <People />, path: "/admin/users" },
      ];

      if (showGroups) adminItems.push({ text: langPackLabel("txtNavGroups") || "Groups", icon: <Diversity3 />, path: "/admin/groups" });
      if (showDepartments) adminItems.push({ text: langPackLabel("txtNavDepartments") || "Departments", icon: <CorporateFare />, path: "/admin/departments" });
      if (showTeams) adminItems.push({ text: langPackLabel("txtNavTeams") || "Teams", icon: <GroupWork />, path: "/admin/teams" });

      adminItems.push(
        { text: langPackLabel("txtNavLeaveTypes") || "Leave Types", icon: <CalendarToday />, path: "/admin/leave-types" },
        { text: langPackLabel("txtNavHolidays") || "Holidays", icon: <BeachAccess />, path: "/admin/holidays" },
        { text: langPackLabel("txtNavCollectiveLeave") || "Collective Leave", icon: <EventBusy />, path: "/admin/collective-leave" },
        // { text: "Reports", icon: <Assessment />, path: "/admin/reports" }, // Hidden for now — later development
        { text: langPackLabel("txtNavSettings") || "Settings", icon: <Settings />, path: "/admin/settings" },
        { text: langPackLabel("txtNavAppManual") || "App Manual", icon: <MenuBook />, path: "/admin/guide" },
      );

      sections.push({ header: langPackLabel("txtAdmins") || "Admin", items: adminItems });
    }

    return sections;
  };

  const drawer = (
    <Box sx={{ overflow: "auto", height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1 }}>
        <Box
          component="img"
          src={`${process.env.PUBLIC_URL}/logos/logo.png`}
          alt="Cloud4Feed Absenta"
          sx={{ height: 28, borderRadius: '6px' }}
        />
        <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 600, color: 'text.primary' }}>
          Cloud4Feed Absenta
        </Typography>
        <IconButton onClick={handleDrawerToggle} size="small">
          {theme.direction === "rtl" ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Toolbar>
      <Divider />
      <Box sx={{ flex: 1, py: 0.5 }}>
        {getMenuSections().map((section, index) => (
          <React.Fragment key={section.header}>
            {index > 0 && <Divider sx={{ my: 0.5 }} />}
            <List
              dense
              subheader={
                <ListSubheader
                  component="div"
                  sx={{
                    lineHeight: "32px",
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'text.secondary',
                    background: 'transparent',
                  }}
                >
                  {section.header}
                </ListSubheader>
              }
            >
              {section.items.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    onClick={() => {
                      navigate(item.path);
                      if (isMobile) setDrawerOpen(false);
                    }}
                    sx={{ py: 0.6 }}
                  >
                    <ListItemIcon sx={{ fontSize: '1.2rem' }}>{item.icon}</ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: 500 }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            component="img"
            src={`${process.env.PUBLIC_URL}/logos/logo_white.png`}
            alt="Cloud4Feed Absenta"
            sx={{
              height: 38, mr: 1.5,}}
          />
          <Typography variant="h4" sx={{ flexGrow: 1, fontWeight: 600, letterSpacing: '-0.01em', }}>
            Cloud4Feed Absenta
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, opacity: 0.9, display: { xs: 'none', sm: 'block' } }}>{user?.full_name}</Typography>
            <IconButton onClick={handleMenuOpen} size="small">
              <Avatar sx={{ width: 34, height: 34, fontSize: '1rem' }}>
                {user?.full_name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleProfile}>
              <ListItemIcon>
                <People fontSize="small" />
              </ListItemIcon>
              {langPackLabel("txtProfile") || "Profile"}
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              {langPackLabel("txtLogout") || "Logout"}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 2, md: 3 },
          width: '100%',
          marginTop: "64px",
          minHeight: "calc(100vh - 64px)",
          backgroundColor: theme.palette.background.default,
          overflow: 'hidden',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
