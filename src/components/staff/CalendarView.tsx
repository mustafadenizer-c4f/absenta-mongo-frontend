// src/components/staff/CalendarView.tsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import { Calendar, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, subMonths, addMonths } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { RootState, AppDispatch } from '../../store';
import { fetchHolidays } from '../../store/slices/leaveSlice';
import { selectWorkdayConfig } from '../../store/slices/organizationSlice';
import { apiClient } from '../../config/api';
import { CalendarEvent, LeaveRequest, Holiday } from '../../types';
import ThreeMonthView from '../common/ThreeMonthView';
import { useLanguage } from '../../contexts/LanguageContext';
import { localizedLeaveTypeName, localizedStatus, formatLocalDate } from '../../utils/localize';
import { calendarLocalizer, getCalendarCulture, getCalendarMessages } from '../../utils/calendarLocalizer';

const HOLIDAY_COLOR = '#FF6B6B';

const statusColorMap: Record<LeaveRequest['status'], 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
};

/** Map approved leave requests to CalendarEvent objects */
function mapLeaveToEvents(requests: LeaveRequest[]): CalendarEvent[] {
  return requests
    .filter((r) => r.status === 'approved')
    .map((r) => {
      const s = new Date(r.start_date);
      const e = new Date(r.end_date);
      return {
        id: r.id,
        title: r.leave_type?.name ?? 'Leave',
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

/** Map holidays to CalendarEvent objects */
function mapHolidaysToEvents(holidays: Holiday[]): CalendarEvent[] {
  return holidays.map((h) => {
    const s = new Date(h.holiday_date);
    const endStr = h.holiday_end_date || h.holiday_date;
    const e = new Date(endStr);
    return {
      id: `holiday-${h.id}`,
      title: `🎉 ${h.name}`,
      start: new Date(s.getFullYear(), s.getMonth(), s.getDate()),
      end: new Date(e.getFullYear(), e.getMonth(), e.getDate() + 1),
      allDay: true,
      resource: {
        type: 'holiday' as const,
        color: HOLIDAY_COLOR,
      },
    };
  });
}

/** Legend showing leave type color mapping */
const CalendarLegend: React.FC<{ leaveTypes: { name: string; color: string }[] }> = ({
  leaveTypes,
}) => {
  const { langPackLabel } = useLanguage();
  return (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
    {leaveTypes.map((lt) => (
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
      <Box
        sx={{
          width: 14,
          height: 14,
          borderRadius: '3px',
          backgroundColor: HOLIDAY_COLOR,
          border: '1px dashed #c0392b',
        }}
      />
      <Typography variant="caption">{langPackLabel("txtHoliday") || "Holiday"}</Typography>
    </Box>
  </Box>
  );
};

const CalendarView: React.FC = () => {
  const { langPackLabel, language } = useLanguage();
  const calendarCulture = getCalendarCulture(language);
  const calendarMessages = getCalendarMessages(language);
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { holidays, loading: holidayLoading, error } = useSelector(
    (state: RootState) => state.leave,
  );
  const workdayConfig = useSelector(selectWorkdayConfig);

  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | '3months'>('calendar');
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [teamRequests, setTeamRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch own requests, team members' requests, and holidays
  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Fetch own requests
        const myResult = await apiClient.get('/leave-requests/my', { page_size: 500 });
        const myData = Array.isArray(myResult) ? myResult : (myResult.data ?? []);
        setMyRequests(myData);

        // Fetch team colleagues (same team_id) + manager
        const teamFilter: Record<string, any> = {};
        if (user.team_id) teamFilter.team_id = user.team_id;
        else if (user.manager_id) teamFilter.manager_id = user.manager_id;

        let teamUserIds: string[] = [];
        if (teamFilter.team_id || teamFilter.manager_id) {
          const teammates: any[] = await apiClient.get('/users', teamFilter);
          teamUserIds = (teammates ?? [])
            .map((u: any) => u.id)
            .filter((id: string) => id !== user.id);
        }
        // Also include the manager if not already in the list
        if (user.manager_id && !teamUserIds.includes(user.manager_id)) {
          teamUserIds.push(user.manager_id);
        }

        if (teamUserIds.length > 0) {
          const teamResult: any = await apiClient.get('/leave-requests/scope', {
            user_ids: teamUserIds.join(','),
            status: 'approved',
          });
          const teamData = Array.isArray(teamResult) ? teamResult : (teamResult.data ?? []);
          setTeamRequests(teamData);
        } else {
          setTeamRequests([]);
        }

        dispatch(fetchHolidays(user.company_id));
      } catch (err) {
        console.error('Failed to load calendar data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [dispatch, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Combine all requests
  const allRequests = useMemo(() => [...myRequests, ...teamRequests], [myRequests, teamRequests]);

  // Build calendar events
  const events = useMemo<CalendarEvent[]>(() => {
    // Own requests: show leave type name only
    const myEvents = myRequests
      .filter((r) => r.status === 'approved' || r.status === 'pending')
      .map((r) => {
        const s = new Date(r.start_date);
        const e = new Date(r.end_date);
        return {
          id: r.id,
          title: localizedLeaveTypeName(r.leave_type, language),
          start: new Date(s.getFullYear(), s.getMonth(), s.getDate()),
          end: new Date(e.getFullYear(), e.getMonth(), e.getDate() + 1),
          allDay: true,
          resource: { type: 'leave' as const, color: r.leave_type?.color_code ?? '#1976d2', status: r.status },
        };
      });
    // Team requests: show name + leave type
    const teamEvents = teamRequests
      .filter((r) => r.status === 'approved')
      .map((r) => {
        const s = new Date(r.start_date);
        const e = new Date(r.end_date);
        return {
          id: `team-${r.id}`,
          title: `${r.user?.full_name ?? 'Colleague'} – ${localizedLeaveTypeName(r.leave_type, language)}`,
          start: new Date(s.getFullYear(), s.getMonth(), s.getDate()),
          end: new Date(e.getFullYear(), e.getMonth(), e.getDate() + 1),
          allDay: true,
          resource: { type: 'leave' as const, color: r.leave_type?.color_code ?? '#90CAF9', status: r.status },
        };
      });
    const holidayEvents = mapHolidaysToEvents(holidays);
    return [...myEvents, ...teamEvents, ...holidayEvents];
  }, [myRequests, teamRequests, holidays]);

  // Derive unique leave types for legend
  const legendItems = useMemo(() => {
    const seen = new Map<string, string>();
    allRequests
      .filter((r) => (r.status === 'approved' || r.status === 'pending') && r.leave_type)
      .forEach((r) => {
        if (r.leave_type && !seen.has(r.leave_type.name)) {
          seen.set(r.leave_type.name, r.leave_type.color_code);
        }
      });
    return Array.from(seen.entries()).map(([name, color]) => ({ name, color }));
  }, [allRequests]);

  // Style events by their resource color
  const eventPropGetter = useCallback((event: CalendarEvent) => {
    const isHoliday = event.resource.type === 'holiday';
    return {
      style: {
        backgroundColor: event.resource.color,
        color: '#fff',
        borderRadius: '4px',
        border: isHoliday ? '1px dashed #c0392b' : 'none',
        opacity: isHoliday ? 0.85 : 1,
        fontSize: '0.8rem',
      },
    };
  }, []);

  // Style off-days (days not in workdayConfig) with a muted background
  const dayPropGetter = useCallback(
    (date: Date) => {
      if (!workdayConfig.includes(date.getDay())) {
        return {
          style: {
            backgroundColor: '#e1e7fd',
          },
        };
      }
      return {};
    },
    [workdayConfig],
  );

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  // Find the original leave request for the detail dialog
  const selectedLeaveRequest = useMemo(() => {
    if (!selectedEvent || selectedEvent.resource.type !== 'leave') return null;
    const eventId = String(selectedEvent.id).replace('team-', '');
    return allRequests.find((r) => r.id === eventId) ?? null;
  }, [selectedEvent, allRequests]);

  const selectedHoliday = useMemo(() => {
    if (!selectedEvent || selectedEvent.resource.type !== 'holiday') return null;
    const holidayId = selectedEvent.id.replace('holiday-', '');
    return holidays.find((h) => h.id === holidayId) ?? null;
  }, [selectedEvent, holidays]);

  if (loading && allRequests.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600, mb: 3 }}>{langPackLabel("txtCalendar") || "Calendar"}</Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <CalendarLegend leaveTypes={legendItems} />

      {/* View mode toggle */}
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
        {selectedEvent && selectedEvent.resource.type === 'leave' && selectedLeaveRequest && (
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
                    {formatLocalDate(selectedLeaveRequest.start_date, language)} –{' '}
                    {formatLocalDate(selectedLeaveRequest.end_date, language)}
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
                {selectedLeaveRequest.approval_comment && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {langPackLabel("txtApprovalComment") || "Approval Comment"}
                    </Typography>
                    <Typography variant="body2">
                      {selectedLeaveRequest.approval_comment}
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
          </>
        )}

        {selectedEvent && selectedEvent.resource.type === 'holiday' && selectedHoliday && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🎉 {selectedHoliday.name}
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="body2">
                    {new Date(selectedHoliday.holiday_date).toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                </Box>
                {selectedHoliday.description && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">{langPackLabel("txtDescription") || "Description"}</Typography>
                    <Typography variant="body2">{selectedHoliday.description}</Typography>
                  </Box>
                )}
                {selectedHoliday.is_recurring && (
                  <Chip label="Recurring" size="small" color="info" />
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

export default CalendarView;
