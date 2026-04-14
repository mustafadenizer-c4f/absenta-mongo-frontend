import { ImportantDay, CalendarEvent } from '../types';

export function getLocalizedImportantDayName(day: ImportantDay, language: string): string {
  if (language === 'tr' && day.name_tr && day.name_tr.length > 0) {
    return day.name_tr;
  }
  return day.name;
}

export function resolveImportantDays(
  days: ImportantDay[],
  year: number,
  language: string
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const day of days) {
    if (!day.is_recurring && day.year !== year) {
      continue;
    }

    const start = new Date(year, day.date_month - 1, day.date_day);

    // Skip invalid dates (e.g. Feb 30)
    if (start.getMonth() !== day.date_month - 1) {
      continue;
    }

    const end = new Date(start.getTime() + 86400000);

    events.push({
      id: day.id,
      title: getLocalizedImportantDayName(day, language),
      start,
      end,
      allDay: true,
      resource: {
        type: 'important_day',
        color: day.color,
      },
    });
  }

  return events;
}
