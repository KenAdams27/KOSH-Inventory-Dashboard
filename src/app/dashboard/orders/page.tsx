"use client";

import { useState } from "react";
import { CalendarIcon, MoreHorizontal, PlusCircle } from "lucide-react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";

import { initialOrders, products } from "@/lib/data";
import type { Order, Product } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type OrderStatus = "Pending" | "Fulfilled" | "Cancelled";

const statusStyles: Record<OrderStatus, string> = {
    Fulfilled: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    Cancelled: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};

const orderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email address"),
  customerContact: z.string().optional(),
  customerAddress: z.string().optional(),
  item: z.string().min(1, "Please select an item"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  paid: z.boolean().default(false),
  amount: z.coerce.number().min(0, "Amount must be a positive number"),
  orderDate: z.date(),
});

function OrderForm({ onSave }: { onSave: (data: z.infer<typeof orderSchema>) => void; }) {
  const form = useForm<z.infer<typeof orderSchema>>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerContact: "",
      customerAddress: "",
      item: "",
      quantity: 1,
      paid: false,
      amount: 0,
      orderDate: new Date(),
    },
  });

  const selectedProductId = form.watch("item");

  useState(() => {
    if (selectedProductId) {
      const product = products.find(p => p.id === selectedProductId);
      if (product) {
        form.setValue("amount", product.price * form.getValues("quantity"));
      }
    }
  });


  function onSubmit(data: z.infer<typeof orderSchema>) {
    onSave(data);
    form.reset();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="customerName">Customer Name</Label>
          <Input id="customerName" {...form.register("customerName")} />
          {form.formState.errors.customerName && <p className="text-sm text-destructive">{form.formState.errors.customerName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerEmail">Customer Email</Label>
          <Input id="customerEmail" type="email" {...form.register("customerEmail")} />
          {form.formState.errors.customerEmail && <p className="text-sm text-destructive">{form.formState.errors.customerEmail.message}</p>}
        </div>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
            <Label htmlFor="customerContact">Customer Contact No.</Label>
            <Input id="customerContact" {...form.register("customerContact")} />
        </div>
         <div className="space-y-2">
            <Label htmlFor="orderDate">Order Date</Label>
             <Controller
                control={form.control}
                name="orderDate"
                render={({ field }) => (
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                )}
            />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerAddress">Customer Address</Label>
        <Textarea id="customerAddress" {...form.register("customerAddress")} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="item">Item Ordered</Label>
          <Controller
            control={form.control}
            name="item"
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.item && <p className="text-sm text-destructive">{form.formState.errors.item.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" type="number" {...form.register("quantity")} />
          {form.formState.errors.quantity && <p className="text-sm text-destructive">{form.formState.errors.quantity.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
         <div className="space-y-2">
          <Label htmlFor="amount">Amount (₹)</Label>
          <Input id="amount" type="number" step="0.01" {...form.register("amount")} />
          {form.formState.errors.amount && <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>}
        </div>
        <div className="flex items-center space-x-2 pt-5">
            <Controller
                control={form.control}
                name="paid"
                render={({ field }) => (
                    <Switch
                        id="paid"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                )}
            />
            <Label htmlFor="paid">Paid</Label>
        </div>
      </div>

      <SheetFooter className="mt-6">
        <SheetClose asChild>
          <Button type="submit">Save Order</Button>
        </SheetClose>
      </SheetFooter>
    </form>
  );
}

function OrderDetailsDialog({ order }: { order: Order }) {
  return (
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>Order Details</DialogTitle>
        <DialogDescription>
          Viewing details for order ID: {order.id}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Customer</Label>
          <div className="col-span-3">{order.customer.name} ({order.customer.email})</div>
        </div>
        {order.customer.contactNumber && (
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Contact</Label>
                <div className="col-span-3">{order.customer.contactNumber}</div>
            </div>
        )}
        {order.customer.address && (
            <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right mt-1">Address</Label>
                <div className="col-span-3 whitespace-pre-wrap">{order.customer.address}</div>
            </div>
        )}
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right mt-1">Items</Label>
          <div className="col-span-3">
            {order.items.map(item => (
              <div key={item.productId}>{item.productName} (x{item.quantity})</div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Total</Label>
          <div className="col-span-3">₹{order.total.toFixed(2)}</div>
        </div>
         <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Date</Label>
          <div className="col-span-3">{order.date}</div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Status</Label>
          <div className="col-span-3"> <Badge className={`border-none ${statusStyles[order.status]}`} variant="secondary">
            {order.status}
          </Badge></div>
        </div>
         <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Payment</Label>
          <div className="col-span-3">{order.paid ? "Paid" : "Unpaid"}</div>
        </div>
      </div>
    </DialogContent>
  );
}

function OrdersTable({ status, onViewDetails }: { status: "All" | OrderStatus, onViewDetails: (order: Order) => void }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const filteredOrders = status === "All" ? orders : orders.filter(order => order.status === status);

  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden sm:table-cell">Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map(order => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="font-medium">{order.customer.name}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                    {order.customer.email}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge className={`border-none ${statusStyles[order.status]}`} variant="secondary">
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{order.date}</TableCell>
                <TableCell className="text-right">₹{order.total.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => onViewDetails(order)}>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Mark as Fulfilled</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function OrdersPage() {
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    const handleAddOrder = (data: z.infer<typeof orderSchema>) => {
        const product = products.find(p => p.id === data.item);
        if (!product) {
            toast({
                variant: 'destructive',
                title: "Item not found",
                description: "The selected item could not be found in the inventory.",
            });
            return;
        }

        const newOrder: Order = {
            id: `ord-${(Math.random() * 1000).toFixed(0)}`,
            customer: {
                name: data.customerName,
                email: data.customerEmail,
                contactNumber: data.customerContact,
                address: data.customerAddress,
            },
            items: [{
                productId: product.id,
                productName: product.name,
                quantity: data.quantity
            }],
            paid: data.paid,
            date: format(data.orderDate, "yyyy-MM-dd"),
            status: "Pending",
            total: data.amount,
        };

        setOrders(prev => [newOrder, ...prev]);
        setIsSheetOpen(false);
        toast({
            title: "Order Added",
            description: `A new order for ${data.customerName} has been created.`,
        });
    };

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    };

  return (
    <>
      <PageHeader title="Orders" description="View and manage all customer orders.">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Order
              </span>
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-2xl">
            <SheetHeader>
                <SheetTitle>Add a New Order</SheetTitle>
                <SheetDescription>
                    Fill in the details below to create a new order.
                </SheetDescription>
            </SheetHeader>
             <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="p-6 pt-4">
                <OrderForm onSave={handleAddOrder} />
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </PageHeader>
      
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <Tabs defaultValue="all">
          <div className="flex items-center">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="Fulfilled">Fulfilled</TabsTrigger>
              <TabsTrigger value="Pending">Pending</TabsTrigger>
              <TabsTrigger value="Cancelled">Cancelled</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="all">
            <OrdersTable status="All" onViewDetails={handleViewDetails} />
          </TabsContent>
          <TabsContent value="Fulfilled">
            <OrdersTable status="Fulfilled" onViewDetails={handleViewDetails} />
          </TabsContent>
          <TabsContent value="Pending">
            <OrdersTable status="Pending" onViewDetails={handleViewDetails} />
          </TabsContent>
          <TabsContent value="Cancelled">
            <OrdersTable status="Cancelled" onViewDetails={handleViewDetails} />
          </TabsContent>
        </Tabs>
        {selectedOrder && <OrderDetailsDialog order={selectedOrder} />}
      </Dialog>
    </>
  );
}
