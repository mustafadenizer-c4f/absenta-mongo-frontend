// src/components/admin/UserGuide.tsx — Full Application Manual
import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useLanguage } from '../../contexts/LanguageContext';

const Section: React.FC<{ title: string; defaultExpanded?: boolean; children: React.ReactNode }> = ({
  title, defaultExpanded = false, children,
}) => (
  <Accordion defaultExpanded={defaultExpanded} sx={{ mb: 1 }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography variant="h6" fontWeight={600}>{title}</Typography>
    </AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>
);

const RoleChip: React.FC<{ label: string }> = ({ label }) => (
  <Chip label={label} size="small" color="primary" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
);

const UserGuide: React.FC = () => {
  const { langPackLabel } = useLanguage();
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1, color: 'primary.main', fontWeight: 600 }}>
        {langPackLabel("txtAppManual") || "Absenta — Application Manual"}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Complete guide for all roles and features in the Absenta leave management system.
      </Typography>

      {/* ── Quick Start ── */}
      <Section title="🚀 Quick Start Guide" defaultExpanded>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Follow these steps in order when setting up your company for the first time.
          The order matters — each step depends on the previous one.
        </Typography>

        <Alert severity="warning" sx={{ mb: 2 }}>
          {langPackLabel("txtQuickStartOrderWarning") || "Complete these steps in order. For example, you cannot assign a user to a team that doesn't exist yet, or set a manager who hasn't been created."}
        </Alert>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Step 1: Choose Your Hierarchy</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Go to <strong>Settings → Organization</strong> and select your hierarchy profile (Flat, Teams, Departments, or Groups).
          This determines which organizational levels are available. You can upgrade later but not downgrade.
        </Typography>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Step 2: Create Organizational Structure</Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Build your structure top-down based on your chosen hierarchy:
        </Typography>
        <List dense>
          <ListItem><ListItemText primary="Groups profile → Create Groups first, then Departments inside them, then Teams inside departments" /></ListItem>
          <ListItem><ListItemText primary="Departments profile → Create Departments first, then Teams inside them" /></ListItem>
          <ListItem><ListItemText primary="Teams profile → Create Teams directly" /></ListItem>
          <ListItem><ListItemText primary="Flat profile → Skip this step, no structure needed" /></ListItem>
        </List>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Step 3: Review Leave Types</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Default leave types are created automatically. Go to <strong>Leave Types</strong> to review, edit, or add new ones before creating users.
        </Typography>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Step 4: Add Holidays</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Go to <strong>Holidays</strong> and add your company's public holidays. Do this before employees start requesting leave so day calculations are accurate from the start.
        </Typography>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Step 5: Create Managers First</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Go to <strong>Users</strong> and create your managers (team managers, group managers, department managers) <strong>before</strong> creating staff.
          This way, when you create staff members, you can immediately assign them to the correct manager.
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          {langPackLabel("txtQuickStartManagerTip") || "Tip: Create users in this order — department/group managers → team managers → staff. Each level needs a manager from the level above."}
        </Alert>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Step 6: Create Staff Members</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Now create your staff. For each user, set their team, manager, hire date, and birth date.
          The default password is <strong>Pp123456</strong> — users must change it on first login.
        </Typography>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Step 7: Configure Workdays (Optional)</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Go to <strong>Settings → Workdays</strong> to configure which days are working days, legal workdays (deducted from leave but not worked), and rest days. Default is Mon–Fri working, Saturday legal.
        </Typography>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Step 8: Set Up Email (Optional)</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Go to <strong>Settings → Email</strong> to configure SMTP for email notifications (leave submissions, approvals, rejections). You can skip this and set it up later.
        </Typography>

        <Alert severity="success" sx={{ mt: 1 }}>
          {langPackLabel("txtQuickStartDone") || "That's it! Your company is ready. Employees can now log in, request leave, and managers can approve them."}
        </Alert>
      </Section>

      {/* ── Overview ── */}
      <Section title="1. Overview" defaultExpanded>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Absenta is a leave management application that supports multiple organizational hierarchies
          and roles. It handles leave requests, approvals, balance tracking, collective leave, and
          team calendars.
        </Typography>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Supported Roles</Typography>
        <List dense>
          <ListItem><ListItemText primary="Staff" secondary="Regular employees — request leave, view balances and history" /></ListItem>
          <ListItem><ListItemText primary="Manager (Team Manager)" secondary="Manages direct reports — approves leave, views team calendar and balances" /></ListItem>
          <ListItem><ListItemText primary="Group Manager" secondary="Manages a group of teams — approves leave for group members, views group-wide data" /></ListItem>
          <ListItem><ListItemText primary="Department Manager" secondary="Manages an entire department — approves leave, views all teams and balances in the department" /></ListItem>
          <ListItem><ListItemText primary="Admin" secondary="Full system access — manages users, leave types, holidays, collective leave, settings, and company-wide calendar" /></ListItem>
          <ListItem><ListItemText primary="Supervisor" secondary="Super-admin — manages multiple companies" /></ListItem>
        </List>
      </Section>

      {/* ── Staff Features ── */}
      <Section title="2. Staff Features">
        <Box sx={{ mb: 1 }}><RoleChip label="Staff" /><RoleChip label="Manager" /><RoleChip label="Group Manager" /><RoleChip label="Department Manager" /></Box>
        <Typography variant="body2" sx={{ mb: 2 }}>
          All employees (including managers) have access to these personal features.
        </Typography>

        <Typography variant="subtitle2" fontWeight={600}>{langPackLabel("txtDashboard") || "Dashboard"}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Shows your personal leave balances (Annual, Casual, Sick always visible; other types shown if used).
          Annual leave entitlement is calculated based on Turkish labor law using your hire date and seniority.
        </Typography>

        <Typography variant="subtitle2" fontWeight={600}>{langPackLabel("txtRequestLeave") || "Request Leave"}</Typography>
        <List dense>
          <ListItem><ListItemText primary="Select leave type, start/end dates, and optionally a reason" /></ListItem>
          <ListItem><ListItemText primary="Half-day leave is supported (morning or afternoon)" /></ListItem>
          <ListItem><ListItemText primary="Weekends and public holidays are automatically excluded from the day count" /></ListItem>
          <ListItem><ListItemText primary="Your remaining balance is shown before submission" /></ListItem>
        </List>

        <Typography variant="subtitle2" fontWeight={600}>{langPackLabel("txtLeaveHistory") || "Leave History"}</Typography>
        <List dense>
          <ListItem><ListItemText primary="View all your past and current leave requests" /></ListItem>
          <ListItem><ListItemText primary="Filter by status, leave type, and date range" /></ListItem>
          <ListItem><ListItemText primary="Cancel pending requests using the cancel button" /></ListItem>
        </List>

        <Typography variant="subtitle2" fontWeight={600}>{langPackLabel("txtCalendar") || "Calendar"}</Typography>
        <Typography variant="body2">
          Personal calendar showing your approved/pending leave and company holidays.
          Supports month, week, day views and a 3-month overview.
        </Typography>
      </Section>

      {/* ── Manager Features ── */}
      <Section title="3. Manager Features">
        <Box sx={{ mb: 1 }}><RoleChip label="Manager" /></Box>

        <Typography variant="subtitle2" fontWeight={600}>Approvals</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          View and approve/reject leave requests from your direct reports.
          Each request shows the employee name, dates, leave type, and remaining balance.
        </Typography>

        <Typography variant="subtitle2" fontWeight={600}>Team View (Calendar)</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Calendar showing all direct reports' leave. Filter by team or individual employee.
          Conflict dates (2+ members off) are highlighted in red.
        </Typography>

        <Typography variant="subtitle2" fontWeight={600}>Team Balances</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Table showing leave balances for all direct reports. Click on a balance cell to see
          individual request details. Only leave types that are actively used are shown as columns.
        </Typography>

        <Typography variant="subtitle2" fontWeight={600}>Leave History (Team)</Typography>
        <Typography variant="body2">
          Managers see their own leave plus their team's leave in the Leave History page.
          Use the Team filter to view a specific team, and the Employee filter to narrow down
          to a specific person or "Only Team" (excludes your own requests).
        </Typography>
      </Section>

      {/* ── Group Manager Features ── */}
      <Section title="4. Group Manager Features">
        <Box sx={{ mb: 1 }}><RoleChip label="Group Manager" /></Box>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Same as Manager features but scoped to all members in the group (across multiple teams).
        </Typography>
        <List dense>
          <ListItem><ListItemText primary="Group Approvals — approve/reject leave for all group members" /></ListItem>
          <ListItem><ListItemText primary="Group Team View — calendar with team filter for all group members" /></ListItem>
          <ListItem><ListItemText primary="Group Balances — balance table for all group members" /></ListItem>
          <ListItem><ListItemText primary="Leave History — see group members' leave with team and employee filters" /></ListItem>
        </List>
      </Section>

      {/* ── Department Manager Features ── */}
      <Section title="5. Department Manager Features">
        <Box sx={{ mb: 1 }}><RoleChip label="Department Manager" /></Box>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Same as Manager features but scoped to the entire department (all teams within the department).
        </Typography>
        <List dense>
          <ListItem><ListItemText primary="Approvals — approve/reject leave for all department staff" /></ListItem>
          <ListItem><ListItemText primary="Team Calendar — calendar with team filter for all department members, includes holidays" /></ListItem>
          <ListItem><ListItemText primary="Balances — balance table for all department members with team filter" /></ListItem>
          <ListItem><ListItemText primary="Leave History — see department members' leave with team and employee filters" /></ListItem>
        </List>
      </Section>

      {/* ── Admin Features ── */}
      <Section title="6. Admin Features">
        <Box sx={{ mb: 1 }}><RoleChip label="Admin" /></Box>

        <Typography variant="subtitle2" fontWeight={600}>{langPackLabel("txtUserManagement") || "User Management"}</Typography>
        <List dense>
          <ListItem><ListItemText primary="Add new users: register via the signup page, then edit profile in User Management" /></ListItem>
          <ListItem><ListItemText primary="Edit user profiles: name, role, hire date, birth date, team, group, department, manager" /></ListItem>
          <ListItem><ListItemText primary="Default temporary password for new users: Pp123456 (must be changed on first login)" /></ListItem>
        </List>

        <Typography variant="subtitle2" fontWeight={600}>Organization Structure</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Depending on the hierarchy profile (flat, teams, departments, groups), you can manage
          Teams, Departments, and Groups from the sidebar. Assign users to the appropriate
          organizational units.
        </Typography>

        <Typography variant="subtitle2" fontWeight={600}>{langPackLabel("txtLeaveTypes") || "Leave Types"}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Create and manage leave types (e.g., Annual Leave, Sick Leave, Casual Leave).
          Each type has a name, default days, color code, and active/inactive status.
        </Typography>

        <Typography variant="subtitle2" fontWeight={600}>{langPackLabel("txtHolidays") || "Holidays"}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Define company holidays. These are automatically excluded when calculating leave days.
          Holidays can be single-day or multi-day, and optionally recurring.
        </Typography>

        <Typography variant="subtitle2" fontWeight={600}>{langPackLabel("txtCollectiveLeave") || "Collective Leave"}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Schedule company-wide leave days (e.g., bridge days). This automatically creates
          approved leave requests for all eligible employees and deducts from their annual balance.
          Duplicate prevention is built in — the same date range won't be applied twice.
        </Typography>

        <Typography variant="subtitle2" fontWeight={600}>{langPackLabel("txtTeamCalendar") || "Team Calendar"}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Company-wide calendar showing all employees' leave. Filter by team or individual employee.
        </Typography>

        <Typography variant="subtitle2" fontWeight={600}>{langPackLabel("txtSettings") || "Settings"}</Typography>
        <Typography variant="body2">
          Configure company settings and organizational hierarchy profile.
        </Typography>
      </Section>

      {/* ── Turkish Annual Leave Law ── */}
      <Section title="7. Turkish Annual Leave Law (Entitlement Calculation)">
        <Typography variant="body2" sx={{ mb: 2 }}>
          Annual leave entitlement is automatically calculated based on Turkish Labor Law (Article 53).
        </Typography>
        <List dense>
          <ListItem><ListItemText primary="1–5 years of service → 14 days" /></ListItem>
          <ListItem><ListItemText primary="5–15 years of service → 20 days" /></ListItem>
          <ListItem><ListItemText primary="15+ years of service → 26 days" /></ListItem>
          <ListItem><ListItemText primary="Employees under 18 or over 50 → minimum 20 days" /></ListItem>
        </List>
        <Alert severity="info" sx={{ mt: 1 }}>
          Seniority is calculated from the hire date. Age-based adjustments use the birth date.
          Both fields must be set in the user profile for accurate calculation.
        </Alert>
      </Section>

      {/* ── Tips ── */}
      <Section title="8. Tips & Best Practices">
        <List dense>
          <ListItem><ListItemText primary="Always set hire date and birth date for employees — these drive entitlement calculations" /></ListItem>
          <ListItem><ListItemText primary="Define holidays before the start of each year so leave day calculations are accurate" /></ListItem>
          <ListItem><ListItemText primary="Use collective leave sparingly — it deducts from everyone's annual balance" /></ListItem>
          <ListItem><ListItemText primary="Check the Team Calendar regularly for scheduling conflicts (highlighted in red)" /></ListItem>
          <ListItem><ListItemText primary="Managers should review pending approvals promptly to avoid bottlenecks" /></ListItem>
        </List>
      </Section>
    </Box>
  );
};

export default UserGuide;
