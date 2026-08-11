import type { Item } from '../types';
import { statusOf, whenLabel } from '../lib/expiry';

/**
 * Colour is never the only signal — the wording alone ("Expired", "4d left")
 * carries the state, so the card still reads in greyscale.
 */
export function StatusBadge({ item }: { item: Item }) {
  const status = statusOf(item);

  if (status === 'expired') {
    return (
      <span className="shrink-0 rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-on-brand">
        Expired
      </span>
    );
  }

  if (status === 'no-expiry') {
    return <span className="shrink-0 text-xs text-faint">No expiry</span>;
  }

  const urgent = status === 'expiring';

  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${
        urgent ? 'border-danger-line text-danger' : 'border-line-strong text-muted'
      }`}
    >
      {whenLabel(item)}
    </span>
  );
}
