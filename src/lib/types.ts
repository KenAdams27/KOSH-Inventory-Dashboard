

export type Review = {
  date: string | number | Date;
  name: string;
  rating: number;
  title: string;
  review: string;
  image?: string; // Base64 image
  createdAt: string; // ISO date string
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  brand: string;
  desc?: string;
  category: "ethnicWear" | "bedsheet";
  subCategory?: string;
  images: string[];
  colors: string[];
  sizes: string[];
  price: number;
  rating: number;
  reviews?: Review[];
  quantity: number;
  status: "In Stock" | "Out of Stock" | "Low Stock";
  onWebsite: boolean;
};

export type OrderItem = {
  itemId?: string; // Product ID
  name: string;
  image?: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
};

export type ShippingAddress = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  country: string;
};

export type Order = {
  _id: string; // Raw MongoDB ID
  id: string;
  user: string; // User ID
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: "Cash on Delivery" | "Card" | "UPI";
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string; // ISO date string
  status: 'placed' | 'dispatched' | 'delivered';
  deliveredAt?: string; // ISO date string
  createdAt: string; // ISO date string from timestamps
};


export type Address = {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export type CartItem = {
  itemId: string;
  size: string;
  quantity: number;
  color: string;
};

export type Customer = {
  id:string;
  name: string;
  email: string;
  password?: string;
  phone: string;
  wishlist?: CartItem[];
  cart?: CartItem[];
  orders?: string[]; // Array of Order IDs
  address?: Address[];
};


export type User = {
  name: string;
  email: string;
  avatarUrl: string;
  avatarHint: string;
};
