import { describe, expect, it } from 'vitest';
import type { Item } from '../types';
import { addDays, toISODate } from './dates';
import { byExpiry, daysLeft, isUrgent, statusOf, whenLabel } from './expiry';

const TODAY = new Date(2025, 6, 15, 9, 30); // 15 Jul 2025, mid-morning

/** An item expiring `offset` days from TODAY, or never when offset is null. */
function due(offset: number | null, name = 'Item'): Item {
  return {
    id: `id-${offset}`,
    categoryId: 'cat-1',
    name,
    description: '',
    quantity: 1,
    datePacked: toISODate(addDays(TODAY, -30)),
    expiresOn: offset === null ? null : toISODate(addDays(TODAY, offset)),
  };
}

describe('daysLeft', () => {
  it('is null when the item has no expiry', () => {
    expect(daysLeft(due(null), TODAY)).toBeNull();
  });

  it('is null when the stored date is malformed', () => {
    expect(daysLeft({ expiresOn: 'not-a-date' }, TODAY)).toBeNull();
    expect(daysLeft({ expiresOn: '2025-02-30' }, TODAY)).toBeNull();
  });

  it('counts whole calendar days, forwards and backwards', () => {
    expect(daysLeft(due(0), TODAY)).toBe(0);
    expect(daysLeft(due(1), TODAY)).toBe(1);
    expect(daysLeft(due(-1), TODAY)).toBe(-1);
    expect(daysLeft(due(45), TODAY)).toBe(45);
  });

  it('crosses a DST boundary without drifting a day', () => {
    // Northern-hemisphere clocks change in late March and late October.
    const beforeSpringForward = new Date(2025, 2, 20, 12, 0);
    const item: Item = { ...due(0), expiresOn: '2025-04-20' };
    expect(daysLeft(item, beforeSpringForward)).toBe(31);
  });
});

describe('statusOf — boundaries', () => {
  it('treats a missing expiry as no-expiry', () => {
    expect(statusOf(due(null), TODAY)).toBe('no-expiry');
  });

  it('treats anything past as expired', () => {
    expect(statusOf(due(-1), TODAY)).toBe('expired');
    expect(statusOf(due(-90), TODAY)).toBe('expired');
  });

  it('treats today as expiring, not expired', () => {
    // Still usable, still actionable — the single most important boundary.
    expect(statusOf(due(0), TODAY)).toBe('expiring');
  });

  it('treats day 10 as expiring and day 11 as ok', () => {
    expect(statusOf(due(10), TODAY)).toBe('expiring');
    expect(statusOf(due(11), TODAY)).toBe('ok');
  });
});

describe('isUrgent', () => {
  it('never counts a no-expiry item as urgent', () => {
    expect(isUrgent(due(null), TODAY)).toBe(false);
  });

  it('counts expired and expiring items', () => {
    expect(isUrgent(due(-1), TODAY)).toBe(true);
    expect(isUrgent(due(0), TODAY)).toBe(true);
    expect(isUrgent(due(10), TODAY)).toBe(true);
  });

  it('leaves comfortable items alone', () => {
    expect(isUrgent(due(11), TODAY)).toBe(false);
    expect(isUrgent(due(400), TODAY)).toBe(false);
  });
});

describe('whenLabel', () => {
  it('names the no-expiry case', () => {
    expect(whenLabel(due(null), TODAY)).toBe('No expiry');
  });

  it('says "expires today" rather than "0d left"', () => {
    expect(whenLabel(due(0), TODAY)).toBe('expires today');
  });

  it('uses the same wording for one day as for many', () => {
    expect(whenLabel(due(1), TODAY)).toBe('1d left');
    expect(whenLabel(due(4), TODAY)).toBe('4d left');
    expect(whenLabel(due(-1), TODAY)).toBe('1d overdue');
    expect(whenLabel(due(-3), TODAY)).toBe('3d overdue');
  });

  it('switches to months past 100 days', () => {
    expect(whenLabel(due(100), TODAY)).toBe('100d left');
    expect(whenLabel(due(101), TODAY)).toBe('3mo left');
    expect(whenLabel(due(180), TODAY)).toBe('6mo left');
  });

  it('switches to years past 730 days', () => {
    expect(whenLabel(due(730), TODAY)).toBe('24mo left');
    expect(whenLabel(due(731), TODAY)).toBe('2.0y left');
    expect(whenLabel(due(800), TODAY)).toBe('2.2y left');
  });
});

describe('timezone and clock safety', () => {
  it('reads "expires today" at every hour of the day', () => {
    // The bug this guards: timestamp arithmetic flips today's item to
    // "expired" partway through the afternoon.
    for (let hour = 0; hour < 24; hour += 1) {
      const now = new Date(2025, 6, 15, hour, 30);
      const item: Item = { ...due(0), expiresOn: '2025-07-15' };
      expect(whenLabel(item, now), `hour ${hour}`).toBe('expires today');
      expect(statusOf(item, now), `hour ${hour}`).toBe('expiring');
    }
  });

  it('holds the boundary at one minute before and after midnight', () => {
    const item: Item = { ...due(0), expiresOn: '2025-07-15' };
    expect(statusOf(item, new Date(2025, 6, 14, 23, 59)), 'eve').toBe('expiring');
    expect(statusOf(item, new Date(2025, 6, 15, 0, 1)), 'dawn').toBe('expiring');
    expect(statusOf(item, new Date(2025, 6, 16, 0, 1)), 'next day').toBe('expired');
  });
});

describe('byExpiry', () => {
  it('sorts soonest first and undated last', () => {
    const items = [due(null, 'Crowbar'), due(30, 'Beans'), due(-2, 'Aspirin'), due(3, 'Water')];
    const names = [...items].sort((a, b) => byExpiry(a, b, TODAY)).map((item) => item.name);
    expect(names).toEqual(['Aspirin', 'Water', 'Beans', 'Crowbar']);
  });

  it('breaks ties by name so the order stays stable', () => {
    const items = [due(5, 'Zinc'), due(5, 'Alcohol')];
    const names = [...items].sort((a, b) => byExpiry(a, b, TODAY)).map((item) => item.name);
    expect(names).toEqual(['Alcohol', 'Zinc']);
  });
});
