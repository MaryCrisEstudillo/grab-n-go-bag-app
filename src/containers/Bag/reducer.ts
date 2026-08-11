/*
 *
 * Bag reducer
 *
 * Pure and synchronous — the whole point is that it can be unit-tested without
 * a DOM, a network, or a store. Anything asynchronous lives in `effects.ts`.
 *
 */

import type { Category, Item } from '../../types';
import { clampQuantity } from '../../lib/validation';
import type { BagAction } from './actions';
import {
  ADD_CATEGORY,
  ADD_CATEGORY_FAIL,
  ADD_CATEGORY_SUCCESS,
  ADD_ITEM,
  ADD_ITEM_FAIL,
  ADD_ITEM_SUCCESS,
  CLEAR_ERROR,
  DELETE_CATEGORY,
  DELETE_CATEGORY_FAIL,
  DELETE_CATEGORY_SUCCESS,
  DELETE_ITEM,
  DELETE_ITEM_FAIL,
  DELETE_ITEM_SUCCESS,
  LOAD_BAG,
  LOAD_BAG_FAIL,
  LOAD_BAG_SUCCESS,
  RENAME_CATEGORY,
  RENAME_CATEGORY_FAIL,
  RENAME_CATEGORY_SUCCESS,
  SET_QUANTITY,
  SET_QUANTITY_FAIL,
  SET_QUANTITY_SUCCESS,
  UPDATE_ITEM,
  UPDATE_ITEM_FAIL,
  UPDATE_ITEM_SUCCESS,
} from './constants';

export interface BagContainerState {
  categories: Category[];
  items: Item[];
  /** Only the initial load blocks the screen; edits apply optimistically. */
  loading: boolean;
  error: string | null;
}

export const initialState: BagContainerState = {
  categories: [],
  items: [],
  loading: false,
  error: null,
};

/** Swaps the row carrying `id` for `next`, leaving order untouched. */
function replaceById<T extends { id: string }>(rows: T[], id: string, next: T): T[] {
  return rows.map((row) => (row.id === id ? next : row));
}

const bagReducer = (
  state: BagContainerState = initialState,
  action: BagAction,
): BagContainerState => {
  switch (action.type) {
    case LOAD_BAG:
      return { ...state, loading: true, error: null };

    case LOAD_BAG_SUCCESS:
      return {
        categories: action.response.categories,
        items: action.response.items,
        loading: false,
        error: null,
      };

    case LOAD_BAG_FAIL:
      return { ...state, loading: false, error: action.error };

    case CLEAR_ERROR:
      return { ...state, error: null };

    /**
     * ─── ITEMS ─────────────────────────────────────────────────────────────
     */

    case ADD_ITEM:
      return { ...state, items: [...state.items, action.item] };

    case ADD_ITEM_SUCCESS:
      // The service mints the real id, so the optimistic row is swapped whole.
      return {
        ...state,
        items: replaceById(state.items, action.localId, action.response),
      };

    case ADD_ITEM_FAIL:
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.localId),
        error: action.error,
      };

    case UPDATE_ITEM:
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.id ? { ...item, ...action.patch } : item,
        ),
      };

    case UPDATE_ITEM_SUCCESS:
      return {
        ...state,
        items: replaceById(state.items, action.response.id, action.response),
      };

    case DELETE_ITEM:
      return { ...state, items: state.items.filter((item) => item.id !== action.id) };

    case SET_QUANTITY:
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.id
            ? { ...item, quantity: clampQuantity(action.quantity) }
            : item,
        ),
      };

    case SET_QUANTITY_SUCCESS:
      return {
        ...state,
        items: replaceById(state.items, action.response.id, action.response),
      };

    /**
     * ─── CATEGORIES ────────────────────────────────────────────────────────
     */

    case ADD_CATEGORY:
      return { ...state, categories: [...state.categories, action.category] };

    case ADD_CATEGORY_SUCCESS:
      return {
        ...state,
        categories: replaceById(state.categories, action.localId, action.response),
        // Items filed under the optimistic id have to follow it.
        items: state.items.map((item) =>
          item.categoryId === action.localId
            ? { ...item, categoryId: action.response.id }
            : item,
        ),
      };

    case ADD_CATEGORY_FAIL:
      return {
        ...state,
        categories: state.categories.filter(
          (category) => category.id !== action.localId,
        ),
        error: action.error,
      };

    case RENAME_CATEGORY:
      return {
        ...state,
        categories: state.categories.map((category) =>
          category.id === action.id ? { ...category, name: action.name } : category,
        ),
      };

    case RENAME_CATEGORY_SUCCESS:
      return {
        ...state,
        categories: replaceById(
          state.categories,
          action.response.id,
          action.response,
        ),
      };

    case DELETE_CATEGORY:
      // Items belong to exactly one category, so they go with it.
      return {
        ...state,
        categories: state.categories.filter((category) => category.id !== action.id),
        items: state.items.filter((item) => item.categoryId !== action.id),
      };

    case DELETE_ITEM_SUCCESS:
    case DELETE_CATEGORY_SUCCESS:
      return { ...state, error: null };

    /**
     * The optimistic change already landed and there is no snapshot to undo it
     * with, so the effect re-issues `loadBag` to resync. Recording the error is
     * all the reducer can honestly do.
     */
    case UPDATE_ITEM_FAIL:
    case DELETE_ITEM_FAIL:
    case SET_QUANTITY_FAIL:
    case RENAME_CATEGORY_FAIL:
    case DELETE_CATEGORY_FAIL:
      return { ...state, error: action.error };

    default:
      return state;
  }
};

export default bagReducer;
