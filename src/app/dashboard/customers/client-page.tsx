
"use client";

import { useState, useEffect } from "react";
import type { Customer, Order } from "@/lib/types";
import { initialOrders } from "@/lib/data";
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
import { MoreHorizontal, PlusCircle } from "lucide-react";
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
import { addCustomerAction, updateCustomerAction, deleteCustomerAction } from "./actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
    .refine(value => /^(?=.*[A-Z])/.test(value), {
      message: 'Password must include at least one capital letter.'
    })
    .refine(value => /^(?=.*[!@#$%^&*])/.test(value), {
      message: 'Password must include at least one special character (!@#$%^&*).'
    }),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'),
  // Address is handled separately in a real app, simplified here
});

const updateCustomerSchema = customerSchema.omit({ password: true }).extend({
    password: z.string().optional(),
});


function CustomerForm({ onSave, customer, onSheetOpenChange }: { onSave: (data: any) => Promise<void>; customer?: Customer | null, onSheetOpenChange: (isOpen: boolean) => void }) {
  const isEditing = !!customer;
  
  const form = useForm({
    resolver: zodResolver(isEditing ? updateCustomerSchema : customerSchema),
    defaultValues: customer ? {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      password: "",
    } : {
      name: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  async function onSubmit(data: any) {
    // Don't submit empty password on edit
    if (isEditing && !data.password) {
      delete data.password;
    }
    await onSave(data);
    form.reset();
    onSheetOpenChange(false);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 p-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...form.register("name")} />
        {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message as string}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input id="email" type="email" {...form.register("email")} />
        {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message as string}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" {...form.register("phone")} />
         {form.formState.errors.phone && <p className="text-sm text-destructive">{form.formState.errors.phone.message as string}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{isEditing ? "New Password" : "Password"}</Label>
        <Input id="password" type="password" {...form.register("password")} />
        {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message as string}</p>}
        {isEditing && <p className="text-xs text-muted-foreground">Leave blank to keep current password.</p>}
      </div>
      <SheetFooter className="mt-6">
          <Button type="submit">Save Customer</Button>
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
         <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
            <Label className="text-right sm:text-left">Customer ID</Label>
            <div className="col-span-2 sm:col-span-3">{customer.id}</div>
        </div>
         <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
            <Label className="text-right sm:text-left">Phone</Label>
            <div className="col-span-2 sm:col-span-3">
                {customer.phone}
            </div>
        </div>
        {customer.address && customer.address.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 items-start gap-4">
                <Label className="text-right sm:text-left mt-1">Address</Label>
                <div className="col-span-2 sm:col-span-3">
                    {customer.address[0].address}, {customer.address[0].city}, {customer.address[0].state} - {customer.address[0].pincode}
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

  const handleAddCustomer = async (data: any) => {
    const result = await addCustomerAction(data);
    if (result.success) {
      toast({
        title: "Customer Added",
        description: result.message,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      });
    }
  };

  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditSheetOpen(true);
  };
  
  const handleEditCustomer = async (data: any) => {
    if (!editingCustomer) return;

    const result = await updateCustomerAction(editingCustomer.id, data);
    if (result.success) {
        toast({
            title: "Customer Updated",
            description: result.message,
        });
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: result.message,
        });
    }
    setEditingCustomer(null);
  };
  
  const handleDeleteCustomer = async (customerId: string) => {
    const result = await deleteCustomerAction(customerId);
    if (result.success) {
      toast({
        title: "Customer Deleted",
        description: result.message,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.message,
      });
    }
  };

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
                        <CustomerForm onSave={handleAddCustomer} onSheetOpenChange={setIsAddSheetOpen} />
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
                            <CustomerForm onSave={handleAddCustomer} onSheetOpenChange={setIsAddSheetOpen} />
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
                <CustomerForm onSave={handleAddCustomer} onSheetOpenChange={setIsAddSheetOpen} />
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
                <CustomerForm onSave={handleEditCustomer} customer={editingCustomer} onSheetOpenChange={setIsEditSheetOpen} />
            </SheetContent>
        </Sheet>
        
      <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedCustomer(null)}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {customers.map((customer) => (
              <Card key={customer.id} className="group">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex flex-row items-center gap-4">
                        <Avatar className="h-12 w-12">
                            <AvatarFallback>
                                {customer.name.charAt(0).toUpperCase()}
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
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the customer &quot;{customer.name}&quot;.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteCustomer(customer.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
