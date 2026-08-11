/**
 * Gateway for the Bag service — the categories in the bag and the items in them
 */

import request from '../utils/request';
import type { Category, Item } from '../types';
import { readString, STORAGE_KEYS } from '../lib/storage';

const authHeader = () => {
  const token = readString(STORAGE_KEYS.token);

  return {
    Authorization: token ?? '',
  };
};

/** Ids are minted by the service, so they never appear in a request body. */
export type CategoryBody = Omit<Category, 'id'>;
export type ItemBody = Omit<Item, 'id'>;

/**
 * =================== CATEGORIES ====================
 */

/**
 * Get All Categories
 * @param {string} queryParams
 * @returns {Promise<Category[]>}
 */
export function getCategoriesAPI(queryParams?: string) {
  let url = `${import.meta.env.VITE_BAG_API_URL}/categories`;

  if (queryParams) url += queryParams;

  const requestParams = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
  } as const;

  return request<Category[]>(url, requestParams);
}

/**
 * Get Category by id
 * @param {string} id
 * @returns {Promise<Category>}
 */
export function getCategoryByIdAPI(id: string) {
  const url = `${import.meta.env.VITE_BAG_API_URL}/categories/${id}`;

  const requestParams = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
  } as const;

  return request<Category>(url, requestParams);
}

/**
 * Create a category
 * @param {Object} requestBody
 * @returns {Promise<Category>}
 */
export function createCategoryAPI(requestBody: CategoryBody) {
  const url = `${import.meta.env.VITE_BAG_API_URL}/categories`;

  const requestParams = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(requestBody),
  } as const;

  return request<Category>(url, requestParams);
}

/**
 * Update a category
 * @param {string} id
 * @param {Object} requestBody
 * @returns {Promise<Category>}
 */
export function updateCategoryAPI(id: string, requestBody: Partial<CategoryBody>) {
  const url = `${import.meta.env.VITE_BAG_API_URL}/categories/${id}`;

  const requestParams = {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(requestBody),
  } as const;

  return request<Category>(url, requestParams);
}

/**
 * Delete a category and every item filed under it
 * @param {string} id
 * @returns {Promise<null>}
 */
export function deleteCategoryAPI(id: string) {
  const url = `${import.meta.env.VITE_BAG_API_URL}/categories/${id}`;

  const requestParams = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
  } as const;

  return request<null>(url, requestParams);
}

/**
 * =================== ITEMS ====================
 */

/**
 * Get All Items
 * @param {string} queryParams
 * @returns {Promise<Item[]>}
 */
export function getItemsAPI(queryParams?: string) {
  let url = `${import.meta.env.VITE_BAG_API_URL}/items`;

  if (queryParams) url += queryParams;

  const requestParams = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
  } as const;

  return request<Item[]>(url, requestParams);
}

/**
 * Get Items by category
 * @param {string} categoryId
 * @param {string} queryParams
 * @returns {Promise<Item[]>}
 */
export function getItemsByCategoryAPI(categoryId: string, queryParams?: string) {
  let url = `${import.meta.env.VITE_BAG_API_URL}/categories/${categoryId}/items`;

  if (queryParams) url += queryParams;

  const requestParams = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
  } as const;

  return request<Item[]>(url, requestParams);
}

/**
 * Get Item by id
 * @param {string} id
 * @returns {Promise<Item>}
 */
export function getItemByIdAPI(id: string) {
  const url = `${import.meta.env.VITE_BAG_API_URL}/items/${id}`;

  const requestParams = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
  } as const;

  return request<Item>(url, requestParams);
}

/**
 * Create an item
 * @param {Object} requestBody
 * @returns {Promise<Item>}
 */
export function createItemAPI(requestBody: ItemBody) {
  const url = `${import.meta.env.VITE_BAG_API_URL}/items`;

  const requestParams = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(requestBody),
  } as const;

  return request<Item>(url, requestParams);
}

/**
 * Update an item
 * @param {string} id
 * @param {Object} requestBody
 * @returns {Promise<Item>}
 */
export function updateItemAPI(id: string, requestBody: Partial<ItemBody>) {
  const url = `${import.meta.env.VITE_BAG_API_URL}/items/${id}`;

  const requestParams = {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(requestBody),
  } as const;

  return request<Item>(url, requestParams);
}

/**
 * Update an item's quantity — its own endpoint because the stepper fires it on
 * its own, far more often than any other edit
 * @param {string} id
 * @param {Object} requestBody
 * @returns {Promise<Item>}
 */
export function updateItemQuantityAPI(id: string, requestBody: { quantity: number }) {
  const url = `${import.meta.env.VITE_BAG_API_URL}/items/${id}/quantity`;

  const requestParams = {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(requestBody),
  } as const;

  return request<Item>(url, requestParams);
}

/**
 * Delete an item
 * @param {string} id
 * @returns {Promise<null>}
 */
export function deleteItemAPI(id: string) {
  const url = `${import.meta.env.VITE_BAG_API_URL}/items/${id}`;

  const requestParams = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
  } as const;

  return request<null>(url, requestParams);
}
