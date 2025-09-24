
import { CustomersClientPage } from "./client-page";
import clientPromise from "@/lib/mongodb";
import type { Customer } from "@/lib/types";

async function getCustomers(): Promise<Customer[]> {
  if (!clientPromise) {
    return [];
  }
  try {
    const client = await clientPromise;
    const db = client.db("kosh"); // Replace with your database name
    const customers = await db
      .collection("customers")
      .find({})
      .sort({ name: 1 })
      .toArray();

    // Map MongoDB _id to id and convert to plain objects
    return customers.map(customer => ({
      ...customer,
      id: customer._id.toString(),
    })) as unknown as Customer[];
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return [];
  }
}


export default async function CustomersPage() {
    const customers = await getCustomers();
    return <CustomersClientPage customers={customers} />;
}
