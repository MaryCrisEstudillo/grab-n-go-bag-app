import { Minus, Plus } from 'lucide-react';
import { MAX_QUANTITY, MIN_QUANTITY, clampQuantity } from '../lib/validation';

interface Props {
  value: number;
  label: string;
  onChange: (quantity: number) => void;
}

/** Clamps rather than errors — holding minus at zero should just stop. */
export function QuantityStepper({ value, label, onChange }: Props) {
  const buttonClass =
    'flex size-11 items-center justify-center rounded-control border border-line text-ink transition-colors enabled:hover:bg-surface disabled:opacity-35';

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(clampQuantity(value - 1))}
        disabled={value <= MIN_QUANTITY}
        aria-label={`Decrease quantity of ${label}`}
      >
        <Minus size={16} />
      </button>

      <span
        className="min-w-9 text-center text-sm font-semibold tabular-nums"
        aria-live="polite"
      >
        {value}
      </span>

      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(clampQuantity(value + 1))}
        disabled={value >= MAX_QUANTITY}
        aria-label={`Increase quantity of ${label}`}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
