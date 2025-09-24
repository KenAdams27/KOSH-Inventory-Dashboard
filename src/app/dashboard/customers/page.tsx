
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
    const customers = await db
      .collection("users")
      .find({})
      .sort({ name: 1 })
      .toArray();

    // Map MongoDB _id to id and convert to plain objects
    return customers.map(customer => ({
      ...customer,
      id: customer._id.toString(),
      _id: undefined, // ensure _id is not passed to client
    })) as unknown as Customer[];
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    // In case of an error, return an empty array to prevent the page from crashing.
    return [];
  }
}


export default async function CustomersPage() {
    const customers = await getCustomers();
    return <CustomersClientPage customers={customers} />;
}
