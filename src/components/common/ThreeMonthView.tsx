// src/components/common/ThreeMonthView.tsx — Shared 3-month calendar panel (responsive)
import React from 'react';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { Calendar } from 'react-big-calendar';
import { format, addMonths } from 'date-fns';
import { useLanguage } from '../../contexts/LanguageContext';
import { calendarLocalizer, getCalendarCulture, getDateLocale } from '../../utils/calendarLocalizer';

interface ThreeMonthViewProps {
  date: Date;
  events: any[];
  onSelectEvent?: (event: any) => void;
  eventPropGetter?: (event: any) => any;
  dayPropGetter?: (date: Date) => any;
}

const ThreeMonthView: React.FC<ThreeMonthViewProps> = ({
  date,
  events,
  onSelectEvent,
  eventPropGetter,
  dayPropGetter,
}) => {
  const theme = useTheme();
  const { language } = useLanguage();
  const calendarCulture = getCalendarCulture(language);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const months = [date, addMonths(date, 1), addMonths(date, 2)];
  const formatMonth = (d: Date) => format(d, 'MMMM yyyy', { locale: getDateLocale(language) });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: 1,
        '& .rbc-calendar': { fontFamily: 'inherit' },
      }}
    >
      {months.map((monthDate, idx) => (
        <Box key={idx} sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" align="center" sx={{ mb: 0.5, fontWeight: 600 }}>
            {formatMonth(monthDate)}
          </Typography>
          <Calendar
            localizer={calendarLocalizer}
            culture={calendarCulture}
            events={events}
            date={monthDate}
            view="month"
            views={['month']}
            toolbar={false}
            onNavigate={() => {}}
            onSelectEvent={onSelectEvent}
            eventPropGetter={eventPropGetter}
            dayPropGetter={dayPropGetter}
            startAccessor="start"
            endAccessor="end"
            style={{ height: isMobile ? 320 : 420 }}
            popup
          />
        </Box>
      ))}
    </Box>
  );
};

export default ThreeMonthView;
