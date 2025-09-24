import type { Product, Order, Customer, User } from './types';

export const products: Product[] = [
  { id: 'prod-001', name: 'Acoustic Guitar', brand: 'Fender', description: 'A beautiful acoustic guitar.', category: 'Ethnic wear', images: ['https://picsum.photos/seed/guitar/400/400'], imageHints: ['acoustic guitar'], colors: ['Brown', 'Black'], sizes: ['Standard'], price: 299.99, quantity: 25, status: 'In Stock' },
  { id: 'prod-002', name: 'Electric Keyboard', brand: 'Yamaha', description: 'A 61-key electric keyboard.', category: 'Ethnic wear', images: ['https://picsum.photos/seed/keyboard/400/400'], imageHints: ['electric keyboard'], colors: ['Black'], sizes: ['61-key'], price: 449.99, quantity: 15, status: 'In Stock' },
  { id: 'prod-003', name: 'Blue Bedsheet', brand: 'Home Goods', description: 'A soft cotton bedsheet.', category: 'bedsheets', images: ['https://picsum.photos/seed/bedsheet/400/400'], imageHints: ['blue bedsheet'], colors: ['Blue', 'White'], sizes: ['Queen', 'King'], price: 79.99, quantity: 8, status: 'Low Stock' },
  { id: 'prod-004', name: 'Violin', brand: 'Stradivarius', description: 'A classic violin.', category: 'Ethnic wear', images: ['https://picsum.photos/seed/violin/400/400'], imageHints: ['violin'], colors: ['Brown'], sizes: ['4/4'], price: 199.99, quantity: 0, status: 'Out of Stock' },
  { id: 'prod-005', name: 'Red Saree', brand: 'Ethnic Styles', description: 'A traditional red saree.', category: 'Ethnic wear', images: ['https://picsum.photos/seed/saree/400/400'], imageHints: ['red saree'], colors: ['Red', 'Gold'], sizes: ['Free Size'], price: 599.99, quantity: 12, status: 'In Stock' },
];

export const initialOrders: Order[] = [
  { id: 'ord-001', customer: { name: 'Olivia Martin', email: 'olivia.martin@email.com', contactNumber: '123-456-7890', address: '123 Main St, Anytown USA' }, items: [{ productId: 'prod-001', productName: 'Acoustic Guitar', quantity: 1 }], paid: true, date: '2023-11-23', status: 'Fulfilled', total: 299.99 },
  { id: 'ord-002', customer: { name: 'Jackson Lee', email: 'jackson.lee@email.com' }, items: [{ productId: 'prod-002', productName: 'Electric Keyboard', quantity: 1 }], paid: false, date: '2023-11-24', status: 'Pending', total: 449.99 },
  { id: 'ord-003', customer: { name: 'Isabella Nguyen', email: 'isabella.nguyen@email.com' }, items: [{ productId: 'prod-003', productName: 'Blue Bedsheet', quantity: 1 }], paid: true, date: '2023-11-25', status: 'Cancelled', total: 79.99 },
  { id: 'ord-004', customer: { name: 'William Kim', email: 'will@email.com' }, items: [{ productId: 'prod-004', productName: 'Violin', quantity: 1 }], paid: true, date: '2023-11-26', status: 'Fulfilled', total: 199.99 },
  { id: 'ord-005', customer: { name: 'Sofia Davis', email: 'sofia.davis@email.com' }, items: [{ productId: 'prod-005', productName: 'Red Saree', quantity: 1 }], paid: false, date: '2023-11-27', status: 'Pending', total: 599.99 },
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
