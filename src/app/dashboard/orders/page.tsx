
import clientPromise from "@/lib/mongodb";
import type { Order, Product } from "@/lib/types";
import { OrdersClientPage } from "./client-page";
import { ObjectId } from "mongodb";

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
      
    // Manually map and convert all ObjectIDs to strings, including nested ones.
    const orders = ordersFromDb.map((order) => {
      const { _id, user, orderItems, ...rest } = order;
      return {
        ...rest,
        id: _id.toString(),
        user: user.toString(),
        orderItems: orderItems.map((item: any) => {
          // Ensure itemId is converted, even if it's already a string
          if (item.itemId && !(item.itemId instanceof ObjectId)) {
             return { ...item, itemId: item.itemId.toString() };
          }
          if (item.itemId) {
             return { ...item, itemId: item.itemId.toString() };
          }
          return item;
        }),
      } as Order;
    });

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
  // The 'products' prop is not used in OrdersClientPage, so it can be removed.
  return <OrdersClientPage orders={orders} />;
}
