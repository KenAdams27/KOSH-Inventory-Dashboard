import type { Product } from "@/lib/types";

export function calculateProductStatus(
  quantity: number
): Product["status"] {
  if (quantity === 0) return "Out of Stock";
  if (quantity <= 5) return "Low Stock";
  return "In Stock";
}
