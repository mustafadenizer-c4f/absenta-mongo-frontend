// src/components/group-manager/TeamView/index.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAutoClearing } from '../../../hooks/useAutoClearing';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Autocomplete,
  TextField,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import { Calendar, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, eachDayOfInterval, parseISO, addMonths, subMonths } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { useAuth } from '../../../hooks/useAuth';
import { apiClient } from '../../../config/api';
import { CalendarEvent, LeaveRequest, User } from '../../../types';
import ThreeMonthView from '../../common/ThreeMonthView';
import { useLanguage } from '../../../contexts/LanguageContext';
import { localizedLeaveTypeName, localizedStatus } from '../../../utils/localize';
import { calendarLocalizer, getCalendarCulture, getCalendarMessages } from '../../../utils/calendarLocalizer';

const CONFLICT_COLOR = '#FF1744';

const statusColorMap: Record<LeaveRequest['status'], 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
};

/** Detect conflict dates where 2+ team members have overlapping leave */
function detectConflictDates(requests: LeaveRequest[]): Set<string> {
  const dateUserMap = new Map<string, Set<string>>();

  for (const r of requests) {
    if (r.status !== 'approved' && r.status !== 'pending') continue;
    const start = parseISO(r.start_date);
    const end = parseISO(r.end_date);
    const days = eachDayOfInterval({ start, end });
    for (const day of days) {
      const key = format(day, 'yyyy-MM-dd');
      if (!dateUserMap.has(key)) {
        dateUserMap.set(key, new Set());
      }
      dateUserMap.get(key)!.add(r.user_id);
    }
  }

  const conflicts = new Set<string>();
  dateUserMap.forEach((users, dateKey) => {
    if (users.size >= 2) {
      conflicts.add(dateKey);
    }
  });
  return conflicts;
}

/** Map leave requests to CalendarEvent objects */
function mapLeaveToEvents(requests: LeaveRequest[], language: string): CalendarEvent[] {
  return requests
    .filter((r) => r.status === 'approved' || r.status === 'pending')
    .map((r) => {
      const s = new Date(r.start_date);
      const e = new Date(r.end_date);
      const userName = r.user?.full_name ?? 'Team Member';
      const leaveTypeName = localizedLeaveTypeName(r.leave_type, language);
      return {
        id: r.id,
        title: `${userName} – ${leaveTypeName}`,
        start: new Date(s.getFullYear(), s.getMonth(), s.getDate()),
        end: new Date(e.getFullYear(), e.getMonth(), e.getDate() + 1),
        allDay: true,
        resource: {
          type: 'leave' as const,
          color: r.leave_type?.color_code ?? '#1976d2',
          status: r.status,
        },
      };
    });
}

const GroupManagerTeamView: React.FC = () => {
  const { langPackLabel, language } = useLanguage();
  const calendarCulture = getCalendarCulture(language);
  const calendarMessages = getCalendarMessages(language);
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useAutoClearing(7000);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [groupRequests, setGroupRequests] = useState<LeaveRequest[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | '3months'>('calendar');

  // Fetch group members and their leave requests
  useEffect(() => {
    if (!user?.group_id) return;

    const fetchGroupData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all users in the same group
        const members: User[] = await apiClient.get('/users', { group_id: user.group_id });
        setGroupMembers(members ?? []);

        // Derive teams from group members' team_ids
        const teamIds = Array.from(new Set((members ?? []).map((m: User) => m.team_id).filter(Boolean))) as string[];
        if (teamIds.length > 0) {
          const teamData: { id: string; name: string }[] = await apiClient.get('/teams');
          setTeams((teamData ?? []).filter((t) => teamIds.includes(t.id)));
        }

        // Fetch approved and pending leave requests for group members
        const memberIds = (members ?? []).map((m: User) => m.id);
        if (memberIds.length === 0) {
          setGroupRequests([]);
          setLoading(false);
          return;
        }

        const requests: LeaveRequest[] = await apiClient.get('/leave-requests/scope', {
          user_ids: memberIds.join(','),
          status: 'approved,pending',
        });
        setGroupRequests(requests ?? []);
      } catch (err: any) {
        setError(err.message || langPackLabel("txtFailedToLoad") || 'Failed to load group team data');
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [user]);

  // Members filtered by selected team
  const teamFilteredMembers = useMemo(() => {
    if (!selectedTeam) return groupMembers;
    return groupMembers.filter((m) => m.team_id === selectedTeam);
  }, [groupMembers, selectedTeam]);

  // Filter requests by selected team and/or selected members
  const filteredRequests = useMemo(() => {
    const baseMembers = selectedTeam ? teamFilteredMembers : groupMembers;
    const memberIds = new Set(baseMembers.map((m) => m.id));
    let reqs = groupRequests.filter((r) => memberIds.has(r.user_id));
    if (selectedMembers.length > 0) {
      const selectedIds = new Set(selectedMembers.map((m) => m.id));
      reqs = reqs.filter((r) => selectedIds.has(r.user_id));
    }
    return reqs;
  }, [groupRequests, groupMembers, teamFilteredMembers, selectedTeam, selectedMembers]);

  // Build calendar events
  const events = useMemo(() => mapLeaveToEvents(filteredRequests, language), [filteredRequests, language]);

  // Detect conflict dates
  const conflictDates = useMemo(() => detectConflictDates(filteredRequests), [filteredRequests]);

  // Style events — pending gets dashed border + reduced opacity
  const eventPropGetter = useCallback((event: CalendarEvent) => {
    const isPending = event.resource.status === 'pending';
    return {
      style: {
        backgroundColor: event.resource.color,
        color: '#fff',
        borderRadius: '4px',
        border: isPending ? '2px dashed rgba(255,255,255,0.6)' : 'none',
        opacity: isPending ? 0.75 : 1,
        fontSize: '0.8rem',
      },
    };
  }, []);

  // Highlight conflict days with a red background
  const dayPropGetter = useCallback(
    (dateArg: Date) => {
      const key = format(dateArg, 'yyyy-MM-dd');
      if (conflictDates.has(key)) {
        return {
          style: {
            backgroundColor: 'rgba(255, 23, 68, 0.08)',
          },
        };
      }
      return {};
    },
    [conflictDates],
  );

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  // Find the original leave request for the detail dialog
  const selectedLeaveRequest = useMemo(() => {
    if (!selectedEvent || selectedEvent.resource.type !== 'leave') return null;
    return groupRequests.find((r) => r.id === selectedEvent.id) ?? null;
  }, [selectedEvent, groupRequests]);

  // Derive unique leave types for legend
  const legendItems = useMemo(() => {
    const seen = new Map<string, string>();
    filteredRequests.forEach((r) => {
      if (r.leave_type && !seen.has(r.leave_type.name)) {
        seen.set(r.leave_type.name, r.leave_type.color_code);
      }
    });
    return Array.from(seen.entries()).map(([name, color]) => ({ name, color }));
  }, [filteredRequests]);

  if (!user?.group_id) {
    return (
      <Box>
        <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600, mb: 3 }}>{langPackLabel("txtGroupTeamView") || "Group Team View"}</Typography>
        <Alert severity="warning">{langPackLabel("txtNoGroupAssigned") || "No group assigned. Please contact an administrator."}</Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600, mb: 3 }}>{langPackLabel("txtGroupTeamView") || "Group Team View"}</Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
        {teams.length > 0 && (
          <TextField
            select
            label={langPackLabel("txtTeam") || "Team"}
            value={selectedTeam}
            onChange={(e) => { setSelectedTeam(e.target.value); setSelectedMembers([]); }}
            size="small"
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">{langPackLabel("txtAllTeams") || "All Teams"}</MenuItem>
            {teams.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
            ))}
          </TextField>
        )}
        <Autocomplete
          multiple
          options={teamFilteredMembers}
          getOptionLabel={(option) => option.full_name}
          value={selectedMembers}
          onChange={(_, newValue) => setSelectedMembers(newValue)}
          renderInput={(params) => (
            <TextField {...params} label={langPackLabel("txtFilterByTeamMember") || "Filter by group member"} placeholder={langPackLabel("txtSelectMembers") || "Select members"} size="small" />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return <Chip key={key} label={option.full_name} size="small" {...tagProps} />;
            })
          }
          sx={{ flex: 1, minWidth: 300 }}
        />
      </Box>

      {/* Legend */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
        {legendItems.map((lt) => (
          <Box key={lt.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: '3px',
                backgroundColor: lt.color,
              }}
            />
            <Typography variant="caption">{lt.name}</Typography>
          </Box>
        ))}
        {conflictDates.size > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box
              sx={{
                width: 14,
                height: 14,
                borderRadius: '3px',
                backgroundColor: 'rgba(255, 23, 68, 0.08)',
                border: `1px solid ${CONFLICT_COLOR}`,
              }}
            />
            <Typography variant="caption">{langPackLabel("txtConflict") || "Conflict (2+ members off)"}</Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: '3px',
              backgroundColor: '#1976d2',
              border: '2px dashed rgba(255,255,255,0.6)',
              opacity: 0.75,
            }}
          />
          <Typography variant="caption">{langPackLabel("txtPending") || "Pending"}</Typography>
        </Box>
      </Box>

      {/* Calendar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, val) => val && setViewMode(val)}
          size="small"
        >
          <ToggleButton value="calendar">{langPackLabel("txtCalendar") || "Calendar"}</ToggleButton>
          <ToggleButton value="3months">{langPackLabel("txt3Months") || "3 Months"}</ToggleButton>
        </ToggleButtonGroup>

        {viewMode === '3months' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton size="small" onClick={() => setDate((d) => subMonths(d, 1))}><ChevronLeftIcon /></IconButton>
            <IconButton size="small" onClick={() => setDate(new Date())}><TodayIcon /></IconButton>
            <IconButton size="small" onClick={() => setDate((d) => addMonths(d, 1))}><ChevronRightIcon /></IconButton>
          </Box>
        )}
      </Box>

      {viewMode === 'calendar' ? (
        <Box sx={{
          height: { xs: 400, sm: 500, md: 600 },
          '& .rbc-calendar': { fontFamily: 'inherit' },
          '& .rbc-toolbar': { flexWrap: 'wrap', gap: '8px', mb: 1 },
          '& .rbc-toolbar button': { fontSize: '0.8rem', padding: '4px 10px' },
          '& .rbc-btn-group': { gap: '2px' },
          '& .rbc-toolbar-label': { fontSize: '1rem', fontWeight: 600, padding: '4px 0' },
        }}>
          <Calendar<CalendarEvent>
            localizer={calendarLocalizer}
            culture={calendarCulture}
            messages={calendarMessages}
            events={events}
            startAccessor="start"
            endAccessor="end"
            views={['month', 'week', 'day']}
            view={view}
            date={date}
            onView={setView}
            onNavigate={setDate}
            onSelectEvent={handleSelectEvent}
            eventPropGetter={eventPropGetter}
            dayPropGetter={dayPropGetter}
            style={{ height: '100%' }}
            popup
          />
        </Box>
      ) : (
        <ThreeMonthView
          date={date}
          events={events}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventPropGetter}
          dayPropGetter={dayPropGetter}
        />
      )}

      {/* Leave Request Detail Dialog */}
      <Dialog
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedEvent && selectedLeaveRequest && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: selectedEvent.resource.color,
                }}
              />
              {selectedLeaveRequest.user?.full_name ?? 'Team Member'} –{' '}
              {localizedLeaveTypeName(selectedLeaveRequest.leave_type, language)}
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">{langPackLabel("txtStatus") || "Status"}</Typography>
                  <Box>
                    <Chip
                      label={localizedStatus(selectedLeaveRequest.status, langPackLabel)}
                      color={statusColorMap[selectedLeaveRequest.status]}
                      size="small"
                    />
                  </Box>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">{langPackLabel("txtDates") || "Dates"}</Typography>
                  <Typography variant="body2">
                    {new Date(selectedLeaveRequest.start_date).toLocaleDateString()} –{' '}
                    {new Date(selectedLeaveRequest.end_date).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">{langPackLabel("txtTotalDays") || "Total Days"}</Typography>
                  <Typography variant="body2">
                    {selectedLeaveRequest.total_days}
                    {selectedLeaveRequest.is_half_day &&
                      ` (Half day – ${selectedLeaveRequest.half_day_period})`}
                  </Typography>
                </Box>
                {selectedLeaveRequest.reason && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">{langPackLabel("txtReason") || "Reason"}</Typography>
                    <Typography variant="body2">{selectedLeaveRequest.reason}</Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
          </>
        )}
        <DialogActions>
          <Button onClick={() => setSelectedEvent(null)}>{langPackLabel("txtClose") || "Close"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupManagerTeamView;
