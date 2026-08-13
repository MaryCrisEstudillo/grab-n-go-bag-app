/*
 *
 * Bag effects
 *
 * Where a ggx-pwa container would keep `saga.ts`. Each function is one worker:
 * it dispatches the bare action, awaits the gateway, then dispatches `_SUCCESS`
 * or `_FAIL`. Effects are the only place in the container that may be async or
 * touch the network — the reducer stays pure, the components stay unaware.
 *
 */

import type { Category, Item } from '../../types';
import { createId } from '../../lib/id';
import { DEFAULT_ICON } from '../../lib/icons';
import { ApiError, InvalidJsonError, apiErrorDetail } from '../../utils/request';
import {
  createCategoryAPI,
  createItemAPI,
  deleteCategoryAPI,
  deleteItemAPI,
  getCategoriesAPI,
  getItemsAPI,
  updateCategoryAPI,
  updateItemAPI,
  updateItemQuantityAPI,
} from '../../gateways/BagApiGateway';
import {
  addCategoryAction,
  addCategoryFailAction,
  addCategorySuccessAction,
  addItemAction,
  addItemFailAction,
  addItemSuccessAction,
  deleteCategoryAction,
  deleteCategoryFailAction,
  deleteCategorySuccessAction,
  deleteItemAction,
  deleteItemFailAction,
  deleteItemSuccessAction,
  loadBagAction,
  loadBagFailAction,
  loadBagSuccessAction,
  renameCategoryAction,
  renameCategoryFailAction,
  renameCategorySuccessAction,
  setQuantityAction,
  setQuantityFailAction,
  setQuantitySuccessAction,
  updateItemAction,
  updateItemFailAction,
  updateItemSuccessAction,
  type BagAction,
  type ItemPatch,
} from './actions';

export type BagDispatch = (action: BagAction) => void;

export type ItemDraftValues = Omit<Item, 'id'>;

/** Whatever the service sent, reduced to something worth showing a person. */
function messageFrom(error: unknown): string {
  const { message } = apiErrorDetail(error);
  if (message) return message;

  if (error instanceof ApiError) return `Request failed (${error.status}).`;

  /**
   * Its message names a URL and a content type, which is for whoever
   * misconfigured the base URL, not for the person looking at the banner.
   * Checked before `Error` because it is one.
   */
  if (error instanceof InvalidJsonError) {
    return 'Couldn’t reach the server. Try again.';
  }

  if (error instanceof Error) return error.message;
  return 'Something went wrong.';
}

export async function loadBag(dispatch: BagDispatch): Promise<void> {
  dispatch(loadBagAction());

  try {
    // Independent reads, so they go together rather than in series.
    const [categories, items] = await Promise.all([getCategoriesAPI(), getItemsAPI()]);
    dispatch(loadBagSuccessAction({ categories, items }));
  } catch (error) {
    dispatch(loadBagFailAction(messageFrom(error)));
  }
}

/**
 * ─── ITEMS ───────────────────────────────────────────────────────────────────
 */

export async function addItem(
  dispatch: BagDispatch,
  draft: ItemDraftValues,
): Promise<void> {
  // Minted here so the row can be on screen before the request is answered.
  const localId = createId('item');
  dispatch(addItemAction({ ...draft, id: localId }));

  try {
    const response = await createItemAPI(draft);
    dispatch(addItemSuccessAction(localId, response));
  } catch (error) {
    dispatch(addItemFailAction(localId, messageFrom(error)));
  }
}

export async function updateItem(
  dispatch: BagDispatch,
  id: string,
  patch: ItemPatch,
): Promise<void> {
  dispatch(updateItemAction(id, patch));

  try {
    dispatch(updateItemSuccessAction(await updateItemAPI(id, patch)));
  } catch (error) {
    dispatch(updateItemFailAction(messageFrom(error)));
    await loadBag(dispatch);
  }
}

export async function deleteItem(dispatch: BagDispatch, id: string): Promise<void> {
  dispatch(deleteItemAction(id));

  try {
    await deleteItemAPI(id);
    dispatch(deleteItemSuccessAction());
  } catch (error) {
    dispatch(deleteItemFailAction(messageFrom(error)));
    await loadBag(dispatch);
  }
}

export async function setQuantity(
  dispatch: BagDispatch,
  id: string,
  quantity: number,
): Promise<void> {
  dispatch(setQuantityAction(id, quantity));

  try {
    dispatch(setQuantitySuccessAction(await updateItemQuantityAPI(id, { quantity })));
  } catch (error) {
    dispatch(setQuantityFailAction(messageFrom(error)));
    await loadBag(dispatch);
  }
}

/**
 * ─── CATEGORIES ──────────────────────────────────────────────────────────────
 */

export async function addCategory(
  dispatch: BagDispatch,
  name: string,
  icon: string = DEFAULT_ICON,
): Promise<void> {
  const localId = createId('cat');
  const body: Omit<Category, 'id'> = { name: name.trim(), icon };
  dispatch(addCategoryAction({ ...body, id: localId }));

  try {
    dispatch(addCategorySuccessAction(localId, await createCategoryAPI(body)));
  } catch (error) {
    dispatch(addCategoryFailAction(localId, messageFrom(error)));
  }
}

export async function renameCategory(
  dispatch: BagDispatch,
  id: string,
  name: string,
): Promise<void> {
  const trimmed = name.trim();
  dispatch(renameCategoryAction(id, trimmed));

  try {
    dispatch(
      renameCategorySuccessAction(await updateCategoryAPI(id, { name: trimmed })),
    );
  } catch (error) {
    dispatch(renameCategoryFailAction(messageFrom(error)));
    await loadBag(dispatch);
  }
}

export async function deleteCategory(
  dispatch: BagDispatch,
  id: string,
): Promise<void> {
  dispatch(deleteCategoryAction(id));

  try {
    await deleteCategoryAPI(id);
    dispatch(deleteCategorySuccessAction());
  } catch (error) {
    dispatch(deleteCategoryFailAction(messageFrom(error)));
    await loadBag(dispatch);
  }
}
