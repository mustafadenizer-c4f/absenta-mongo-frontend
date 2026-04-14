// src/components/general-manager/TeamView/index.tsx — Department Manager Team Calendar
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAutoClearing } from '../../../hooks/useAutoClearing';
import { useDispatch, useSelector } from 'react-redux';
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

import { RootState, AppDispatch } from '../../../store';
import { fetchImportantDays } from '../../../store/slices/importantDaysSlice';
import { useAuth } from '../../../hooks/useAuth';
import { apiClient } from '../../../config/api';
import { CalendarEvent, LeaveRequest, User, Holiday, ImportantDay } from '../../../types';
import { resolveImportantDays, getLocalizedImportantDayName } from '../../../utils/resolveImportantDays';
import ThreeMonthView from '../../common/ThreeMonthView';
import { useLanguage } from '../../../contexts/LanguageContext';
import { localizedLeaveTypeName, localizedStatus } from '../../../utils/localize';
import { calendarLocalizer, getCalendarCulture, getCalendarMessages } from '../../../utils/calendarLocalizer';

const CONFLICT_COLOR = '#FF1744';
const HOLIDAY_COLOR = '#4CAF50';
const IMPORTANT_DAY_COLOR_DEFAULT = '#9C27B0';

const statusColorMap: Record<LeaveRequest['status'], 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
};

function detectConflictDates(requests: LeaveRequest[]): Set<string> {
  const dateUserMap = new Map<string, Set<string>>();
  for (const r of requests) {
    if (r.status !== 'approved' && r.status !== 'pending') continue;
    const days = eachDayOfInterval({ start: parseISO(r.start_date), end: parseISO(r.end_date) });
    for (const day of days) {
      const key = format(day, 'yyyy-MM-dd');
      if (!dateUserMap.has(key)) dateUserMap.set(key, new Set());
      dateUserMap.get(key)!.add(r.user_id);
    }
  }
  const conflicts = new Set<string>();
  dateUserMap.forEach((users, dateKey) => { if (users.size >= 2) conflicts.add(dateKey); });
  return conflicts;
}

function mapLeaveToEvents(requests: LeaveRequest[], language: string): CalendarEvent[] {
  return requests
    .filter((r) => r.status === 'approved' || r.status === 'pending')
    .map((r) => {
      const s = new Date(r.start_date);
      const e = new Date(r.end_date);
      return {
        id: r.id,
        title: `${r.user?.full_name ?? 'Team Member'} – ${localizedLeaveTypeName(r.leave_type, language)}`,
        start: new Date(s.getFullYear(), s.getMonth(), s.getDate()),
        end: new Date(e.getFullYear(), e.getMonth(), e.getDate() + 1),
        allDay: true,
        resource: { type: 'leave' as const, color: r.leave_type?.color_code ?? '#1976d2', status: r.status },
      };
    });
}

function mapHolidaysToEvents(holidays: Holiday[]): CalendarEvent[] {
  return holidays.map((h) => {
    const s = new Date(h.holiday_date);
    const endStr = h.holiday_end_date || h.holiday_date;
    const e = new Date(endStr);
    return {
      id: h.id,
      title: `🎉 ${h.name}`,
      start: new Date(s.getFullYear(), s.getMonth(), s.getDate()),
      end: new Date(e.getFullYear(), e.getMonth(), e.getDate() + 1),
      allDay: true,
      resource: { type: 'holiday' as const, color: HOLIDAY_COLOR },
    };
  });
}

const DepartmentManagerTeamView: React.FC = () => {
  const { langPackLabel, language } = useLanguage();
  const calendarCulture = getCalendarCulture(language);
  const calendarMessages = getCalendarMessages(language);
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { items: importantDays } = useSelector((state: RootState) => state.importantDays);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useAutoClearing(7000);
  const [deptMembers, setDeptMembers] = useState<User[]>([]);
  const [deptRequests, setDeptRequests] = useState<LeaveRequest[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | '3months'>('calendar');

  useEffect(() => {
    if (!user?.department_id) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch users in this department
        const members: User[] = await apiClient.get('/users', { department_id: user.department_id! });
        setDeptMembers(members ?? []);

        // Fetch teams in this department
        const teamData: { id: string; name: string }[] = await apiClient.get('/teams', { department_id: user.department_id! });
        setTeams(teamData ?? []);

        // Fetch leave requests for department members
        const memberIds = (members ?? []).map((m: User) => m.id);
        if (memberIds.length > 0) {
          const requests: LeaveRequest[] = await apiClient.get('/leave-requests/scope', {
            user_ids: memberIds.join(','),
            status: 'approved,pending',
          });
          setDeptRequests(requests ?? []);
        } else {
          setDeptRequests([]);
        }

        // Fetch company holidays
        const holidayData: Holiday[] = await apiClient.get('/holidays');
        setHolidays(holidayData ?? []);

        dispatch(fetchImportantDays(user.company_id));
      } catch (err: any) {
        setError(err.message || langPackLabel("txtFailedToLoad") || 'Failed to load team calendar data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Members filtered by selected team
  const teamFilteredMembers = useMemo(() => {
    if (!selectedTeam) return deptMembers;
    return deptMembers.filter((m) => m.team_id === selectedTeam);
  }, [deptMembers, selectedTeam]);

  const filteredRequests = useMemo(() => {
    const baseMembers = selectedTeam ? teamFilteredMembers : deptMembers;
    const memberIds = new Set(baseMembers.map((m) => m.id));
    let reqs = deptRequests.filter((r) => memberIds.has(r.user_id));
    if (selectedMembers.length > 0) {
      const selectedIds = new Set(selectedMembers.map((m) => m.id));
      reqs = reqs.filter((r) => selectedIds.has(r.user_id));
    }
    return reqs;
  }, [deptRequests, deptMembers, teamFilteredMembers, selectedTeam, selectedMembers]);

  const leaveEvents = useMemo(() => mapLeaveToEvents(filteredRequests, language), [filteredRequests, language]);
  const holidayEvents = useMemo(() => mapHolidaysToEvents(holidays), [holidays]);
  const events = useMemo(() => {
    const importantDayEvents = resolveImportantDays(importantDays, new Date().getFullYear(), language);
    return [...leaveEvents, ...holidayEvents, ...importantDayEvents];
  }, [leaveEvents, holidayEvents, importantDays, language]);

  const conflictDates = useMemo(() => detectConflictDates(filteredRequests), [filteredRequests]);

  const eventPropGetter = useCallback((event: CalendarEvent) => {
    const isHoliday = event.resource.type === 'holiday';
    const isImportantDay = event.resource.type === 'important_day';
    const isPending = event.resource.status === 'pending';
    return {
      style: {
        backgroundColor: event.resource.color,
        color: '#fff',
        borderRadius: '4px',
        border: isPending
          ? '2px dashed rgba(255,255,255,0.6)'
          : isImportantDay
          ? `1px solid ${event.resource.color}`
          : 'none',
        opacity: isPending ? 0.75 : 1,
        fontWeight: isHoliday ? 600 : 400,
        fontSize: '0.8rem',
      },
    };
  }, []);

  const dayPropGetter = useCallback(
    (dateArg: Date) => {
      const key = format(dateArg, 'yyyy-MM-dd');
      if (conflictDates.has(key)) {
        return { style: { backgroundColor: 'rgba(255, 23, 68, 0.08)' } };
      }
      return {};
    },
    [conflictDates],
  );

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  const selectedLeaveRequest = useMemo(() => {
    if (!selectedEvent || selectedEvent.resource.type !== 'leave') return null;
    return deptRequests.find((r) => r.id === selectedEvent.id) ?? null;
  }, [selectedEvent, deptRequests]);

  const selectedHoliday = useMemo(() => {
    if (!selectedEvent || selectedEvent.resource.type !== 'holiday') return null;
    return holidays.find((h) => h.id === selectedEvent.id) ?? null;
  }, [selectedEvent, holidays]);

  const selectedImportantDay = useMemo(() => {
    if (!selectedEvent || selectedEvent.resource.type !== 'important_day') return null;
    return importantDays.find((d) => d.id === String(selectedEvent.id)) ?? null;
  }, [selectedEvent, importantDays]);

  const legendItems = useMemo(() => {
    const seen = new Map<string, string>();
    filteredRequests.forEach((r) => {
      if (r.leave_type && !seen.has(r.leave_type.name)) {
        seen.set(r.leave_type.name, r.leave_type.color_code);
      }
    });
    return Array.from(seen.entries()).map(([name, color]) => ({ name, color }));
  }, [filteredRequests]);

  if (!user?.department_id) {
    return (
      <Box>
        <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600, mb: 3 }}>{langPackLabel("txtTeamCalendar") || "Team Calendar"}</Typography>
        <Alert severity="warning">{langPackLabel("txtNoDepartmentAssigned") || "No department assigned. Please contact an administrator."}</Alert>
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
      <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600, mb: 3 }}>{langPackLabel("txtTeamCalendar") || "Team Calendar"}</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
            <TextField {...params} label={langPackLabel("txtFilterByTeamMember") || "Filter by team member"} placeholder={langPackLabel("txtSelectMembers") || "Select members"} size="small" />
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
            <Box sx={{ width: 14, height: 14, borderRadius: '3px', backgroundColor: lt.color }} />
            <Typography variant="caption">{lt.name}</Typography>
          </Box>
        ))}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 14, height: 14, borderRadius: '3px', backgroundColor: HOLIDAY_COLOR }} />
          <Typography variant="caption">{langPackLabel("txtHoliday") || "Holiday"}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 14, height: 14, borderRadius: '3px', backgroundColor: IMPORTANT_DAY_COLOR_DEFAULT, border: `1px solid ${IMPORTANT_DAY_COLOR_DEFAULT}` }} />
          <Typography variant="caption">{langPackLabel("txtImportantDays") || "Important Days"}</Typography>
        </Box>
        {conflictDates.size > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 14, height: 14, borderRadius: '3px', backgroundColor: 'rgba(255, 23, 68, 0.08)', border: `1px solid ${CONFLICT_COLOR}` }} />
            <Typography variant="caption">{langPackLabel("txtConflict") || "Conflict"}</Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 14, height: 14, borderRadius: '3px', backgroundColor: '#1976d2', border: '2px dashed rgba(255,255,255,0.6)', opacity: 0.75 }} />
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

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onClose={() => setSelectedEvent(null)} maxWidth="sm" fullWidth>
        {selectedEvent && selectedLeaveRequest && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: selectedEvent.resource.color }} />
              {selectedLeaveRequest.user?.full_name ?? 'Team Member'} – {localizedLeaveTypeName(selectedLeaveRequest.leave_type, language)}
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">{langPackLabel("txtStatus") || "Status"}</Typography>
                  <Box><Chip label={localizedStatus(selectedLeaveRequest.status, langPackLabel)} color={statusColorMap[selectedLeaveRequest.status]} size="small" /></Box>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">{langPackLabel("txtDates") || "Dates"}</Typography>
                  <Typography variant="body2">
                    {new Date(selectedLeaveRequest.start_date).toLocaleDateString()} – {new Date(selectedLeaveRequest.end_date).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">{langPackLabel("txtTotalDays") || "Total Days"}</Typography>
                  <Typography variant="body2">
                    {selectedLeaveRequest.total_days}
                    {selectedLeaveRequest.is_half_day && ` (Half day – ${selectedLeaveRequest.half_day_period})`}
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
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: HOLIDAY_COLOR }} />
              🎉 {selectedHoliday.name}
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Date</Typography>
                  <Typography variant="body2">
                    {new Date(selectedHoliday.holiday_date).toLocaleDateString()}
                    {selectedHoliday.holiday_end_date && selectedHoliday.holiday_end_date !== selectedHoliday.holiday_date &&
                      ` – ${new Date(selectedHoliday.holiday_end_date).toLocaleDateString()}`}
                  </Typography>
                </Box>
                {selectedHoliday.description && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">{langPackLabel("txtDescription") || "Description"}</Typography>
                    <Typography variant="body2">{selectedHoliday.description}</Typography>
                  </Box>
                )}
                {selectedHoliday.is_recurring && (
                  <Chip label="Recurring" size="small" color="info" sx={{ width: 'fit-content' }} />
                )}
              </Box>
            </DialogContent>
          </>
        )}
        {selectedEvent && selectedEvent.resource.type === 'important_day' && selectedImportantDay && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: selectedImportantDay.color }} />
              {getLocalizedImportantDayName(selectedImportantDay, language)}
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">{langPackLabel("txtDate") || "Date"}</Typography>
                  <Typography variant="body2">{selectedImportantDay.date_month}/{selectedImportantDay.date_day}</Typography>
                </Box>
                {(selectedImportantDay.description || selectedImportantDay.description_tr) && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">{langPackLabel("txtDescription") || "Description"}</Typography>
                    <Typography variant="body2">
                      {language === 'tr' && selectedImportantDay.description_tr ? selectedImportantDay.description_tr : selectedImportantDay.description}
                    </Typography>
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

export default DepartmentManagerTeamView;
