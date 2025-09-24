import { products as initialProducts } from "@/lib/data";
import { InventoryClientPage } from "./client-page";

export default async function InventoryPage() {
  // In a real app, you would fetch products from a database here.
  const products = initialProducts;

  return <InventoryClientPage products={products} />;
}

    