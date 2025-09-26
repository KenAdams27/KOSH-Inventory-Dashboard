import { InventoryClientPage } from "./client-page";
import clientPromise from "@/lib/mongodb";
import type { Product } from "@/lib/types";

export const dynamic = 'force-dynamic';

async function getProducts(): Promise<Product[]> {
  if (!clientPromise) {
    console.warn('MongoDB client is not available. No products will be fetched.');
    return [];
  }
  try {
    const client = await clientPromise;
    const dbName = process.env.DB_NAME;

    if (!dbName) {
        throw new Error('DB_NAME environment variable is not set.');
    }

    const db = client.db(dbName);
    const productsFromDb = await db
      .collection("items")
      .find({})
      .sort({ name: 1 })
      .toArray();
      
    const products = JSON.parse(JSON.stringify(productsFromDb)).map((product: any) => ({
      ...product,
      id: product._id.toString(),
    }));

    return products;

  } catch (error) {
    console.error("[getProducts] Failed to fetch products:", error);
    return [];
  }
}


export default async function InventoryPage() {
  const products = await getProducts();
  return <InventoryClientPage products={products} />;
}
