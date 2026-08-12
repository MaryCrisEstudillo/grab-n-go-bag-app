import { useState } from 'react';
import type { Category } from '../types';
import { validateCategoryName } from '../lib/validation';
import { Field, inputClass } from './Field';

interface Props {
  /** Omitted when adding. */
  category?: Category;
  existing: Category[];
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

export function CategoryForm({ category, existing, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(category?.name ?? '');
  const [error, setError] = useState<string | undefined>();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const message = validateCategoryName(name, existing, category?.id);
    if (message) {
      setError(message);
      return;
    }

    onSubmit(name.trim());
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field label="Category name" error={error}>
        {(field) => (
          <input
            {...field}
            type="text"
            className={inputClass}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError(undefined);
            }}
            placeholder="Water & drinks"
            autoComplete="off"
          />
        )}
      </Field>

      <div className="flex gap-2">
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
          {category ? 'Rename' : 'Add category'}
        </button>
      </div>
    </form>
  );
}
