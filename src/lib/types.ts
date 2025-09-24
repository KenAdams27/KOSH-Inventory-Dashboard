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
    contactNumber?: string;
    address?: string;
  };
  items: {
    productId: string;
    productName: string;
    quantity: number;
  }[];
  paid: boolean;
  date: string;
  status: "Pending" | "Delivered" | "Cancelled";
  total: number;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  avatarUrl: string;
  avatarHint: string;
};

export type User = {
  name: string;
  email: string;
  avatarUrl: string;
  avatarHint: string;
};
