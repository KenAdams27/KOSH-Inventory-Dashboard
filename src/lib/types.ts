export type Product = {
  id: string;
  name: string;
  brand: string;
  description?: string;
  category: "Ethnic wear" | "bedsheets";
  images: string[];
  imageHints: string[];
  colors: string[];
  sizes: string[];
  price: number;
  quantity: number;
  status: "In Stock" | "Out of Stock" | "Low Stock";
};

export type Order = {
  id: string;
  customer: {
    name: string;
    email: string;
  };
  date: string;
  status: "Pending" | "Fulfilled" | "Cancelled";
  total: number;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  avatarUrl: string;
  avatarHint: string;
};

export type User = {
  name: string;
  email: string;
  avatarUrl: string;
  avatarHint: string;
};
