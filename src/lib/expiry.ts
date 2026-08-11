import type { Item, ItemStatus } from '../types';
import { diffInDays, parseISODate } from './dates';

/** An item this many days out (or fewer) is worth acting on. */
export const NOTIFY_LEAD_DAYS = 10;

/** Anything past this reads better in months than days. */
const MONTHS_THRESHOLD_DAYS = 100;

/** Anything past this reads better in years. */
const YEARS_THRESHOLD_DAYS = 730;

type Expirable = Pick<Item, 'expiresOn'>;

/**
 * Whole calendar days until the item expires. Negative when overdue,
 * `null` when the item has no expiry (or an unparseable one).
 */
export function daysLeft(item: Expirable, today = new Date()): number | null {
  if (!item.expiresOn) return null;
  const target = parseISODate(item.expiresOn);
  if (!target) return null;
  return diffInDays(today, target);
}

export function statusOf(item: Expirable, today = new Date()): ItemStatus {
  const days = daysLeft(item, today);
  if (days === null) return 'no-expiry';
  if (days < 0) return 'expired';
  // Expiring today is still usable, and still actionable — never 'expired'.
  if (days <= NOTIFY_LEAD_DAYS) return 'expiring';
  return 'ok';
}

/** True for items the user should do something about now. */
export function isUrgent(item: Expirable, today = new Date()): boolean {
  const status = statusOf(item, today);
  return status === 'expired' || status === 'expiring';
}

export function whenLabel(item: Expirable, today = new Date()): string {
  const days = daysLeft(item, today);
  if (days === null) return 'No expiry';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'expires today';
  if (days > YEARS_THRESHOLD_DAYS) return `${(days / 365).toFixed(1)}y left`;
  if (days > MONTHS_THRESHOLD_DAYS) return `${Math.round(days / 30)}mo left`;
  return `${days}d left`;
}

/**
 * Sort comparator: soonest expiry first, undated items last.
 * Ties fall back to name so the order stays stable between renders.
 */
export function byExpiry(a: Item, b: Item, today = new Date()): number {
  const left = daysLeft(a, today);
  const right = daysLeft(b, today);

  if (left === null && right === null) return a.name.localeCompare(b.name);
  if (left === null) return 1;
  if (right === null) return -1;
  if (left !== right) return left - right;
  return a.name.localeCompare(b.name);
}
