import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, MoreVertical } from 'lucide-react';
import type { Item } from '../types';
import { useBag } from '../context/BagContext';
import { byExpiry } from '../lib/expiry';
import { iconFor } from '../lib/icons';
import { ItemCard } from '../components/ItemCard';
import { ItemForm } from '../components/ItemForm';
import { CategoryForm } from '../components/CategoryForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';

/** Deleting a category holding items asks twice, naming the count each time. */
type DeleteStep = 'none' | 'first' | 'second';

export function CategoryDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const {
    categories,
    categoryById,
    itemsIn,
    addItem,
    updateItem,
    deleteItem,
    setQuantity,
    renameCategory,
    deleteCategory,
  } = useBag();

  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleteStep, setDeleteStep] = useState<DeleteStep>('none');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [removing, setRemoving] = useState<Item | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const category = categoryById(id);
  const items = itemsIn(id);

  const sorted = useMemo(() => [...items].sort((a, b) => byExpiry(a, b)), [items]);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  // A deleted category (or a hand-typed id) has no screen to show.
  if (!category) return <Navigate to="/" replace />;

  const Icon = iconFor(category.icon);
  const itemLabel = `${items.length} ${items.length === 1 ? 'item' : 'items'}`;

  function confirmDelete() {
    if (items.length > 0 && deleteStep === 'first') {
      setDeleteStep('second');
      return;
    }
    deleteCategory(id);
    navigate('/', { replace: true });
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <Link
        to="/"
        className="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-ink"
      >
        <ChevronLeft size={18} />
        Your bag
      </Link>

      <header className="mt-2 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Icon size={24} className="shrink-0 text-muted" />
          <div>
            <h1 className="text-2xl font-bold leading-tight break-words">
              {category.name}
            </h1>
            <p className="text-sm text-muted">{itemLabel}</p>
          </div>
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={`Actions for ${category.name}`}
            className="flex size-11 items-center justify-center rounded-control border border-line text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <MoreVertical size={18} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-card border border-line bg-page py-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setRenaming(true);
                }}
                className="block min-h-11 w-full px-4 text-left text-sm text-ink transition-colors hover:bg-surface"
              >
                Rename
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setDeleteStep('first');
                }}
                className="block min-h-11 w-full px-4 text-left text-sm text-danger transition-colors hover:bg-danger-soft"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </header>

      {sorted.length === 0 ? (
        <p className="mt-8 rounded-card border border-dashed border-line-strong p-8 text-center text-sm text-muted">
          Nothing packed here yet.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {sorted.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onQuantity={(quantity) => setQuantity(item.id, quantity)}
              onEdit={() => setEditing(item)}
              onDelete={() => setRemoving(item)}
            />
          ))}
        </ul>
      )}

      <div className="sticky bottom-0 mt-5 bg-page pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="min-h-11 w-full rounded-control bg-neutral-btn font-semibold text-on-neutral-btn transition-opacity hover:opacity-90"
        >
          Add item
        </button>
      </div>

      {adding && (
        <Modal title="Add item" onClose={() => setAdding(false)}>
          <ItemForm
            categoryId={id}
            onSubmit={(values) => {
              addItem(values);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit item" onClose={() => setEditing(null)}>
          <ItemForm
            item={editing}
            categoryId={editing.categoryId}
            onSubmit={(values) => {
              updateItem(editing.id, values);
              setEditing(null);
            }}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {renaming && (
        <Modal title="Rename category" onClose={() => setRenaming(false)}>
          <CategoryForm
            category={category}
            existing={categories}
            onSubmit={(name) => {
              renameCategory(id, name);
              setRenaming(false);
            }}
            onCancel={() => setRenaming(false)}
          />
        </Modal>
      )}

      {removing && (
        <ConfirmDialog
          title="Delete item"
          message={`“${removing.name}” will be removed from ${category.name}.`}
          confirmLabel="Delete"
          onConfirm={() => {
            deleteItem(removing.id);
            setRemoving(null);
          }}
          onCancel={() => setRemoving(null)}
        />
      )}

      {deleteStep !== 'none' && (
        <ConfirmDialog
          title={deleteStep === 'first' ? 'Delete category' : 'Are you sure?'}
          message={
            deleteStep === 'first'
              ? `“${category.name}” holds ${itemLabel}.`
              : `Deleting “${category.name}” also deletes its ${itemLabel}. This can't be undone.`
          }
          confirmLabel={deleteStep === 'first' ? 'Delete' : `Delete ${itemLabel}`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteStep('none')}
        />
      )}
    </main>
  );
}
