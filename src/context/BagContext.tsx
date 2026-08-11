import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type { Category, Item } from '../types';
import { createSeedState } from '../data/seed';
import { createId } from '../lib/id';
import { clampQuantity } from '../lib/validation';
import { DEFAULT_ICON } from '../lib/icons';
import { readJSON, writeJSON, STORAGE_KEYS } from '../lib/storage';
import bagReducer, {
  initialState,
  type BagContainerState,
} from '../containers/Bag/reducer';
import {
  addCategoryAction,
  addItemAction,
  deleteCategoryAction,
  deleteItemAction,
  renameCategoryAction,
  setQuantityAction,
  updateItemAction,
  type ItemPatch,
} from '../containers/Bag/actions';
import {
  makeSelectCategoryById,
  makeSelectItemsByCategory,
  makeSelectPersistableBag,
} from '../containers/Bag/selectors';

/**
 * ─── SWAP POINT ──────────────────────────────────────────────────────────────
 * The container under `containers/Bag` owns the shape of the state and every
 * transition it can make. This provider is the wiring: it holds the reducer,
 * persists what comes out, and hands components a plain function per action.
 *
 * Today it dispatches the bare actions, which apply locally and persist to
 * `localStorage`. Pointing the app at the real service means calling the
 * matching function from `containers/Bag/effects.ts` instead — those dispatch
 * the same bare action first, so the optimistic behaviour is unchanged, then
 * settle it with `_SUCCESS` or `_FAIL`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type ItemDraftValues = Omit<Item, 'id'>;

const selectPersistableBag = makeSelectPersistableBag();

function isCategory(value: unknown): value is Category {
  const category = value as Record<string, unknown>;
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof category.id === 'string' &&
    typeof category.name === 'string' &&
    typeof category.icon === 'string'
  );
}

function isItem(value: unknown): value is Item {
  const item = value as Record<string, unknown>;
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof item.id === 'string' &&
    typeof item.categoryId === 'string' &&
    typeof item.name === 'string' &&
    typeof item.quantity === 'number' &&
    typeof item.datePacked === 'string' &&
    (item.expiresOn === null || typeof item.expiresOn === 'string')
  );
}

/** Hydrates from storage, falling back to the seed when absent or corrupt. */
function initState(): BagContainerState {
  const stored = readJSON<Partial<BagContainerState> | null>(STORAGE_KEYS.bag, null);
  if (!stored || !Array.isArray(stored.categories) || !Array.isArray(stored.items)) {
    return { ...initialState, ...createSeedState() };
  }

  return {
    ...initialState,
    categories: stored.categories.filter(isCategory),
    items: stored.items.filter(isItem).map((item) => ({
      ...item,
      description: typeof item.description === 'string' ? item.description : '',
      quantity: clampQuantity(item.quantity),
    })),
  };
}

interface BagContextValue extends BagContainerState {
  addItem: (draft: ItemDraftValues) => void;
  updateItem: (id: string, patch: ItemPatch) => void;
  deleteItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  addCategory: (name: string, icon?: string) => void;
  renameCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  itemsIn: (categoryId: string) => Item[];
  categoryById: (categoryId: string) => Category | undefined;
}

const BagContext = createContext<BagContextValue | null>(null);

export function BagProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bagReducer, undefined, initState);

  useEffect(() => {
    writeJSON(STORAGE_KEYS.bag, selectPersistableBag(state));
  }, [state]);

  const value = useMemo<BagContextValue>(
    () => ({
      ...state,

      addItem: (draft) => dispatch(addItemAction({ ...draft, id: createId('item') })),
      updateItem: (id, patch) => dispatch(updateItemAction(id, patch)),
      deleteItem: (id) => dispatch(deleteItemAction(id)),
      setQuantity: (id, quantity) => dispatch(setQuantityAction(id, quantity)),

      addCategory: (name, icon = DEFAULT_ICON) =>
        dispatch(addCategoryAction({ id: createId('cat'), name: name.trim(), icon })),
      renameCategory: (id, name) => dispatch(renameCategoryAction(id, name.trim())),
      deleteCategory: (id) => dispatch(deleteCategoryAction(id)),

      itemsIn: (categoryId) => makeSelectItemsByCategory(categoryId)(state),
      categoryById: (categoryId) => makeSelectCategoryById(categoryId)(state),
    }),
    [state],
  );

  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}

export function useBag(): BagContextValue {
  const context = useContext(BagContext);
  if (!context) throw new Error('useBag must be used inside <BagProvider>');
  return context;
}
