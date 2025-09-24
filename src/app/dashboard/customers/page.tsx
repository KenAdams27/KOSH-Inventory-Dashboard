
"use client";

import { useState } from "react";
import clientPromise from "@/lib/mongodb";
import type { Customer, Order } from "@/lib/types";
import { customers as mockCustomers, initialOrders } from "@/lib/data";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// This function can be extracted to a separate file if needed
async function getCustomers(): Promise<Customer[]> {
  const usingMockData = !process.env.MONGODB_URI || !clientPromise;

  if (usingMockData) {
    return mockCustomers;
  }

  try {
    const client = await clientPromise;
    if (!client) {
      return mockCustomers;
    }
    const db = client.db();
    const customers = await db
      .collection("customers")
      .find({})
      .limit(10)
      .toArray();

    if (customers.length === 0) {
      return mockCustomers;
    }

    return customers.map((customer) => ({
      id: customer._id.toString(),
      name: customer.name,
      email: customer.email,
      totalSpent: customer.totalSpent,
      avatarUrl: customer.avatarUrl,
      avatarHint: customer.avatarHint,
    }));
  } catch (e) {
    console.error("Failed to fetch customers, falling back to mock data.", e);
    return mockCustomers;
  }
}

function CustomerDetailsDialog({ customer }: { customer: Customer }) {
  const customerOrders = initialOrders.filter(
    (order) => order.customer.email === customer.email
  );

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <div className="flex items-center gap-4">
           <Avatar className="h-16 w-16">
            <AvatarImage src={customer.avatarUrl} alt={customer.name} data-ai-hint={customer.avatarHint} />
            <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <DialogTitle className="text-2xl">{customer.name}</DialogTitle>
            <DialogDescription>{customer.email}</DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <div className="grid gap-6 py-4">
        <div className="text-lg">
          Total Spent:{" "}
          <span className="font-semibold">
            ₹{customer.totalSpent.toLocaleString()}
          </span>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Order History</h3>
          {customerOrders.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.date}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'Delivered' ? 'secondary' : order.status === 'Cancelled' ? 'destructive' : 'default'}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">₹{order.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <p className="text-muted-foreground">No orders found for this customer.</p>
          )}
        </div>
      </div>
    </DialogContent>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useState(() => {
    getCustomers().then(setCustomers);
  }, []);
  
  if (customers.length === 0) {
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
            <p>Loading customers...</p>
        </>
      )
  }

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

      <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedCustomer(null)}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {customers.map((customer) => (
            <DialogTrigger key={customer.id} asChild onSelect={() => setSelectedCustomer(customer)} onClick={() => setSelectedCustomer(customer)}>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
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
            </DialogTrigger>
          ))}
        </div>
        {selectedCustomer && <CustomerDetailsDialog customer={selectedCustomer} />}
      </Dialog>
    </>
  );
}
