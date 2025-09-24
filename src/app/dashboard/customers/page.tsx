
"use client";

import { useState, useEffect } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";


// This function can be extracted to a separate file if needed
async function getCustomers(): Promise<Customer[]> {
    // For the purpose of this component, we will use mock data.
    // The database connection logic has been moved to a server-side context.
    return mockCustomers;
}

const customerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
});


function CustomerForm({ onSave }: { onSave: (data: z.infer<typeof customerSchema>) => void; }) {
  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      address: "",
    },
  });

  function onSubmit(data: z.infer<typeof customerSchema>) {
    onSave(data);
    form.reset();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 p-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...form.register("name")} />
        {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" type="email" {...form.register("email")} />
        {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
      </div>
       <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input id="phoneNumber" {...form.register("phoneNumber")} />
      </div>
       <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" {...form.register("address")} />
      </div>
      <SheetFooter className="mt-6">
        <SheetClose asChild>
          <Button type="submit">Save Customer</Button>
        </SheetClose>
      </SheetFooter>
    </form>
  );
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
            <DialogDescription>{customer.email} &middot; {customer.id}</DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <div className="grid gap-6 py-4">
        {customer.phoneNumber && (
             <div className="text-lg">
                Phone:{" "}
                <span className="font-semibold">
                    {customer.phoneNumber}
                </span>
            </div>
        )}
        {customer.address && (
              <div className="text-lg">
                Address:{" "}
                <span className="font-semibold">
                    {customer.address}
                </span>
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
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    getCustomers().then(setCustomers);
  }, []);

  const handleAddCustomer = (data: z.infer<typeof customerSchema>) => {
    const newCustomer: Customer = {
        id: `cust-${(Math.random() * 1000).toFixed(0)}`,
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        address: data.address,
        avatarUrl: `https://picsum.photos/seed/${data.name.split(' ')[0]}/100/100`,
        avatarHint: 'person',
    }
    setCustomers(prev => [newCustomer, ...prev]);
    setIsSheetOpen(false);
    toast({
        title: "Customer Added",
        description: `${data.name} has been added to your customers.`
    })
  }
  
  if (customers.length === 0) {
      return (
         <>
            <PageHeader
                title="Customers"
                description="Here is a list of all your customers."
            >
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button size="sm" className="gap-1">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Add Customer
                            </span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Add a New Customer</SheetTitle>
                            <SheetDescription>
                                Fill in the details below to add a new customer.
                            </SheetDescription>
                        </SheetHeader>
                        <CustomerForm onSave={handleAddCustomer} />
                    </SheetContent>
                </Sheet>
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
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
                <Button size="sm" className="gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add Customer
                </span>
                </Button>
            </SheetTrigger>
             <SheetContent>
                <SheetHeader>
                    <SheetTitle>Add a New Customer</SheetTitle>
                    <SheetDescription>
                        Fill in the details below to add a new customer.
                    </SheetDescription>
                </SheetHeader>
                <CustomerForm onSave={handleAddCustomer} />
            </SheetContent>
        </Sheet>
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
                    Customer ID: {customer.id}
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
