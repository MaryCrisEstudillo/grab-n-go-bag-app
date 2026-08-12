import { useMemo, useState } from 'react';
import type { Item } from '../types';
import { todayISO } from '../lib/dates';
import { validateExpiry, validateItem, type ItemDraft, type ItemField } from '../lib/validation';
import { Field, inputClass } from './Field';

interface Props {
  /** Omitted when adding. */
  item?: Item;
  categoryId: string;
  onSubmit: (values: Omit<Item, 'id'>) => void;
  onCancel: () => void;
}

function toDraft(item?: Item): ItemDraft {
  return {
    name: item?.name ?? '',
    description: item?.description ?? '',
    quantity: String(item?.quantity ?? 1),
    datePacked: item?.datePacked ?? todayISO(),
    expiresOn: item?.expiresOn ?? '',
  };
}

export function ItemForm({ item, categoryId, onSubmit, onCancel }: Props) {
  const [draft, setDraft] = useState<ItemDraft>(() => toDraft(item));
  const [errors, setErrors] = useState<Partial<Record<ItemField, string>>>({});

  function set(field: ItemField, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    // Clear the message as soon as the user works on the field again.
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  // Shown live rather than on submit: a non-blocking note the user only sees
  // after saving would be a note they never see.
  const expiryWarning = useMemo(
    () => validateExpiry(draft.expiresOn, draft.datePacked).warning ?? undefined,
    [draft.expiresOn, draft.datePacked],
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const result = validateItem(draft);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    onSubmit({
      categoryId,
      name: draft.name.trim(),
      description: draft.description.trim(),
      quantity: Number(draft.quantity),
      datePacked: draft.datePacked,
      expiresOn: draft.expiresOn || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field label="Name" error={errors.name}>
        {(field) => (
          <input
            {...field}
            type="text"
            className={inputClass}
            value={draft.name}
            onChange={(event) => set('name', event.target.value)}
            placeholder="Paracetamol 500mg"
            autoComplete="off"
          />
        )}
      </Field>

      <Field label="Description" error={errors.description}>
        {(field) => (
          <input
            {...field}
            type="text"
            className={inputClass}
            value={draft.description}
            onChange={(event) => set('description', event.target.value)}
            placeholder="Optional"
            autoComplete="off"
          />
        )}
      </Field>

      <Field label="Quantity" error={errors.quantity}>
        {(field) => (
          <input
            {...field}
            type="number"
            inputMode="numeric"
            step="1"
            className={inputClass}
            value={draft.quantity}
            onChange={(event) => set('quantity', event.target.value)}
          />
        )}
      </Field>

      <Field label="Date packed" error={errors.datePacked}>
        {(field) => (
          <input
            {...field}
            type="date"
            className={inputClass}
            value={draft.datePacked}
            onChange={(event) => set('datePacked', event.target.value)}
          />
        )}
      </Field>

      <Field label="Expires on" error={errors.expiresOn} warning={expiryWarning}>
        {(field) => (
          <input
            {...field}
            type="date"
            className={inputClass}
            value={draft.expiresOn}
            onChange={(event) => set('expiresOn', event.target.value)}
          />
        )}
      </Field>
      <p className="-mt-2 text-xs text-faint">Leave blank if it doesn't expire.</p>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 flex-1 rounded-control border border-line font-medium text-muted transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent-ink"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="min-h-11 flex-1 rounded-control accent-glow-hover bg-neutral-btn font-semibold text-on-neutral-btn hover:opacity-90"
        >
          {item ? 'Save changes' : 'Add item'}
        </button>
      </div>
    </form>
  );
}
