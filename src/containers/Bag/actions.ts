/*
 *
 * Bag actions
 *
 * The bare action applies the change locally the moment it is dispatched, so
 * the UI never waits on a round trip. `_SUCCESS` reconciles the optimistic row
 * with whatever the service actually stored; `_FAIL` records the error.
 *
 */

import type { BagState, Category, Item } from '../../types';
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

export type ItemPatch = Partial<Omit<Item, 'id'>>;

export function loadBagAction() {
  return { type: LOAD_BAG } as const;
}

export function loadBagSuccessAction(response: BagState) {
  return { type: LOAD_BAG_SUCCESS, response } as const;
}

export function loadBagFailAction(error: string) {
  return { type: LOAD_BAG_FAIL, error } as const;
}

export function clearErrorAction() {
  return { type: CLEAR_ERROR } as const;
}

/**
 * ─── ITEMS ───────────────────────────────────────────────────────────────────
 */

export function addItemAction(item: Item) {
  return { type: ADD_ITEM, item } as const;
}

/** @param localId the client-minted id to swap out for the stored row */
export function addItemSuccessAction(localId: string, response: Item) {
  return { type: ADD_ITEM_SUCCESS, localId, response } as const;
}

export function addItemFailAction(localId: string, error: string) {
  return { type: ADD_ITEM_FAIL, localId, error } as const;
}

export function updateItemAction(id: string, patch: ItemPatch) {
  return { type: UPDATE_ITEM, id, patch } as const;
}

export function updateItemSuccessAction(response: Item) {
  return { type: UPDATE_ITEM_SUCCESS, response } as const;
}

export function updateItemFailAction(error: string) {
  return { type: UPDATE_ITEM_FAIL, error } as const;
}

export function deleteItemAction(id: string) {
  return { type: DELETE_ITEM, id } as const;
}

export function deleteItemSuccessAction() {
  return { type: DELETE_ITEM_SUCCESS } as const;
}

export function deleteItemFailAction(error: string) {
  return { type: DELETE_ITEM_FAIL, error } as const;
}

export function setQuantityAction(id: string, quantity: number) {
  return { type: SET_QUANTITY, id, quantity } as const;
}

export function setQuantitySuccessAction(response: Item) {
  return { type: SET_QUANTITY_SUCCESS, response } as const;
}

export function setQuantityFailAction(error: string) {
  return { type: SET_QUANTITY_FAIL, error } as const;
}

/**
 * ─── CATEGORIES ──────────────────────────────────────────────────────────────
 */

export function addCategoryAction(category: Category) {
  return { type: ADD_CATEGORY, category } as const;
}

export function addCategorySuccessAction(localId: string, response: Category) {
  return { type: ADD_CATEGORY_SUCCESS, localId, response } as const;
}

export function addCategoryFailAction(localId: string, error: string) {
  return { type: ADD_CATEGORY_FAIL, localId, error } as const;
}

export function renameCategoryAction(id: string, name: string) {
  return { type: RENAME_CATEGORY, id, name } as const;
}

export function renameCategorySuccessAction(response: Category) {
  return { type: RENAME_CATEGORY_SUCCESS, response } as const;
}

export function renameCategoryFailAction(error: string) {
  return { type: RENAME_CATEGORY_FAIL, error } as const;
}

export function deleteCategoryAction(id: string) {
  return { type: DELETE_CATEGORY, id } as const;
}

export function deleteCategorySuccessAction() {
  return { type: DELETE_CATEGORY_SUCCESS } as const;
}

export function deleteCategoryFailAction(error: string) {
  return { type: DELETE_CATEGORY_FAIL, error } as const;
}

export type BagAction =
  | ReturnType<typeof loadBagAction>
  | ReturnType<typeof loadBagSuccessAction>
  | ReturnType<typeof loadBagFailAction>
  | ReturnType<typeof clearErrorAction>
  | ReturnType<typeof addItemAction>
  | ReturnType<typeof addItemSuccessAction>
  | ReturnType<typeof addItemFailAction>
  | ReturnType<typeof updateItemAction>
  | ReturnType<typeof updateItemSuccessAction>
  | ReturnType<typeof updateItemFailAction>
  | ReturnType<typeof deleteItemAction>
  | ReturnType<typeof deleteItemSuccessAction>
  | ReturnType<typeof deleteItemFailAction>
  | ReturnType<typeof setQuantityAction>
  | ReturnType<typeof setQuantitySuccessAction>
  | ReturnType<typeof setQuantityFailAction>
  | ReturnType<typeof addCategoryAction>
  | ReturnType<typeof addCategorySuccessAction>
  | ReturnType<typeof addCategoryFailAction>
  | ReturnType<typeof renameCategoryAction>
  | ReturnType<typeof renameCategorySuccessAction>
  | ReturnType<typeof renameCategoryFailAction>
  | ReturnType<typeof deleteCategoryAction>
  | ReturnType<typeof deleteCategorySuccessAction>
  | ReturnType<typeof deleteCategoryFailAction>;
