
"use client";

import { useState } from "react";
import { CalendarIcon, MoreHorizontal, PlusCircle, Search } from "lucide-react";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";

import type { Order, Product, OrderItem, ShippingAddress } from "@/lib/types";
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
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
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

type OrderStatus = "Pending" | "Delivered" | "Cancelled";
type MappedStatus = "isDelivered" | "isPending" | "isCancelled";


const statusStyles: Record<OrderStatus, string> = {
    Delivered: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    Cancelled: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};

const orderItemSchema = z.object({
  item: z.string().min(1, "Please select an item"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  size: z.string().optional(),
});

const orderSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  // For simplicity, we'll handle single item orders in the form
  item: z.string().min(1, "Please select an item"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  size: z.string().optional(),
  
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  pincode: z.string().min(1, "Pincode is required"),
  
  paymentMethod: z.enum(["Cash on Delivery", "Card", "UPI"]),
  isPaid: z.boolean().default(false),
  createdAt: z.date(),
});


function OrderForm({ onSave, products }: { onSave: (data: any) => void; products: Product[] }) {
  const form = useForm<z.infer<typeof orderSchema>>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      userId: "temp-user-id", // In a real app, this would come from auth
      item: "",
      quantity: 1,
      fullName: "",
      phone: "",
      address: "",
      city: "",
      pincode: "",
      paymentMethod: "Cash on Delivery",
      isPaid: false,
      createdAt: new Date(),
    },
  });

  function onSubmit(data: z.infer<typeof orderSchema>) {
    const product = products.find(p => p.id === data.item);
    if (!product) {
      alert("Selected product not found!");
      return;
    }

    const orderItem: OrderItem = {
      itemId: product.id,
      name: product.name,
      image: product.images[0],
      price: product.price,
      quantity: data.quantity,
      size: data.size,
    };
    
    const shippingAddress: ShippingAddress = {
      fullName: data.fullName,
      phone: data.phone,
      address: data.address,
      city: data.city,
      pincode: data.pincode,
      country: "India",
    };

    const finalOrder = {
      user: data.userId,
      orderItems: [orderItem],
      shippingAddress: shippingAddress,
      paymentMethod: data.paymentMethod,
      totalPrice: product.price * data.quantity,
      isPaid: data.isPaid,
      isDelivered: false,
      createdAt: data.createdAt.toISOString(),
    };
    
    onSave(finalOrder);
    form.reset();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
      <div className="space-y-2">
        <h4 className="font-semibold text-lg">Customer & Shipping</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" {...form.register("fullName")} />
          {form.formState.errors.fullName && <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" {...form.register("phone")} />
          {form.formState.errors.phone && <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" {...form.register("address")} />
        {form.formState.errors.address && <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>}
      </div>
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...form.register("city")} />
           {form.formState.errors.city && <p className="text-sm text-destructive">{form.formState.errors.city.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="pincode">Pincode</Label>
          <Input id="pincode" {...form.register("pincode")} />
           {form.formState.errors.pincode && <p className="text-sm text-destructive">{form.formState.errors.pincode.message}</p>}
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <h4 className="font-semibold text-lg">Order Details</h4>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        <div className="col-span-2 sm:col-span-3 space-y-2">
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
        <div className="space-y-2">
          <Label htmlFor="size">Size (optional)</Label>
          <Input id="size" {...form.register("size")} />
        </div>
      </div>
      
       <div className="space-y-2 mt-4">
        <h4 className="font-semibold text-lg">Payment</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
         <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method</Label>
           <Controller
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash on Delivery">Cash on Delivery</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="flex items-center space-x-2 pt-5">
            <Controller
                control={form.control}
                name="isPaid"
                render={({ field }) => (
                    <Switch
                        id="isPaid"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                )}
            />
            <Label htmlFor="isPaid">Mark as Paid</Label>
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
  const getStatus = (order: Order): OrderStatus => {
    if (order.isDelivered) return 'Delivered';
    // Simplified logic: If not delivered, it's pending. Real app might have 'cancelled'.
    return 'Pending'; 
  };
  const status = getStatus(order);

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Order Details</DialogTitle>
        <DialogDescription>
          Viewing details for order ID: {order.id.slice(-6)}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <h4 className="font-medium">Shipping Information</h4>
          <p className="text-sm text-muted-foreground">
            {order.shippingAddress.fullName}<br/>
            {order.shippingAddress.phone}<br/>
            {order.shippingAddress.address}<br/>
            {order.shippingAddress.city}, {order.shippingAddress.pincode}
          </p>
        </div>
        <div className="space-y-2">
           <h4 className="font-medium">Items Ordered</h4>
           {order.orderItems.map((item, index) => (
              <div key={`${item.itemId}-${item.name}-${index}`} className="text-sm text-muted-foreground">
                {item.name} (x{item.quantity})
                {item.size && ` - Size: ${item.size}`}
              </div>
            ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <h4 className="font-medium">Total</h4>
            <p className="text-sm text-muted-foreground">₹{order.totalPrice.toFixed(2)}</p>
          </div>
           <div className="space-y-1">
            <h4 className="font-medium">Date</h4>
            <p className="text-sm text-muted-foreground">{format(new Date(order.createdAt), 'PPP')}</p>
          </div>
          <div className="space-y-1">
            <h4 className="font-medium">Status</h4>
            <div className="text-sm"><Badge className={`border-none ${statusStyles[status]}`} variant="secondary">{status}</Badge></div>
          </div>
           <div className="space-y-1">
            <h4 className="font-medium">Payment</h4>
            <p className="text-sm text-muted-foreground">{order.isPaid ? `Paid (${order.paymentMethod})` : `Unpaid (${order.paymentMethod})`}</p>
          </div>
        </div>

      </div>
    </DialogContent>
  );
}

function OrdersTable({ 
  status, 
  orders,
  onViewDetails,
  onStatusChange
}: { 
  status: "All" | MappedStatus, 
  orders: Order[],
  onViewDetails: (order: Order) => void,
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void 
}) {

  const getOrderStatus = (order: Order): OrderStatus => {
    // Simplified: No 'Cancelled' state in new schema
    return order.isDelivered ? 'Delivered' : 'Pending';
  };

  const filteredOrders = orders.filter(order => {
    if (status === 'All') return true;
    if (status === 'isDelivered') return order.isDelivered;
    if (status === 'isPending') return !order.isDelivered;
    // Add isCancelled logic if schema supports it
    return false;
  });

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map(order => {
              const currentStatus = getOrderStatus(order);
              return (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="font-medium">{order.shippingAddress.fullName}</div>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                    {order.user}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge className={`border-none ${statusStyles[currentStatus]}`} variant="secondary">
                    {currentStatus}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">{format(new Date(order.createdAt), "PPP")}</TableCell>
                <TableCell className="hidden sm:table-cell text-right">₹{order.totalPrice.toFixed(2)}</TableCell>
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
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                           <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                           <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => onStatusChange(order.id, 'Delivered')}>Delivered</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onStatusChange(order.id, 'Pending')}>Pending</DropdownMenuItem>
                                {/* Add Cancelled logic if schema supports it */}
                           </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function OrdersClientPage({ orders: initialOrders, products }: { orders: Order[], products: Product[] }) {
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const handleAddOrder = (data: Omit<Order, 'id'>) => {
        const newOrder: Order = {
            id: `ord-${(Math.random() * 1000).toFixed(0)}`,
            ...data
        };

        setOrders(prev => [newOrder, ...prev]);
        setIsSheetOpen(false);
        toast({
            title: "Order Added",
            description: `A new order for ${data.shippingAddress.fullName} has been created.`,
        });
    };

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    };

    const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, isDelivered: newStatus === 'Delivered', deliveredAt: newStatus === 'Delivered' ? new Date().toISOString() : undefined } : order
        )
      );
      toast({
        title: "Order Status Updated",
        description: `Order #${orderId.slice(-6)} is now ${newStatus}.`,
      });
    };

    const searchFilteredOrders = orders.filter(order =>
      order.shippingAddress.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
          <SheetContent className="sm:max-w-2xl w-full">
            <SheetHeader>
                <SheetTitle>Add a New Order</SheetTitle>
                <SheetDescription>
                    Fill in the details below to create a new order.
                </SheetDescription>
            </SheetHeader>
             <ScrollArea className="h-[calc(100vh-8rem)]">
              <div className="p-6 pt-4">
                <OrderForm onSave={handleAddOrder} products={products} />
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </PageHeader>
      
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <Tabs defaultValue="all">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="isPending">Pending</TabsTrigger>
              <TabsTrigger value="isDelivered">Delivered</TabsTrigger>
            </TabsList>
             <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by customer..."
                className="w-full rounded-lg bg-background pl-8 sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <TabsContent value="all">
            <OrdersTable status="All" orders={searchFilteredOrders} onViewDetails={handleViewDetails} onStatusChange={handleStatusChange} />
          </TabsContent>
          <TabsContent value="isPending">
            <OrdersTable status="isPending" orders={searchFilteredOrders} onViewDetails={handleViewDetails} onStatusChange={handleStatusChange} />
          </TabsContent>
          <TabsContent value="isDelivered">
            <OrdersTable status="isDelivered" orders={searchFilteredOrders} onViewDetails={handleViewDetails} onStatusChange={handleStatusChange} />
          </TabsContent>
        </Tabs>
        {selectedOrder && <OrderDetailsDialog order={selectedOrder} />}
      </Dialog>
    </>
  );
}

    