import { Link } from 'react-router-dom';
import type { Category } from '../types';
import { iconFor } from '../lib/icons';

interface Props {
  category: Category;
  itemCount: number;
  expiredCount: number;
}

export function CategoryTile({ category, itemCount, expiredCount }: Props) {
  const Icon = iconFor(category.icon);
  const hasExpired = expiredCount > 0;

  return (
    <Link
      to={`/category/${category.id}`}
      className="accent-hover flex min-h-[7.5rem] flex-col justify-between rounded-card border border-line bg-surface p-4"
    >
      <Icon size={22} className={hasExpired ? 'text-brand' : 'text-muted'} />

      <div className="mt-3">
        <p className="font-semibold leading-tight break-words">{category.name}</p>
        <p className={`mt-0.5 text-xs ${hasExpired ? 'text-danger' : 'text-muted'}`}>
          {hasExpired
            ? `${expiredCount} expired`
            : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
        </p>
      </div>
    </Link>
  );
}
