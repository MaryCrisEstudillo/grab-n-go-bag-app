/*
 *
 * Bag selectors
 *
 * Factories, so a component can build the selector it needs once and hold it.
 * No `reselect` here — every selector below either returns a slice by reference
 * or filters a list small enough that memoising it would cost more than the
 * filter. Derived *ordering* is the exception and stays in `lib/expiry.ts`.
 *
 */

import type { Category, Item } from '../../types';
import { initialState, type BagContainerState } from './reducer';

/**
 * Direct selector to the bag state domain
 */
const selectBagDomain = (state: BagContainerState) => state || initialState;

const makeSelectCategories = () => (state: BagContainerState): Category[] =>
  selectBagDomain(state).categories;

const makeSelectItems = () => (state: BagContainerState): Item[] =>
  selectBagDomain(state).items;

const makeSelectLoading = () => (state: BagContainerState): boolean =>
  selectBagDomain(state).loading;

const makeSelectError = () => (state: BagContainerState): string | null =>
  selectBagDomain(state).error;

const makeSelectItemsByCategory = (categoryId: string) => (
  state: BagContainerState,
): Item[] =>
  selectBagDomain(state).items.filter((item) => item.categoryId === categoryId);

const makeSelectCategoryById = (categoryId: string) => (
  state: BagContainerState,
): Category | undefined =>
  selectBagDomain(state).categories.find((category) => category.id === categoryId);

const makeSelectItemById = (id: string) => (
  state: BagContainerState,
): Item | undefined => selectBagDomain(state).items.find((item) => item.id === id);

/** What gets persisted — the container's own loading/error flags never are. */
const makeSelectPersistableBag = () => (state: BagContainerState) => ({
  categories: selectBagDomain(state).categories,
  items: selectBagDomain(state).items,
});

export {
  selectBagDomain,
  makeSelectCategories,
  makeSelectItems,
  makeSelectLoading,
  makeSelectError,
  makeSelectItemsByCategory,
  makeSelectCategoryById,
  makeSelectItemById,
  makeSelectPersistableBag,
};
