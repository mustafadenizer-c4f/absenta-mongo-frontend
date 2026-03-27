// src/utils/dateUtils.ts
import { format, parseISO, isValid, addDays } from 'date-fns';
import { Holiday, DEFAULT_WORKDAYS, DEFAULT_LEGAL_WORKDAYS } from '../types';

export const formatDate = (date: string | Date, formatStr: string = 'dd/MM/yyyy') => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid Date';
  return format(dateObj, formatStr);
};

export const calculateBusinessDays = (
  startDate: Date,
  endDate: Date,
  holidays: Holiday[] = [],
  workdays: number[] = DEFAULT_WORKDAYS,
  legalWorkdays: number[] = DEFAULT_LEGAL_WORKDAYS,
): number => {
  const holidaySet = new Set<string>();
  for (const h of holidays) {
    const start = new Date(h.holiday_date);
    const end = h.holiday_end_date ? new Date(h.holiday_end_date) : start;
    const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endLocal = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cur <= endLocal) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      holidaySet.add(`${y}-${m}-${d}`);
      cur.setDate(cur.getDate() + 1);
    }
  }

  const workdaySet = new Set(workdays);
  const legalSet = new Set(legalWorkdays);

  let count = 0;
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endLocal = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  while (current <= endLocal) {
    const day = current.getDay();
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    if ((workdaySet.has(day) || legalSet.has(day)) && !holidaySet.has(dateStr)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

export const isWeekend = (date: Date, workdays: number[] = DEFAULT_WORKDAYS): boolean => {
  return !workdays.includes(date.getDay());
};

export const addBusinessDays = (date: Date, days: number, workdays: number[] = DEFAULT_WORKDAYS): Date => {
  let result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result = addDays(result, 1);
    if (!isWeekend(result, workdays)) {
      addedDays++;
    }
  }
  
  return result;
};