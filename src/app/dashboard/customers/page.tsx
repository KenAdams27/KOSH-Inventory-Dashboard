
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

    // Deep serialization using JSON.stringify and JSON.parse to ensure all nested
    // properties (like ObjectIDs in arrays) are converted to plain values.
    const customers = JSON.parse(JSON.stringify(customersFromDb)).map((customer: any) => ({
      ...customer,
      id: customer._id.toString(), // Ensure top-level id is a string
    }));

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
