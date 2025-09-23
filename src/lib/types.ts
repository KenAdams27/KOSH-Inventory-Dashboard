export type Product = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  status: "In Stock" | "Out of Stock" | "Low Stock";
  imageUrl: string;
  imageHint: string;
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
