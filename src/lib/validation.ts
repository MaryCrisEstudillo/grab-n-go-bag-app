import type { Category } from '../types';
import { diffInDays, parseISODate } from './dates';

export const MAX_NAME_LENGTH = 80;
export const MIN_QUANTITY = 0;
export const MAX_QUANTITY = 9999;
export const MAX_EXPIRY_YEARS = 50;

/** The form holds raw strings so `3.5` can be rejected instead of truncated to `3`. */
export interface ItemDraft {
  name: string;
  description: string;
  quantity: string;
  datePacked: string;
  /** Empty string means "no expiry", which is valid. */
  expiresOn: string;
}

export type ItemField = keyof ItemDraft;

export interface ItemValidation {
  ok: boolean;
  errors: Partial<Record<ItemField, string>>;
  /** Non-blocking notes, shown amber under the field. */
  warnings: Partial<Record<ItemField, string>>;
}

export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Name the item.';
  if (trimmed.length > MAX_NAME_LENGTH) {
    return `Keep the name under ${MAX_NAME_LENGTH} characters.`;
  }
  return null;
}

export function validateQuantity(quantity: string): string | null {
  const trimmed = quantity.trim();
  if (!trimmed) return 'Enter a quantity.';

  const value = Number(trimmed);
  if (!Number.isFinite(value)) return 'Enter a quantity.';
  // A packed-but-used-up item is a real state, so 0 is allowed — but 3.5 is not
  // silently truncated to 3.
  if (!Number.isInteger(value)) return 'Quantity must be a whole number.';
  if (value < MIN_QUANTITY) return "Quantity can't be negative.";
  if (value > MAX_QUANTITY) return `Quantity can't be over ${MAX_QUANTITY}.`;
  return null;
}

export function validateDatePacked(
  datePacked: string,
  today = new Date(),
): string | null {
  if (!datePacked.trim()) return 'Add the date you packed it.';

  const packed = parseISODate(datePacked);
  if (!packed) return 'Use a real date.';
  if (diffInDays(today, packed) > 0) {
    return "You can't pack something in the future.";
  }
  return null;
}

export interface ExpiryCheck {
  error: string | null;
  warning: string | null;
}

export function validateExpiry(
  expiresOn: string,
  datePacked: string,
  today = new Date(),
): ExpiryCheck {
  // No expiry at all is valid — a crowbar doesn't expire.
  if (!expiresOn.trim()) return { error: null, warning: null };

  const expiry = parseISODate(expiresOn);
  if (!expiry) return { error: 'Use a real date.', warning: null };

  const packed = parseISODate(datePacked);
  if (packed && diffInDays(packed, expiry) < 0) {
    return { error: "Expiry can't be before the date packed.", warning: null };
  }

  // Catches the mistyped '2206'.
  const limit = new Date(today.getFullYear() + MAX_EXPIRY_YEARS, today.getMonth(), today.getDate());
  if (diffInDays(limit, expiry) > 0) {
    return { error: `Expiry can't be more than ${MAX_EXPIRY_YEARS} years out.`, warning: null };
  }

  // Allowed — you may be logging something you just found dead.
  if (diffInDays(today, expiry) < 0) {
    return { error: null, warning: 'This date has already passed.' };
  }

  return { error: null, warning: null };
}

export function validateItem(draft: ItemDraft, today = new Date()): ItemValidation {
  const errors: Partial<Record<ItemField, string>> = {};
  const warnings: Partial<Record<ItemField, string>> = {};

  const nameError = validateName(draft.name);
  if (nameError) errors.name = nameError;

  const quantityError = validateQuantity(draft.quantity);
  if (quantityError) errors.quantity = quantityError;

  const packedError = validateDatePacked(draft.datePacked, today);
  if (packedError) errors.datePacked = packedError;

  const expiry = validateExpiry(draft.expiresOn, draft.datePacked, today);
  if (expiry.error) errors.expiresOn = expiry.error;
  if (expiry.warning) warnings.expiresOn = expiry.warning;

  return { ok: Object.keys(errors).length === 0, errors, warnings };
}

/**
 * @param existing every category, including the one being renamed
 * @param currentId the category being renamed, so it doesn't collide with itself
 */
export function validateCategoryName(
  name: string,
  existing: Category[],
  currentId?: string,
): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Name the category.';
  if (trimmed.length > MAX_NAME_LENGTH) {
    return `Keep the name under ${MAX_NAME_LENGTH} characters.`;
  }

  const clash = existing.some(
    (category) =>
      category.id !== currentId &&
      category.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (clash) return 'You already have a category with that name.';

  return null;
}

/** Keeps the stepper inside range instead of erroring — holding minus at 0 just stops. */
export function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return MIN_QUANTITY;
  return Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, Math.trunc(quantity)));
}
