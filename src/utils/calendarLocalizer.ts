import { dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { tr } from 'date-fns/locale/tr';

export const calendarLocalizer = dateFnsLocalizer({
  format, parse, getDay,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  locales: { 'en-US': enUS, 'tr': tr },
});

export function getCalendarCulture(lang: string) {
  return lang === 'tr' ? 'tr' : 'en-US';
}

export function getDateLocale(lang: string) {
  return lang === 'tr' ? tr : enUS;
}

const trMessages = {
  today: 'Bugün',
  previous: 'Geri',
  next: 'İleri',
  month: 'Ay',
  week: 'Hafta',
  day: 'Gün',
  agenda: 'Ajanda',
  date: 'Tarih',
  time: 'Saat',
  event: 'Etkinlik',
  allDay: 'Tüm gün',
  noEventsInRange: 'Bu aralıkta etkinlik yok.',
  showMore: (total: number) => `+${total} daha`,
};

export function getCalendarMessages(lang: string) {
  return lang === 'tr' ? trMessages : undefined;
}

const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_TR = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

export function getDayNames(lang: string) {
  return lang === 'tr' ? DAY_NAMES_TR : DAY_NAMES_EN;
}
