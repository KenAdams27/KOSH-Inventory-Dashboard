
import { InventoryClientPage } from "./client-page";
import clientPromise from "@/lib/mongodb";
import type { Product } from "@/lib/types";
import { ObjectId } from "mongodb";

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
      .sort({ _id: -1 }) // Sort by ObjectId descending (latest first)
      .toArray();
      
    const products = productsFromDb.map((product) => {
      const { _id, reviews, ...rest } = product;
      return {
        ...rest,
        id: _id.toString(),
        // Ensure nested review objects are also serialized if they contain ObjectIDs
        reviews: reviews ? reviews.map((review: any) => {
          const { _id: reviewId, ...reviewRest } = review;
          return { ...reviewRest, id: reviewId ? reviewId.toString() : undefined };
        }) : [],
      } as Product;
    });

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
