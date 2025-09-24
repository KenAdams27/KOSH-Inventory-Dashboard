export type Product = {
  id: string;
  name: string;
  brand: string;
  description?: string;
  category: "ethnicWear" | "bedsheet";
  subCategory?: string;
  images: string[];
  imageHints: string[];
  colors: string[];
  sizes: string[];
  price: number;
  rating: number;
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
  itemId: string; // Assuming ObjectId is stored as a string
  size: string;
  quantity: number;
  color: string;
};

export type Customer = {
  id:string;
  name: string;
  email: string;
  password?: string; // Should be handled securely, not sent to client
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
