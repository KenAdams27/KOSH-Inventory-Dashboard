
import { CustomersClientPage } from "./client-page";
import clientPromise from "@/lib/mongodb";
import type { Customer } from "@/lib/types";

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

    // Manually construct plain objects to pass to the client component.
    const customers = customersFromDb.map(customer => {
      const plainCustomer: Customer = {
        id: customer._id.toString(),
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address, // this is now an array
        cart: customer.cart,
        wishlist: customer.wishlist,
        orders: customer.orders,
      };
      return plainCustomer;
    });

    return customers;

  } catch (error) {
    console.error("[getCustomers] Failed to fetch customers:", error);
    // In case of an error, return an empty array to prevent the page from crashing.
    return [];
  }
}


export default async function CustomersPage() {
    const customers = await getCustomers();
    return <CustomersClientPage customers={customers} />;
}
