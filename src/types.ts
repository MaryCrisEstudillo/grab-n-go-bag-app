export type ItemStatus = 'expired' | 'expiring' | 'ok' | 'no-expiry';

export interface Category {
  id: string;
  name: string;
  icon: string; // lucide icon name
}

export interface Item {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  quantity: number;
  datePacked: string; // 'YYYY-MM-DD'
  expiresOn: string | null; // null is valid — a crowbar doesn't expire
}

export interface User {
  email: string;
}

export interface BagState {
  categories: Category[];
  items: Item[];
}
