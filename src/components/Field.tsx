import { useId, type ReactNode } from 'react';

interface Props {
  label: string;
  error?: string;
  /** Non-blocking note, shown amber. */
  warning?: string;
  children: (props: {
    id: string;
    'aria-invalid': boolean;
    'aria-describedby': string | undefined;
  }) => ReactNode;
}

export const inputClass =
  'w-full min-h-11 rounded-control border border-line bg-page px-3 py-2 text-ink placeholder:text-faint';

/**
 * Wraps a control with its label and messages, and wires up the aria plumbing
 * so the error is announced with the field rather than floating loose.
 */
export function Field({ label, error, warning, children }: Props) {
  const id = useId();
  const messageId = error ? `${id}-error` : warning ? `${id}-warning` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-muted">
        {label}
      </label>

      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': messageId,
      })}

      {error && (
        <p id={messageId} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
      {!error && warning && (
        <p id={messageId} className="mt-1 text-sm text-amber-600 dark:text-amber-400">
          {warning}
        </p>
      )}
    </div>
  );
}
