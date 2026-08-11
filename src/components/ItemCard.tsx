import type { Item } from '../types';
import { statusOf } from '../lib/expiry';
import { formatShortDate } from '../lib/dates';
import { StatusBadge } from './StatusBadge';
import { QuantityStepper } from './QuantityStepper';

interface Props {
  item: Item;
  onQuantity: (quantity: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ItemCard({ item, onQuantity, onEdit, onDelete }: Props) {
  const expired = statusOf(item) === 'expired';
  const packedOn = formatShortDate(item.datePacked);
  const expiresOn = formatShortDate(item.expiresOn);

  return (
    <li
      className={`rounded-card border p-4 ${
        expired ? 'border-danger-line bg-danger-soft' : 'border-line bg-surface'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-tight break-words">{item.name}</h3>
        <StatusBadge item={item} />
      </div>

      {item.description && (
        <p className="mt-1 text-sm text-muted break-words">{item.description}</p>
      )}

      <p className="mt-1.5 text-xs text-faint">
        {packedOn ? `Packed ${packedOn}` : 'Not dated'}
        {expiresOn && ` · Expires ${expiresOn}`}
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <QuantityStepper value={item.quantity} label={item.name} onChange={onQuantity} />

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="min-h-11 rounded-control px-3 text-sm font-medium text-muted transition-colors hover:bg-page hover:text-ink"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="min-h-11 rounded-control px-3 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
