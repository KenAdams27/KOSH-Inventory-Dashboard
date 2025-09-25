
"use client";

import { useState, useEffect } from "react";
import { MoreHorizontal, Search } from "lucide-react";
import { format } from "date-fns";

import type { Order } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { updateOrderStatusAction, deleteOrderAction } from "./actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { PageHeader } from "@/components/page-header";
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

type OrderStatus = "Pending" | "Delivered" | "Cancelled";
type MappedStatus = "isDelivered" | "isPending" | "isCancelled";


const statusStyles: Record<OrderStatus, string> = {
    Delivered: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    Cancelled: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};


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
          <div className="text-sm text-muted-foreground">
            {order.shippingAddress.fullName}<br/>
            {order.shippingAddress.phone}<br/>
            {order.shippingAddress.address}<br/>
            {order.shippingAddress.city}, {order.shippingAddress.pincode}
          </div>
        </div>
        <div className="space-y-2">
           <h4 className="font-medium">Items Ordered</h4>
           {order.orderItems.map((item, index) => (
              <div key={`${item.itemId}-${item.name}-${index}`} className="text-sm text-muted-foreground">
                {item.name} {item.itemId && `(${item.itemId.slice(-6)})`} (x{item.quantity})
                {item.size && ` - Size: ${item.size}`}
              </div>
            ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <h4 className="font-medium">Total</h4>
            <div className="text-sm text-muted-foreground">₹{order.totalPrice.toFixed(2)}</div>
          </div>
           <div className="space-y-1">
            <h4 className="font-medium">Date</h4>
            <div className="text-sm text-muted-foreground">{format(new Date(order.createdAt), 'PPP')}</div>
          </div>
          <div className="space-y-1">
            <h4 className="font-medium">Status</h4>
            <Badge className={`border-none relative -left-px ${statusStyles[status]}`} variant="secondary">{status}</Badge>
          </div>
           <div className="space-y-1">
            <h4 className="font-medium">Payment</h4>
            <div className="text-sm text-muted-foreground">{order.isPaid ? `Paid (${order.paymentMethod})` : `Unpaid (${order.paymentMethod})`}</div>
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
  onStatusChange,
  onDeleteOrder
}: { 
  status: "All" | MappedStatus, 
  orders: Order[],
  onViewDetails: (order: Order) => void,
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void,
  onDeleteOrder: (orderId: string) => void
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
                  <Badge className={`border-none relative -left-px ${statusStyles[currentStatus]}`} variant="secondary">
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
                        <DropdownMenuSeparator />
                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-red-600" onSelect={(e) => e.preventDefault()}>Delete Order</DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the order for {order.shippingAddress.fullName}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDeleteOrder(order.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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

export function OrdersClientPage({ orders: initialOrders }: { orders: Order[] }) {
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

     useEffect(() => {
        setOrders(initialOrders);
    }, [initialOrders]);

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    };

    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
      const isDelivered = newStatus === 'Delivered';

      // Optimistically update the UI
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, isDelivered, deliveredAt: isDelivered ? new Date().toISOString() : undefined } : order
        )
      );

      const result = await updateOrderStatusAction(orderId, isDelivered);

      if (result.success) {
        toast({
          title: "Order Status Updated",
          description: `Order #${orderId.slice(-6)} is now ${newStatus}.`,
        });
      } else {
        // Revert the optimistic update on failure
        setOrders(initialOrders); // Revert to original server state
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
    };
    
    const handleDeleteOrder = async (orderId: string) => {
        const result = await deleteOrderAction(orderId);
        if (result.success) {
            toast({
                title: "Order Deleted",
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

    const searchFilteredOrders = orders.filter(order => {
      const query = searchQuery.toLowerCase();
      return (
        order.shippingAddress.fullName.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query)
      );
    });

  return (
    <>
      <PageHeader title="Orders" description="View and manage all customer orders." />
      
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
                placeholder="Search by name or ID..."
                className="w-full rounded-lg bg-background pl-8 sm:w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <TabsContent value="all">
            <OrdersTable status="All" orders={searchFilteredOrders} onViewDetails={handleViewDetails} onStatusChange={handleStatusChange} onDeleteOrder={handleDeleteOrder} />
          </TabsContent>
          <TabsContent value="isPending">
            <OrdersTable status="isPending" orders={searchFilteredOrders} onViewDetails={handleViewDetails} onStatusChange={handleStatusChange} onDeleteOrder={handleDeleteOrder} />
          </TabsContent>
          <TabsContent value="isDelivered">
            <OrdersTable status="isDelivered" orders={searchFilteredOrders} onViewDetails={handleViewDetails} onStatusChange={handleStatusChange} onDeleteOrder={handleDeleteOrder} />
          </TabsContent>
        </Tabs>
        {selectedOrder && <OrderDetailsDialog order={selectedOrder} />}
      </Dialog>
    </>
  );
}
