
import { CustomersClientPage } from "./client-page";
import clientPromise from "@/lib/mongodb";
import type { Customer, Order } from "@/lib/types";
import { ObjectId } from "mongodb";

export const dynamic = 'force-dynamic';

async function getCustomers(): Promise<Customer[]> {
  if (!clientPromise) {
    console.warn('MongoDB client is not available. No customers will be fetched.');
    return [];
  }
  try {
    const client = await clientPromise;
    const dbName = process.env.DB_NAME;

    if (!dbName) {
        throw new Error('DB_NAME environment variable is not set.');
    }

    const db = client.db(dbName);
    const customersFromDb = await db
      .collection("users")
      .find({})
      .sort({ name: 1 })
      .toArray();

    // Manually map and convert all ObjectIDs to strings, including nested ones.
    const customers = customersFromDb.map((customer) => {
      const { _id, cart, wishlist, orders, ...rest } = customer;
      
      const convertCartItems = (items: any[] | undefined) => {
        if (!items) return [];
        return items.map(item => {
          const { _id: item_id, ...restOfItem } = item;
          return {
            ...restOfItem,
            itemId: item.itemId ? item.itemId.toString() : undefined,
          }
        });
      };

      return {
        ...rest,
        id: _id.toString(),
        cart: convertCartItems(cart),
        wishlist: convertCartItems(wishlist),
        orders: orders ? orders.map((orderId: any) => orderId.toString()) : [],
      } as Customer;
    });

    return customers;

  } catch (error) {
    console.error("[getCustomers] Failed to fetch customers:", error);
    // In case of an error, return an empty array to prevent the page from crashing.
    return [];
  }
}

async function getOrders(): Promise<Order[]> {
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
    const ordersFromDb = await db.collection("orders").find({}).sort({ createdAt: -1 }).toArray();

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
  } catch (error) => {
    console.error("[getOrders customers] Failed to fetch orders:", error);
    return [];
  }
}


export default async function CustomersPage() {
    const customers = await getCustomers();
    const orders = await getOrders();
    return <CustomersClientPage customers={customers} orders={orders} />;
}
