
import { CustomersClientPage } from "./client-page";
import clientPromise from "@/lib/mongodb";
import type { Customer, Order, Product } from "@/lib/types";
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

    // The data from MongoDB must be converted into a plain, serializable object.
    // We can do this by stringifying and then parsing the data. This ensures
    // all nested objects, including ObjectIDs, are converted to strings.
    const customers = JSON.parse(JSON.stringify(customersFromDb)).map((customer: any) => {
        const { _id, ...rest } = customer;
        return {
            ...rest,
            id: _id.toString(),
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
      const { _id, user, orderItems, isDelivered, ...rest } = order;

      // Backward compatibility for old schema
      let status: 'placed' | 'dispatched' | 'delivered' = 'placed';
      if (order.status) {
        status = order.status;
      } else if (isDelivered) {
        status = 'delivered';
      }

      return {
        ...rest,
        _id: _id.toHexString(), // Store the raw ObjectId as a string
        id: _id.toString(),
        user: user.toString(),
        status: status,
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
          if (restOfItem.color) plainItem.color = restOfItem.color;
          if (restOfItem.itemId) plainItem.itemId = restOfItem.itemId.toString();
          return plainItem;
        }),
      } as Order;
    });
    
    return orders;
  } catch (error) {
    console.error("[getOrders customers] Failed to fetch orders:", error);
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

    // Manually map and convert all ObjectIDs to strings to ensure serializable data.
    const products = JSON.parse(JSON.stringify(productsFromDb)).map((product: any) => ({
      ...product,
      id: product._id.toString(),
    }));
    return products;
  } catch (error) {
    console.error("[getProducts customers] Failed to fetch products:", error);
    return [];
  }
}

export default async function CustomersPage() {
    const customers = await getCustomers();
    const orders = await getOrders();
    const products = await getProducts();
    return <CustomersClientPage customers={customers} orders={orders} products={products} />;
}
