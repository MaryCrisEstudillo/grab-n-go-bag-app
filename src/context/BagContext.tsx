import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type { Category, Item } from '../types';
import bagReducer, {
  initialState,
  type BagContainerState,
} from '../containers/Bag/reducer';
import { clearErrorAction, type ItemPatch } from '../containers/Bag/actions';
import * as effects from '../containers/Bag/effects';
import {
  makeSelectCategoryById,
  makeSelectItemsByCategory,
} from '../containers/Bag/selectors';
import { useAuth } from './AuthContext';

/**
 * The bag, backed by the API.
 *
 * Every write here is optimistic: the effect applies the change locally before
 * the request goes out, reconciles it on success, and undoes or resyncs on
 * failure. Components call these and don't wait — which is why the stepper
 * still feels instant over a network.
 */

export type ItemDraftValues = Omit<Item, 'id'>;

interface BagContextValue extends BagContainerState {
  addItem: (draft: ItemDraftValues) => Promise<void>;
  updateItem: (id: string, patch: ItemPatch) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  setQuantity: (id: string, quantity: number) => Promise<void>;
  addCategory: (name: string, icon?: string) => Promise<void>;
  renameCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  reload: () => Promise<void>;
  clearError: () => void;
  itemsIn: (categoryId: string) => Item[];
  categoryById: (categoryId: string) => Category | undefined;
}

const BagContext = createContext<BagContextValue | null>(null);

export function BagProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bagReducer, initialState);
  const { user } = useAuth();

  /**
   * Keyed on the signed-in user rather than mounting once: signing out and
   * back in as someone else has to fetch their bag, not keep the last one.
   */
  useEffect(() => {
    if (!user) return;
    void effects.loadBag(dispatch);
  }, [user]);

  const value = useMemo<BagContextValue>(
    () => ({
      ...state,

      addItem: (draft) => effects.addItem(dispatch, draft),
      updateItem: (id, patch) => effects.updateItem(dispatch, id, patch),
      deleteItem: (id) => effects.deleteItem(dispatch, id),
      setQuantity: (id, quantity) => effects.setQuantity(dispatch, id, quantity),

      addCategory: (name, icon) => effects.addCategory(dispatch, name, icon),
      renameCategory: (id, name) => effects.renameCategory(dispatch, id, name),
      deleteCategory: (id) => effects.deleteCategory(dispatch, id),

      reload: () => effects.loadBag(dispatch),
      clearError: () => dispatch(clearErrorAction()),

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

