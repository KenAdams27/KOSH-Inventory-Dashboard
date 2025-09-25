
import clientPromise from "@/lib/mongodb";
import type { Order, Product } from "@/lib/types";
import { OrdersClientPage } from "./client-page";

async function getOrders(): Promise<Order[]> {
  if (!clientPromise) {
    console.warn('MongoDB client is not available. No orders will be fetched.');
    return [];
  }
  try {
    const client = await clientPromise;
    const dbName = process.env.DB_NAME;

    if (!dbName) {
      throw new Error('DB_NAME environment variable is not set.');
    }

    const db = client.db(dbName);
    const ordersFromDb = await db
      .collection("orders")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
      
    const orders = JSON.parse(JSON.stringify(ordersFromDb)).map((order: any) => ({
      ...order,
      id: order._id.toString(),
      createdAt: order.createdAt, 
    }));

    return orders;

  } catch (error) {
    console.error("[getOrders] Failed to fetch orders:", error);
    return [];
  }
}

async function getProducts(): Promise<Product[]> {
  if (!clientPromise) {
    return [];
  }
  try {
    const client = await clientPromise;
    const dbName = process.env.DB_NAME;
    if (!dbName) {
        throw new Error('DB_NAME environment variable is not set.');
    }
    const db = client.db(dbName);
    const productsFromDb = await db.collection("items").find({}).toArray();
    return JSON.parse(JSON.stringify(productsFromDb)).map((p: any) => ({...p, id: p._id.toString()}));
  } catch (error) {
    console.error("[getProducts] Failed to fetch products for orders page:", error);
    return [];
  }
}

export default async function OrdersPage() {
  const orders = await getOrders();
  const availableProducts = await getProducts();

  return <OrdersClientPage orders={orders} products={availableProducts} />;
}
