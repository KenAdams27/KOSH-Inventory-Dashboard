import type { Product, Order, Customer, User } from './types';

export const products: Product[] = [
  { id: 'prod-001', name: 'Acoustic Guitar', price: 299.99, quantity: 25, status: 'In Stock', imageUrl: 'https://picsum.photos/seed/guitar/400/400', imageHint: 'acoustic guitar' },
  { id: 'prod-002', name: 'Electric Keyboard', price: 449.99, quantity: 15, status: 'In Stock', imageUrl: 'https://picsum.photos/seed/keyboard/400/400', imageHint: 'electric keyboard' },
  { id: 'prod-003', name: 'Drum Set', price: 799.99, quantity: 8, status: 'Low Stock', imageUrl: 'https://picsum.photos/seed/drums/400/400', imageHint: 'drum set' },
  { id: 'prod-004', name: 'Violin', price: 199.99, quantity: 0, status: 'Out of Stock', imageUrl: 'https://picsum.photos/seed/violin/400/400', imageHint: 'violin' },
  { id: 'prod-005', name: 'Saxophone', price: 599.99, quantity: 12, status: 'In Stock', imageUrl: 'https://picsum.photos/seed/sax/400/400', imageHint: 'saxophone' },
];

export const orders: Order[] = [
  { id: 'ord-001', customer: { name: 'Olivia Martin', email: 'olivia.martin@email.com' }, date: '2023-11-23', status: 'Fulfilled', total: 299.99 },
  { id: 'ord-002', customer: { name: 'Jackson Lee', email: 'jackson.lee@email.com' }, date: '2023-11-24', status: 'Pending', total: 449.99 },
  { id: 'ord-003', customer: { name: 'Isabella Nguyen', email: 'isabella.nguyen@email.com' }, date: '2023-11-25', status: 'Cancelled', total: 799.99 },
  { id: 'ord-004', customer: { name: 'William Kim', email: 'will@email.com' }, date: '2023-11-26', status: 'Fulfilled', total: 199.99 },
  { id: 'ord-005', customer: { name: 'Sofia Davis', email: 'sofia.davis@email.com' }, date: '2023-11-27', status: 'Pending', total: 599.99 },
];

export const customers: Customer[] = [
  { id: 'cust-001', name: 'Olivia Martin', email: 'olivia.martin@email.com', totalSpent: 2500, avatarUrl: 'https://picsum.photos/seed/avatar1/100/100', avatarHint: 'woman portrait' },
  { id: 'cust-002', name: 'Jackson Lee', email: 'jackson.lee@email.com', totalSpent: 1750, avatarUrl: 'https://picsum.photos/seed/avatar2/100/100', avatarHint: 'man portrait' },
  { id: 'cust-003', name: 'Isabella Nguyen', email: 'isabella.nguyen@email.com', totalSpent: 3200, avatarUrl: 'https://picsum.photos/seed/avatar3/100/100', avatarHint: 'woman sunglasses' },
  { id: 'cust-004', name: 'William Kim', email: 'will@email.com', totalSpent: 800, avatarUrl: 'https://picsum.photos/seed/avatar4/100/100', avatarHint: 'man glasses' },
  { id: 'cust-005', name: 'Sofia Davis', email: 'sofia.davis@email.com', totalSpent: 4500, avatarUrl: 'https://picsum.photos/seed/avatar5/100/100', avatarHint: 'woman smiling' },
];

export const user: User = {
  name: 'Admin User',
  email: 'admin@kosh.com',
  avatarUrl: 'https://picsum.photos/seed/admin/100/100',
  avatarHint: 'professional woman',
};
