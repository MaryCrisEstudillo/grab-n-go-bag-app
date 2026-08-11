import { describe, expect, it } from 'vitest';
import type { Category, Item } from '../../types';
import bagReducer, { initialState, type BagContainerState } from './reducer';
import {
  addCategoryAction,
  addCategoryFailAction,
  addCategorySuccessAction,
  addItemAction,
  addItemFailAction,
  addItemSuccessAction,
  deleteCategoryAction,
  loadBagAction,
  loadBagFailAction,
  loadBagSuccessAction,
  setQuantityAction,
  updateItemAction,
} from './actions';

const category = (id: string, name = 'Water'): Category => ({
  id,
  name,
  icon: 'droplet',
});

const item = (id: string, categoryId: string, overrides: Partial<Item> = {}): Item => ({
  id,
  categoryId,
  name: 'Bottled water',
  description: '',
  quantity: 2,
  datePacked: '2026-01-01',
  expiresOn: null,
  ...overrides,
});

const stateWith = (patch: Partial<BagContainerState>): BagContainerState => ({
  ...initialState,
  ...patch,
});

/**
 * Guards the bug this flag exists for: opening a link straight to a category
 * renders the page before the bag arrives, and an empty bag must not be read
 * as "no such category" and bounce the visitor to the home page.
 */
describe('knowing whether the bag has arrived', () => {
  it('starts not loaded, so nothing concludes a category is missing', () => {
    expect(initialState.loaded).toBe(false);
  });

  it('is still not loaded while the first fetch is in flight', () => {
    expect(bagReducer(initialState, loadBagAction()).loaded).toBe(false);
  });

  it('is loaded once the bag arrives, even when the bag is empty', () => {
    const next = bagReducer(
      initialState,
      loadBagSuccessAction({ categories: [], items: [] }),
    );

    expect(next.loaded).toBe(true);
    expect(next.categories).toEqual([]);
  });

  // Otherwise a dropped connection leaves every page waiting forever.
  it('is loaded even when the fetch failed', () => {
    const next = bagReducer(bagReducer(initialState, loadBagAction()), loadBagFailAction('offline'));

    expect(next.loaded).toBe(true);
    expect(next.error).toBe('offline');
  });

  it('stays loaded across a later refetch', () => {
    const loadedState = bagReducer(
      initialState,
      loadBagSuccessAction({ categories: [category('c1')], items: [] }),
    );

    expect(bagReducer(loadedState, loadBagAction()).loaded).toBe(true);
  });
});

describe('loading the bag', () => {
  it('clears any previous error when the load starts', () => {
    const next = bagReducer(stateWith({ error: 'offline' }), loadBagAction());

    expect(next.loading).toBe(true);
    expect(next.error).toBeNull();
  });

  it('replaces the whole bag on success', () => {
    const response = { categories: [category('c1')], items: [item('i1', 'c1')] };
    const next = bagReducer(
      stateWith({ loading: true, categories: [category('old')] }),
      loadBagSuccessAction(response),
    );

    expect(next).toEqual({ ...response, loading: false, loaded: true, error: null });
  });

  it('keeps what is already on screen when the load fails', () => {
    const current = stateWith({ loading: true, items: [item('i1', 'c1')] });
    const next = bagReducer(current, loadBagFailAction('offline'));

    expect(next.items).toEqual(current.items);
    expect(next.error).toBe('offline');
    expect(next.loading).toBe(false);
  });
});

describe('adding an item optimistically', () => {
  it('shows the item before the service has answered', () => {
    const next = bagReducer(initialState, addItemAction(item('local-1', 'c1')));

    expect(next.items).toHaveLength(1);
    expect(next.items[0].id).toBe('local-1');
  });

  it('swaps the local row for the stored one, keeping its position', () => {
    const start = stateWith({
      items: [item('i0', 'c1'), item('local-1', 'c1'), item('i2', 'c1')],
    });
    const stored = item('server-9', 'c1', { name: 'Bottled water (1L)' });

    const next = bagReducer(start, addItemSuccessAction('local-1', stored));

    expect(next.items.map((row) => row.id)).toEqual(['i0', 'server-9', 'i2']);
    expect(next.items[1].name).toBe('Bottled water (1L)');
  });

  it('takes the row back out when the write fails', () => {
    const start = stateWith({ items: [item('i0', 'c1'), item('local-1', 'c1')] });

    const next = bagReducer(start, addItemFailAction('local-1', 'Request failed'));

    expect(next.items.map((row) => row.id)).toEqual(['i0']);
    expect(next.error).toBe('Request failed');
  });
});

describe('adding a category optimistically', () => {
  it('reparents items filed under the local id once the real id arrives', () => {
    const start = stateWith({
      categories: [category('local-c')],
      items: [item('i1', 'local-c'), item('i2', 'other')],
    });

    const next = bagReducer(
      start,
      addCategorySuccessAction('local-c', category('server-c')),
    );

    expect(next.categories[0].id).toBe('server-c');
    expect(next.items.map((row) => row.categoryId)).toEqual(['server-c', 'other']);
  });

  it('removes the category again when the write fails', () => {
    const start = bagReducer(initialState, addCategoryAction(category('local-c')));

    const next = bagReducer(start, addCategoryFailAction('local-c', 'Nope'));

    expect(next.categories).toEqual([]);
    expect(next.error).toBe('Nope');
  });
});

describe('deleting a category', () => {
  it('takes its items with it', () => {
    const start = stateWith({
      categories: [category('c1'), category('c2', 'Tools')],
      items: [item('i1', 'c1'), item('i2', 'c2'), item('i3', 'c1')],
    });

    const next = bagReducer(start, deleteCategoryAction('c1'));

    expect(next.categories.map((row) => row.id)).toEqual(['c2']);
    expect(next.items.map((row) => row.id)).toEqual(['i2']);
  });
});

describe('quantity', () => {
  it('clamps rather than rejecting, so holding minus at 0 just stops', () => {
    const start = stateWith({ items: [item('i1', 'c1')] });

    expect(bagReducer(start, setQuantityAction('i1', -5)).items[0].quantity).toBe(0);
    expect(bagReducer(start, setQuantityAction('i1', 99999)).items[0].quantity).toBe(
      9999,
    );
  });
});

describe('reducer hygiene', () => {
  it('leaves the previous state untouched', () => {
    const start = stateWith({ items: [item('i1', 'c1')] });
    const snapshot = structuredClone(start);

    bagReducer(start, updateItemAction('i1', { name: 'Renamed' }));

    expect(start).toEqual(snapshot);
  });

  it('returns the same reference for an action it does not handle', () => {
    const start = stateWith({ items: [item('i1', 'c1')] });

    // @ts-expect-error — deliberately outside the BagAction union.
    expect(bagReducer(start, { type: 'app/Bag/NOT_A_REAL_ACTION' })).toBe(start);
  });
});
