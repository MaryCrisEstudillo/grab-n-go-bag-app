import { describe, expect, it } from 'vitest';
import type { Category } from '../types';
import { addDays, toISODate } from './dates';
import {
  clampQuantity,
  validateCategoryName,
  validateDatePacked,
  validateExpiry,
  validateItem,
  validateName,
  validateQuantity,
  type ItemDraft,
} from './validation';

const TODAY = new Date(2025, 6, 15, 9, 30);
const at = (offset: number) => toISODate(addDays(TODAY, offset));

function draft(overrides: Partial<ItemDraft> = {}): ItemDraft {
  return {
    name: 'Paracetamol',
    description: '',
    quantity: '2',
    datePacked: at(-30),
    expiresOn: at(90),
    ...overrides,
  };
}

describe('validateName', () => {
  it('rejects an empty or whitespace-only name', () => {
    expect(validateName('')).toBe('Name the item.');
    expect(validateName('   ')).toBe('Name the item.');
  });

  it('rejects a name over 80 characters but allows exactly 80', () => {
    expect(validateName('a'.repeat(80))).toBeNull();
    expect(validateName('a'.repeat(81))).not.toBeNull();
  });

  it('measures the trimmed name', () => {
    expect(validateName(`  ${'a'.repeat(80)}  `)).toBeNull();
  });
});

describe('validateQuantity', () => {
  it('rejects a fractional quantity instead of truncating it', () => {
    expect(validateQuantity('3.5')).toBe('Quantity must be a whole number.');
  });

  it('allows zero — packed but used up is a real state', () => {
    expect(validateQuantity('0')).toBeNull();
  });

  it('rejects negatives', () => {
    expect(validateQuantity('-1')).not.toBeNull();
  });

  it('allows 9999 and rejects anything past it', () => {
    expect(validateQuantity('9999')).toBeNull();
    expect(validateQuantity('10000')).not.toBeNull();
  });

  it('rejects blank and non-numeric input', () => {
    expect(validateQuantity('')).not.toBeNull();
    expect(validateQuantity('two')).not.toBeNull();
  });
});

describe('validateDatePacked', () => {
  it('rejects a future date', () => {
    expect(validateDatePacked(at(1), TODAY)).toBe(
      "You can't pack something in the future.",
    );
  });

  it('allows today and any past date', () => {
    expect(validateDatePacked(at(0), TODAY)).toBeNull();
    expect(validateDatePacked(at(-400), TODAY)).toBeNull();
  });

  it('rejects a missing or impossible date', () => {
    expect(validateDatePacked('', TODAY)).not.toBeNull();
    expect(validateDatePacked('2025-02-30', TODAY)).toBe('Use a real date.');
  });
});

describe('validateExpiry', () => {
  it('allows no expiry at all', () => {
    expect(validateExpiry('', at(-30), TODAY)).toEqual({ error: null, warning: null });
  });

  it('rejects an expiry before the date packed', () => {
    expect(validateExpiry(at(-40), at(-30), TODAY).error).toBe(
      "Expiry can't be before the date packed.",
    );
  });

  it('allows an already-past expiry, with a note', () => {
    // You may be logging something you just found dead.
    const result = validateExpiry(at(-5), at(-30), TODAY);
    expect(result.error).toBeNull();
    expect(result.warning).not.toBeNull();
  });

  it('does not warn about an expiry still in the future', () => {
    expect(validateExpiry(at(5), at(-30), TODAY)).toEqual({ error: null, warning: null });
  });

  it('allows an expiry today without warning', () => {
    expect(validateExpiry(at(0), at(-30), TODAY).warning).toBeNull();
  });

  it('rejects an expiry more than 50 years out', () => {
    expect(validateExpiry(at(365 * 51), at(-30), TODAY).error).not.toBeNull();
    expect(validateExpiry(at(365 * 49), at(-30), TODAY).error).toBeNull();
  });
});

describe('validateItem', () => {
  it('passes a well-formed draft', () => {
    const result = validateItem(draft(), TODAY);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('collects every failing field at once', () => {
    const result = validateItem(
      draft({ name: '  ', quantity: '3.5', datePacked: at(3) }),
      TODAY,
    );
    expect(result.ok).toBe(false);
    expect(result.errors.name).toBeDefined();
    expect(result.errors.quantity).toBeDefined();
    expect(result.errors.datePacked).toBeDefined();
  });

  it('stays valid with a warning attached', () => {
    const result = validateItem(draft({ expiresOn: at(-2) }), TODAY);
    expect(result.ok).toBe(true);
    expect(result.warnings.expiresOn).toBeDefined();
  });

  it('stays valid with no expiry and a zero quantity', () => {
    const result = validateItem(draft({ expiresOn: '', quantity: '0' }), TODAY);
    expect(result.ok).toBe(true);
  });
});

describe('validateCategoryName', () => {
  const existing: Category[] = [
    { id: 'cat-1', name: 'Medicines', icon: 'Pill' },
    { id: 'cat-2', name: 'Canned goods', icon: 'Soup' },
  ];

  it('rejects an empty name', () => {
    expect(validateCategoryName('  ', existing)).toBe('Name the category.');
  });

  it('rejects a duplicate regardless of case or padding', () => {
    expect(validateCategoryName('medicines', existing)).not.toBeNull();
    expect(validateCategoryName('  MEDICINES ', existing)).not.toBeNull();
  });

  it('allows a genuinely new name', () => {
    expect(validateCategoryName('Water', existing)).toBeNull();
  });

  it('lets a category keep its own name while being renamed', () => {
    expect(validateCategoryName('Medicines', existing, 'cat-1')).toBeNull();
    expect(validateCategoryName('Medicines', existing, 'cat-2')).not.toBeNull();
  });
});

describe('clampQuantity', () => {
  it('stops at the ends instead of erroring', () => {
    expect(clampQuantity(-1)).toBe(0);
    expect(clampQuantity(10_001)).toBe(9999);
    expect(clampQuantity(5)).toBe(5);
  });

  it('falls back to the minimum for garbage input', () => {
    expect(clampQuantity(Number.NaN)).toBe(0);
  });
});
