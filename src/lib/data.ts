
import type { Product, Order, Customer, User } from './types';

export const products: Product[] = [];

export const initialOrders: Order[] = [];

export const customers: Customer[] = [];

export const user: User = {
  name: 'Admin User',
  email: 'admin@kosh.com',
  avatarUrl: 'https://picsum.photos/seed/avatar/100/100',
  avatarHint: 'default avatar',
};
