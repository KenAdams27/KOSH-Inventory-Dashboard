
"use client";

import { useState, useEffect } from "react";
import type { Customer, Order, Product } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";


function CustomerDetailsDialog({ customer, orders }: { customer: Customer, orders: Order[]}) {
  const customerOrders = orders.filter(
    (order) => order.user === customer.id
  );
  
  const latestAddress = customer.address && customer.address.length > 0 ? customer.address[0] : null;

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <div className="flex items-center gap-4">
           <Avatar className="h-16 w-16">
            <AvatarFallback className="text-2xl">
                {customer.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <DialogTitle className="text-2xl">{customer.name}</DialogTitle>
            <DialogDescription>{customer.email}</DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <div className="grid gap-6 py-4">
         <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label className="text-left">Customer ID</Label>
            <div className="col-span-1 sm:col-span-3 text-muted-foreground truncate">{customer.id}</div>
        </div>
         <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-2 sm:gap-4">
            <Label className="text-left">Phone</Label>
            <div className="col-span-1 sm:col-span-3 text-muted-foreground">
                {customer.phone || 'N/A'}
            </div>
        </div>
        {latestAddress && (
              <div className="grid grid-cols-1 sm:grid-cols-4 items-start gap-2 sm:gap-4">
                <Label className="text-left">Address</Label>
                <div className="col-span-1 sm:col-span-3 text-muted-foreground">
                    {latestAddress.address}, {latestAddress.city}, {latestAddress.state}, {latestAddress.pincode}
                </div>
            </div>
        )}
        <div>
          <h3 className="text-lg font-semibold mb-2">Order History</h3>
          {customerOrders.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id.slice(-6)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{format(new Date(order.createdAt), 'PPP')}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant={order.status === 'delivered' ? 'secondary' : 'default'} className="capitalize">
                            {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">₹{order.totalPrice.toFixed(2)}</TableCell>
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

export function CustomersClientPage({ customers: initialCustomers, orders, products }: { customers: Customer[], orders: Order[], products: Product[] }) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);

  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.id.toLowerCase().includes(query)
    );
  });


  if (customers.length === 0) {
      return (
         <>
            <PageHeader
                title="Customers"
                description="Here is a list of all your customers."
            >
            </PageHeader>
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
                <div className="flex flex-col items-center gap-1 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">
                        You have no customers
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Your customer list is currently empty.
                    </p>
                </div>
            </div>
        </>
      )
  }

  return (
    <>
      <PageHeader
        title="Customers"
        description="Here is a list of all your customers."
      >
        <div className="flex items-center gap-2">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search by name or ID..."
                    className="w-full sm:w-64 rounded-lg bg-background pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
      </PageHeader>
        
      <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedCustomer(null)}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="group">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex flex-row items-center gap-4 flex-1 min-w-0">
                        <Avatar className="h-12 w-12">
                            <AvatarFallback>
                                {customer.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <CardTitle className="truncate">{customer.name}</CardTitle>
                            <CardDescription className="truncate">{customer.email}</CardDescription>
                        </div>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 flex-shrink-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                           <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSelectedCustomer(customer); }}>Details</DropdownMenuItem>
                           </DialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground truncate">
                    Customer ID: {customer.id}
                  </div>
                </CardContent>
              </Card>
          ))}
        </div>
        {selectedCustomer && <CustomerDetailsDialog customer={selectedCustomer} orders={orders} />}
      </Dialog>
    </>
  );
}
