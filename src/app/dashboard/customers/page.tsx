import clientPromise from "@/lib/mongodb";
import type { Customer } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

async function getCustomers(): Promise<Customer[]> {
  try {
    const client = await clientPromise;
    const db = client.db();
    const customers = await db
      .collection("customers")
      .find({})
      .limit(10)
      .toArray();

    return customers.map((customer) => ({
      id: customer._id.toString(),
      name: customer.name,
      email: customer.email,
      totalSpent: customer.totalSpent,
      avatarUrl: customer.avatarUrl,
      avatarHint: customer.avatarHint,
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
}

export default async function CustomersPage() {
  const customers = await getCustomers();
  return (
    <>
      <PageHeader
        title="Customers"
        description="Here is a list of all your customers."
      >
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Customer
          </span>
        </Button>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {customers.map((customer) => (
          <Card key={customer.id}>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={customer.avatarUrl} alt={customer.name} data-ai-hint={customer.avatarHint} />
                <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{customer.name}</CardTitle>
                <CardDescription>{customer.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Total Spent:
                <span className="font-semibold text-foreground">
                  {" "}
                  ₹{customer.totalSpent.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
