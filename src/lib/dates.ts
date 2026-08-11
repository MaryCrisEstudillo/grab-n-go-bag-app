/**
 * Calendar-day date helpers.
 *
 * Everything here works in whole local days. `'YYYY-MM-DD'` is parsed to local
 * midnight rather than through `new Date(iso)`, which would read the string as
 * UTC and shift the day for anyone west of Greenwich.
 */

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses `'YYYY-MM-DD'` to local midnight. Returns null if malformed or not a real date. */
export function parseISODate(iso: string): Date | null {
  const match = ISO_DATE.exec(iso);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  // Rejects rollovers like '2025-02-30', which Date silently turns into March.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

/** Strips the time of day, so two dates can be compared as calendar days. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Whole calendar days from `from` to `to`. Rounded, so DST shifts don't leak in. */
export function diffInDays(from: Date, to: Date): number {
  return Math.round(
    (startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY,
  );
}

/** Formats a Date as `'YYYY-MM-DD'` in local time. */
export function toISODate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISO(today = new Date()): string {
  return toISODate(today);
}

/** `'2025-07-22'` → `'22 Jul'`. Returns null for unparseable input. */
export function formatShortDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = parseISODate(iso);
  if (!date) return null;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** Shifts a date by whole days — used to seed demo data relative to today. */
export function addDays(date: Date, days: number): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + days);
  return next;
}
