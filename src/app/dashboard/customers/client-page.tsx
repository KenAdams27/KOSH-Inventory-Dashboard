
"use client";

import { useState, useEffect } from "react";
import type { Customer, Order } from "@/lib/types";
import { initialOrders } from "@/lib/data";
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
import { MoreHorizontal, PlusCircle, User } from "lucide-react";
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

const customerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
});


function CustomerForm({ onSave, customer }: { onSave: (data: z.infer<typeof customerSchema>) => void; customer?: Customer | null }) {
  const form = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer || {
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
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <div className="flex items-center gap-4">
           <Avatar className="h-16 w-16">
            <AvatarImage src={customer.avatarUrl} alt={customer.name} data-ai-hint={customer.avatarHint} />
            <AvatarFallback>
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <DialogTitle className="text-2xl">{customer.name}</DialogTitle>
            <DialogDescription>{customer.email}</DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <div className="grid gap-6 py-4">
         <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
            <Label className="text-right sm:text-left">Customer ID</Label>
            <div className="col-span-2 sm:col-span-3">{customer.id}</div>
        </div>
        {customer.phoneNumber && (
             <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
                <Label className="text-right sm:text-left">Phone</Label>
                <div className="col-span-2 sm:col-span-3">
                    {customer.phoneNumber}
                </div>
            </div>
        )}
        {customer.address && (
              <div className="grid grid-cols-3 sm:grid-cols-4 items-start gap-4">
                <Label className="text-right sm:text-left mt-1">Address</Label>
                <div className="col-span-2 sm:col-span-3">
                    {customer.address}
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
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell className="hidden sm:table-cell">{order.date}</TableCell>
                      <TableCell className="hidden sm:table-cell">
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

export function CustomersClientPage({ customers: initialCustomers }: { customers: Customer[] }) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);

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
    // Note: This only adds to local state. You'll need to implement a server action to persist to DB.
    setCustomers(prev => [newCustomer, ...prev]);
    setIsAddSheetOpen(false);
    toast({
        title: "Customer Added",
        description: `${data.name} has been added to your customers.`
    })
  }

  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditSheetOpen(true);
  };
  
  const handleEditCustomer = (data: z.infer<typeof customerSchema>) => {
    if (!editingCustomer) return;

    // Note: This only updates local state. You'll need to implement a server action to persist to DB.
    setCustomers(prev => prev.map(c => 
        c.id === editingCustomer.id ? { ...c, ...data } : c
    ));
    setIsEditSheetOpen(false);
    setEditingCustomer(null);
    toast({
        title: "Customer Updated",
        description: `${data.name}'s information has been updated.`
    });
  }
  
  if (customers.length === 0) {
      return (
         <>
            <PageHeader
                title="Customers"
                description="Here is a list of all your customers."
            >
                <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
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
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
                <div className="flex flex-col items-center gap-1 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">
                        You have no customers
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        You can start selling as soon as you add your first product.
                    </p>
                    <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
                        <SheetTrigger asChild>
                            <Button className="mt-4">Add Customer</Button>
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
        <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
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

        <Sheet open={isEditSheetOpen} onOpenChange={(isOpen) => {
            setIsEditSheetOpen(isOpen);
            if (!isOpen) setEditingCustomer(null);
        }}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Edit Customer</SheetTitle>
                    <SheetDescription>
                        Update the details for &quot;{editingCustomer?.name}&quot;.
                    </SheetDescription>
                </SheetHeader>
                <CustomerForm onSave={handleEditCustomer} customer={editingCustomer} />
            </SheetContent>
        </Sheet>


      <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedCustomer(null)}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {customers.map((customer) => (
              <Card key={customer.id} className="group">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex flex-row items-center gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={customer.avatarUrl} alt={customer.name} data-ai-hint={customer.avatarHint} />
                            <AvatarFallback>
                              <User className="h-6 w-6" />
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle>{customer.name}</CardTitle>
                            <CardDescription>{customer.email}</CardDescription>
                        </div>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
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
                          <DropdownMenuItem onSelect={() => handleEditClick(customer)}>Edit</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Customer ID: {customer.id}
                  </div>
                </CardContent>
              </Card>
          ))}
        </div>
        {selectedCustomer && <CustomerDetailsDialog customer={selectedCustomer} />}
      </Dialog>
    </>
  );
}
