
"use client";

import { useState } from "react";
import type { Order } from "@/lib/types";

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
import { Badge } from "../ui/badge";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type OrderStatus = 'placed' | 'dispatched' | 'delivered';

const statusStyles: Record<OrderStatus, string> = {
    delivered: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    placed: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    dispatched: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
};


function OrderDetailsDialog({ order, open, onOpenChange }: { order: Order; open: boolean; onOpenChange: (open: boolean) => void }) {
  if (!order) return null;

  const status = order.status;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
        <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
            Viewing details for order ID: {order._id}
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
              <TooltipProvider delayDuration={0}>
                {order.orderItems.map((item, index) => (
                  <div key={`${item.itemId}-${item.name}-${index}`} className="text-sm text-muted-foreground">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-medium cursor-pointer">{item.name}</span>
                      </TooltipTrigger>
                      {item.itemId && (
                        <TooltipContent>
                          <p>Product ID: {item.itemId}</p>
                           <p>SKUID: {"VN_170" + "_" + (item.color ? item.color.toUpperCase().substring(0,2) : 'NA') + "_" + item.size}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                    {` (x${item.quantity})`}
                    {item.size && ` - Size: ${item.size}`}
                    {item.color && ` - Color: ${item.color}`}
                  </div>
                ))}
              </TooltipProvider>
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
                <div className="text-sm"><Badge className={`border-none capitalize ${statusStyles[status]}`} variant="secondary">{status}</Badge></div>
            </div>
            <div className="space-y-1">
                <h4 className="font-medium">Payment</h4>
                <p className="text-sm text-muted-foreground">{order.isPaid ? `Paid (${order.paymentMethod})` : `Unpaid (${order.paymentMethod})`}</p>
            </div>
            </div>

        </div>
        </DialogContent>
    </Dialog>
  );
}

export function RecentSales({ orders }: { orders: Order[] }) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleDialogClose = () => {
    setSelectedOrder(null);
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>
            Here are the most recent items sold.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="space-y-4">
              {orders.slice(0, 5).map((order) => {
                const firstItem = order.orderItems[0];
                return (
                  <div
                    key={order.id}
                    className="flex items-center gap-4 cursor-pointer hover:bg-muted/50 p-2 rounded-md"
                    onClick={() => handleOrderClick(order)}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">
                        {firstItem.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.shippingAddress.fullName}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      +₹{order.totalPrice.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No recent sales.
            </div>
          )}
        </CardContent>
      </Card>
      {selectedOrder && (
          <OrderDetailsDialog 
            order={selectedOrder} 
            open={!!selectedOrder} 
            onOpenChange={(open) => !open && handleDialogClose()} 
          />
      )}
    </>
  );
}

    
    