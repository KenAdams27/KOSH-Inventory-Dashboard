
import clientPromise from "@/lib/mongodb";
import type { Order } from "@/lib/types";
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
          // Ensure item is a plain object without complex types
          const plainItem: any = {
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          };
          if (item.image) plainItem.image = item.image;
          if (item.size) plainItem.size = item.size;
          if (item.itemId) plainItem.itemId = item.itemId.toString();
          return plainItem;
        }),
      } as Order;
    });

    return orders;

  } catch (error) {
    console.error("[getOrders] Failed to fetch orders:", error);
    return [];
  }
}

export default async function OrdersPage() {
  const orders = await getOrders();
  return <OrdersClientPage orders={orders} />;
}
