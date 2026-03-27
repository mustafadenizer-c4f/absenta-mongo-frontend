// src/components/manager/TeamView/index.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAutoClearing } from '../../../hooks/useAutoClearing';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Autocomplete,
  TextField,
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
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, eachDayOfInterval, parseISO, addMonths, subMonths } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { RootState } from '../../../store';
import { apiClient } from '../../../config/api';
import { CalendarEvent, LeaveRequest, User, Holiday } from '../../../types';
import ThreeMonthView from '../../common/ThreeMonthView';
import { useLanguage } from '../../../contexts/LanguageContext';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

const CONFLICT_COLOR = '#FF1744';
const HOLIDAY_COLOR = '#4CAF50';

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

/** Map team leave requests to CalendarEvent objects */
function mapTeamLeaveToEvents(requests: LeaveRequest[]): CalendarEvent[] {
  return requests
    .filter((r) => r.status === 'approved' || r.status === 'pending')
    .map((r) => {
      const start = new Date(r.start_date);
      const end = new Date(r.end_date);
      const userName = r.user?.full_name ?? 'Team Member';
      const leaveTypeName = r.leave_type?.name ?? 'Leave';
      return {
        id: r.id,
        title: `${userName} – ${leaveTypeName}`,
        start: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
        end: new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1),
        allDay: true,
        resource: {
          type: 'leave' as const,
          color: r.leave_type?.color_code ?? '#1976d2',
          status: r.status,
        },
      };
    });
}

/** Map holidays to CalendarEvent objects */
function mapHolidaysToEvents(holidays: Holiday[]): CalendarEvent[] {
  return holidays.map((h) => {
    const start = new Date(h.holiday_date);
    const endStr = h.holiday_end_date || h.holiday_date;
    const end = new Date(endStr);
    return {
      id: h.id,
      title: `🎉 ${h.name}`,
      start: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
      end: new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1),
      allDay: true,
      resource: { type: 'holiday' as const, color: HOLIDAY_COLOR },
    };
  });
}

const TeamView: React.FC = () => {
  const { langPackLabel } = useLanguage();
  const { user } = useSelector((state: RootState) => state.auth);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useAutoClearing(7000);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [teamRequests, setTeamRequests] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | '3months'>('calendar');

  // Fetch team members and their leave requests
  useEffect(() => {
    if (!user) return;

    const fetchTeamData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch team members assigned to this manager
        const members: User[] = await apiClient.get('/users', { manager_id: user!.id });
        // Include the manager in the team members list
        const allMembers = [user as User, ...(members ?? [])];
        setTeamMembers(allMembers);

        // Fetch approved and pending leave requests for manager + team
        const memberIds = allMembers.map((m) => m.id);
        if (memberIds.length > 0) {
          const requests: LeaveRequest[] = await apiClient.get('/leave-requests/scope', {
            status: 'approved,pending',
            user_ids: memberIds.join(','),
          });
          setTeamRequests(requests ?? []);
        } else {
          setTeamRequests([]);
        }

        // Fetch holidays
        const holData: Holiday[] = await apiClient.get('/holidays');
        setHolidays(holData ?? []);
      } catch (err: any) {
        setError(err.message || langPackLabel("txtFailedToLoad") || 'Failed to load team data');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [user]);

  // Filter requests by selected team members
  const filteredRequests = useMemo(() => {
    if (selectedMembers.length === 0) return teamRequests;
    const selectedIds = new Set(selectedMembers.map((m) => m.id));
    return teamRequests.filter((r) => selectedIds.has(r.user_id));
  }, [teamRequests, selectedMembers]);

  // Build calendar events
  const leaveEvents = useMemo(() => mapTeamLeaveToEvents(filteredRequests), [filteredRequests]);
  const holidayEvents = useMemo(() => mapHolidaysToEvents(holidays), [holidays]);
  const events = useMemo(() => [...leaveEvents, ...holidayEvents], [leaveEvents, holidayEvents]);

  // Detect conflict dates
  const conflictDates = useMemo(() => detectConflictDates(filteredRequests), [filteredRequests]);

  // Style events — add pending opacity
  const eventPropGetter = useCallback((event: CalendarEvent) => {
    const isHoliday = event.resource.type === 'holiday';
    const isPending = event.resource.status === 'pending';
    return {
      style: {
        backgroundColor: event.resource.color,
        color: '#fff',
        borderRadius: '4px',
        border: isPending ? '2px dashed rgba(255,255,255,0.6)' : 'none',
        opacity: isPending ? 0.75 : 1,
        fontWeight: isHoliday ? 600 : 400,
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
    return teamRequests.find((r) => r.id === selectedEvent.id) ?? null;
  }, [selectedEvent, teamRequests]);

  // Find the original holiday for the detail dialog
  const selectedHoliday = useMemo(() => {
    if (!selectedEvent || selectedEvent.resource.type !== 'holiday') return null;
    return holidays.find((h) => h.id === selectedEvent.id) ?? null;
  }, [selectedEvent, holidays]);

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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 600, mb: 3 }}>{langPackLabel("txtTeamView") || "Team View"}</Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Team member filter */}
      <Autocomplete
        multiple
        options={teamMembers}
        getOptionLabel={(option) => option.full_name}
        value={selectedMembers}
        onChange={(_, newValue) => setSelectedMembers(newValue)}
        renderInput={(params) => (
          <TextField {...params} label={langPackLabel("txtFilterByTeamMember") || "Filter by team member"} placeholder={langPackLabel("txtSelectMembers") || "Select members"} />
        )}
        renderTags={(value, getTagProps) =>
          value.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            return <Chip key={key} label={option.full_name} size="small" {...tagProps} />;
          })
        }
        sx={{ mb: 2, width: '100%', maxWidth: 600 }}
      />

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 14, height: 14, borderRadius: '3px', backgroundColor: HOLIDAY_COLOR }} />
          <Typography variant="caption">{langPackLabel("txtHoliday") || "Holiday"}</Typography>
        </Box>
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
        <Box sx={{ height: { xs: 400, sm: 500, md: 600 }, '& .rbc-calendar': { fontFamily: 'inherit' } }}>
          <Calendar<CalendarEvent>
            localizer={localizer}
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
              {selectedLeaveRequest.leave_type?.name ?? 'Leave'}
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">{langPackLabel("txtStatus") || "Status"}</Typography>
                  <Box>
                    <Chip
                      label={selectedLeaveRequest.status}
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
        {selectedEvent && selectedHoliday && (
          <>
            <DialogTitle>🎉 {selectedHoliday.name}</DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Date</Typography>
                  <Typography variant="body2">
                    {new Date(selectedHoliday.holiday_date).toLocaleDateString()}
                    {selectedHoliday.holiday_end_date && selectedHoliday.holiday_end_date !== selectedHoliday.holiday_date && ` – ${new Date(selectedHoliday.holiday_end_date).toLocaleDateString()}`}
                  </Typography>
                </Box>
                {selectedHoliday.description && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">{langPackLabel("txtDescription") || "Description"}</Typography>
                    <Typography variant="body2">{selectedHoliday.description}</Typography>
                  </Box>
                )}
                {selectedHoliday.is_recurring && <Chip label="Recurring" size="small" color="info" sx={{ width: 'fit-content' }} />}
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

export default TeamView;
