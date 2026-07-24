/**
 * Week helpers. A "week" is keyed by its Monday (UTC midnight) so it is stable
 * across timezones and matches the plan sheet's Mon–Sat/Sun ranges.
 */

/** Monday (UTC) of the week containing `d`, as a Date at UTC midnight. */
export function mondayOf(d: Date): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // days since Monday
  date.setUTCDate(date.getUTCDate() - diff);
  return date;
}

export function currentWeekStart(): Date {
  return mondayOf(new Date());
}

export function addWeeks(weekStart: Date, n: number): Date {
  const d = new Date(weekStart);
  d.setUTCDate(d.getUTCDate() + n * 7);
  return d;
}

/** yyyy-mm-dd key for a week Monday. */
export function weekKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Parse a yyyy-mm-dd key into a UTC-midnight Monday; falls back to current week. */
export function parseWeekKey(key?: string | null): Date {
  if (key && /^\d{4}-\d{2}-\d{2}$/.test(key)) {
    const d = new Date(`${key}T00:00:00.000Z`);
    if (!Number.isNaN(d.getTime())) return mondayOf(d);
  }
  return currentWeekStart();
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** e.g. "21–27 Jul 2026" for a Monday..Sunday range. */
export function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setUTCDate(end.getUTCDate() + 6);
  const sMonth = MONTHS[weekStart.getUTCMonth()];
  const eMonth = MONTHS[end.getUTCMonth()];
  const sameMonth = sMonth === eMonth && weekStart.getUTCFullYear() === end.getUTCFullYear();
  if (sameMonth) {
    return `${weekStart.getUTCDate()}–${end.getUTCDate()} ${sMonth} ${end.getUTCFullYear()}`;
  }
  return `${weekStart.getUTCDate()} ${sMonth} – ${end.getUTCDate()} ${eMonth} ${end.getUTCFullYear()}`;
}

/** Short date like "24 Jul". */
export function formatDayShort(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}
