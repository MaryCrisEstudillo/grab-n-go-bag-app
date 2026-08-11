import { useMemo, useState } from 'react';
import { LogOut, Plus } from 'lucide-react';
import { useBag } from '../context/BagContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { statusOf } from '../lib/expiry';
import { StatCard } from '../components/StatCard';
import { CategoryTile } from '../components/CategoryTile';
import { ThemeToggle } from '../components/ThemeToggle';
import { Modal } from '../components/Modal';
import { CategoryForm } from '../components/CategoryForm';
import { Splash } from '../components/Splash';
import { ErrorBanner } from '../components/ErrorBanner';

export function Categories() {
  const {
    categories,
    items,
    addCategory,
    loaded,
    error,
    reload,
    clearError,
  } = useBag();
  const { signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const [adding, setAdding] = useState(false);

  const stats = useMemo(() => {
    let expired = 0;
    let expiring = 0;
    for (const item of items) {
      const status = statusOf(item);
      if (status === 'expired') expired += 1;
      else if (status === 'expiring') expiring += 1;
    }
    return { total: items.length, expired, expiring };
  }, [items]);

  const perCategory = useMemo(() => {
    const counts = new Map<string, { total: number; expired: number }>();
    for (const category of categories) {
      counts.set(category.id, { total: 0, expired: 0 });
    }
    for (const item of items) {
      const entry = counts.get(item.categoryId);
      if (!entry) continue;
      entry.total += 1;
      if (statusOf(item) === 'expired') entry.expired += 1;
    }
    return counts;
  }, [categories, items]);

  // Only the very first fetch blocks the screen. Once the bag has arrived, a
  // later reload happens underneath it rather than blanking it out.
  if (!loaded) return <Splash />;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Your bag</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onToggle={toggle} />
          <button
            type="button"
            onClick={signOut}
            aria-label="Sign out"
            title="Sign out"
            className="flex size-11 items-center justify-center rounded-control border border-line text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {error && (
        <ErrorBanner message={error} onRetry={reload} onDismiss={clearError} />
      )}

      <section className="mt-5 flex gap-2" aria-label="Overview">
        <StatCard label="Total items" value={stats.total} />
        <StatCard label="Expired" value={stats.expired} tone="danger" />
        <StatCard label="Expiring soon" value={stats.expiring} />
      </section>

      {/* Two columns, never three — at 380px a third column collapses the tap
          targets and wraps the labels. */}
      <section className="mt-5 grid grid-cols-2 gap-3" aria-label="Categories">
        {categories.map((category) => {
          const counts = perCategory.get(category.id) ?? { total: 0, expired: 0 };
          return (
            <CategoryTile
              key={category.id}
              category={category}
              itemCount={counts.total}
              expiredCount={counts.expired}
            />
          );
        })}

        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex min-h-[7.5rem] flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-line-strong text-muted transition-colors hover:border-ink hover:text-ink"
        >
          <Plus size={22} />
          <span className="text-sm font-medium">Add category</span>
        </button>
      </section>

      {adding && (
        <Modal title="Add category" onClose={() => setAdding(false)}>
          <CategoryForm
            existing={categories}
            onSubmit={(name) => {
              addCategory(name);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        </Modal>
      )}
    </main>
  );
}
