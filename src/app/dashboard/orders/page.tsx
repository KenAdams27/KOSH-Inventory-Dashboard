
import clientPromise from "@/lib/mongodb";
import type { Order } from "@/lib/types";
import { OrdersClientPage } from "./client-page";
import { ObjectId } from "mongodb";

export const dynamic = 'force-dynamic';

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
          const { _id: item_id, ...restOfItem } = item;
          const plainItem: any = {
            name: restOfItem.name,
            price: restOfItem.price,
            quantity: restOfItem.quantity,
          };
          if (restOfItem.image) plainItem.image = restOfItem.image;
          if (restOfItem.size) plainItem.size = restOfItem.size;
          if (restOfItem.itemId) plainItem.itemId = restOfItem.itemId.toString();
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
