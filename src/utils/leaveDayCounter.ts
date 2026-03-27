import { Holiday } from '../types';

export interface LeaveDayCountInput {
  startDate: string;  // ISO date string
  endDate: string;    // ISO date string
  holidays: Holiday[];
  workdays?: number[];      // e.g. [1,2,3,4,5] for Mon-Fri
  legalWorkdays?: number[]; // e.g. [6] for Saturday
}

/** Format a Date as YYYY-MM-DD using local date parts (timezone-safe). */
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Expand holidays into a Set of individual date strings (YYYY-MM-DD).
 */
export function expandHolidayRanges(holidays: Holiday[]): Set<string> {
  const dateSet = new Set<string>();
  for (const holiday of holidays) {
    const start = new Date(holiday.holiday_date);
    const end = holiday.holiday_end_date ? new Date(holiday.holiday_end_date) : start;
    const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endLocal = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (current <= endLocal) {
      dateSet.add(toDateString(current));
      current.setDate(current.getDate() + 1);
    }
  }
  return dateSet;
}

/**
 * Return true if the date should NOT be deducted from leave.
 * A day is excluded if it's a rest day (not in workdays or legalWorkdays) or a holiday.
 */
export function isExcludedDate(
  date: Date,
  holidaySet: Set<string>,
  workdays: Set<number> = new Set([1, 2, 3, 4, 5]),
  legalWorkdays: Set<number> = new Set([6]),
): boolean {
  const day = date.getDay();
  // Rest day: not a workday and not a legal workday
  if (!workdays.has(day) && !legalWorkdays.has(day)) return true;
  // Holiday
  return holidaySet.has(toDateString(date));
}

/**
 * Count leave-deductible days in a date range.
 * Deducts workdays + legal workdays, excludes rest days and holidays.
 */
export function countLeaveDays(input: LeaveDayCountInput): number {
  const holidaySet = expandHolidayRanges(input.holidays);
  const workdaySet = new Set(input.workdays ?? [1, 2, 3, 4, 5]);
  const legalSet = new Set(input.legalWorkdays ?? [6]);
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  const startLocal = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endLocal = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  let count = 0;
  const current = new Date(startLocal);
  while (current <= endLocal) {
    if (!isExcludedDate(current, holidaySet, workdaySet, legalSet)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}
