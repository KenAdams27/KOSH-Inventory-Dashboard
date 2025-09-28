
"use client";

import { useState, useEffect } from "react";
import { MoreHorizontal, Search, Download } from "lucide-react";
import { format } from "date-fns";
import jsPDF from 'jspdf';


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
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type OrderStatus = "placed" | "dispatched" | "delivered";


const statusStyles: Record<OrderStatus, string> = {
    delivered: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    placed: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    dispatched: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
};


// Helper function to generate a single shipping label page
const generateLabelPage = (doc: jsPDF, order: Order, yOffset: number = 10) => {
    const { shippingAddress } = order;
    const labelHeight = 50;

    doc.setProperties({
        title: `Shipping Label - ${order.id}`,
    });
    doc.rect(10, yOffset, 190, labelHeight);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Shipping Label (${order.id.substring(order.id.length - 4, order.id.length)})`, 105, yOffset + 10, { align: 'center' });
    doc.setLineDashPattern([1, 1], 0);
    doc.line(10, yOffset + 15, 200, yOffset + 15);
    doc.setLineDashPattern([], 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("FROM:", 15, yOffset + 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const fromAddress = [
      "KUNAL Enterprises",
      "House no 8,B road Ashok Vihar",
      "Sobhagpura 100ft Road",
      "Off University Road",
      "Udaipur 313001"
    ];
    doc.text(fromAddress, 15, yOffset + 25, { lineHeightFactor: 1.2 });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("TO:", 110, yOffset + 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const customerAddress = [
        shippingAddress.fullName,
        shippingAddress.address,
        `${shippingAddress.city}, ${shippingAddress.pincode}`,
        `Contact: ${shippingAddress.phone}`
    ];
    doc.text(customerAddress, 110, yOffset + 27, { lineHeightFactor: 1.2 });

    return yOffset + labelHeight;
};


function OrderDetailsDialog({ order }: { order: Order }) {
  const status = order.status;

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    generateLabelPage(doc, order);
    doc.save(`shipping-label-${order.id}.pdf`);
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Order Details</DialogTitle>
        <DialogDescription>
          Viewing details for order ID: {order.id}
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
            <h4 className="font-medium">Customer ID</h4>
            <div className="text-sm text-muted-foreground">{order.user}</div>
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
                      </TooltipContent>
                    )}
                  </Tooltip>
                  {` (x${item.quantity})`}
                  {item.size && ` - Size: ${item.size}`}
                </div>
              ))}
            </TooltipProvider>
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
            <Badge className={`border-none relative -left-px ${statusStyles[status]} capitalize`} variant="secondary">{status}</Badge>
          </div>
           <div className="space-y-1">
            <h4 className="font-medium">Payment</h4>
            <div className="text-sm text-muted-foreground">{order.isPaid ? `Paid (${order.paymentMethod})` : `Unpaid (${order.paymentMethod})`}</div>
          </div>
        </div>

      </div>
       <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </DialogFooter>
    </DialogContent>
  );
}

function OrdersTable({ 
  orders,
  onViewDetails,
  onStatusChange,
  onDeleteOrder
}: { 
  orders: Order[],
  onViewDetails: (order: Order) => void,
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void,
  onDeleteOrder: (orderId: string) => void
}) {

  return (
    <>
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
            {orders.map(order => {
              const currentStatus = order.status;
              return (
              <TableRow key={order.id}>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="font-medium cursor-pointer">{order.shippingAddress.fullName}</div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Customer ID: {order.user}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="hidden text-sm text-muted-foreground md:inline">
                      {order.id}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge className={`border-none relative -left-px ${statusStyles[currentStatus]} capitalize`} variant="secondary">
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
                                <DropdownMenuItem onClick={() => onStatusChange(order.id, 'placed')}>Placed</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onStatusChange(order.id, 'dispatched')}>Dispatched</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onStatusChange(order.id, 'delivered')}>Delivered</DropdownMenuItem>
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
    </>
  );
}

export function OrdersClientPage({ orders: initialOrders }: { orders: Order[] }) {
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | OrderStatus>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const ordersPerPage = 10;

     useEffect(() => {
        setOrders(initialOrders);
    }, [initialOrders]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchQuery]);

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    };

    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
      // Optimistically update the UI
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus, deliveredAt: newStatus === 'delivered' ? new Date().toISOString() : undefined } : order
        )
      );

      const result = await updateOrderStatusAction(orderId, newStatus);

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
      const tabFilter = activeTab === 'all' || order.status === activeTab;
      const searchFilter = 
        order.shippingAddress.fullName.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query);
      return tabFilter && searchFilter;
    });
    
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = searchFilteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(searchFilteredOrders.length / ordersPerPage);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleBulkDownload = () => {
        const placedOrders = currentOrders.filter(order => order.status === 'placed');

        if (placedOrders.length === 0) {
            toast({
                variant: "destructive",
                title: "No Placed Orders",
                description: "There are no orders with 'placed' status on the current page to download.",
            });
            return;
        }

        const doc = new jsPDF();
        const labelHeight = 50;
        const gap = 15;
        let yOffset = 10;

        placedOrders.forEach((order, index) => {
            const pageHeight = doc.internal.pageSize.height;
            if (yOffset + labelHeight > pageHeight) {
                doc.addPage();
                yOffset = 10; // Reset Y offset for the new page
            }
            generateLabelPage(doc, order, yOffset);
            yOffset += labelHeight + gap;
        });

        doc.save(`shipping-labels-placed-page-${currentPage}.pdf`);

        toast({
            title: "Download Started",
            description: `Generated a PDF with ${placedOrders.length} shipping label(s).`,
        });
    };


  return (
    <>
      <PageHeader title="Orders" description="View and manage all customer orders." />
      
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <Tabs defaultValue="all" onValueChange={(value) => setActiveTab(value as any)}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <TabsList className="grid w-full grid-cols-4 sm:w-auto sm:grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="placed">Placed</TabsTrigger>
              <TabsTrigger value="dispatched">Dispatched</TabsTrigger>
              <TabsTrigger value="delivered">Delivered</TabsTrigger>
            </TabsList>
             <div className="flex flex-col sm:flex-row items-center gap-2">
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
                <Button variant="outline" size="sm" onClick={handleBulkDownload} className="w-full sm:w-auto">
                    <Download className="mr-2 h-4 w-4" />
                    Download Labels for Placed
                </Button>
            </div>
          </div>
           <Card>
            <OrdersTable 
                orders={currentOrders} 
                onViewDetails={handleViewDetails} 
                onStatusChange={handleStatusChange} 
                onDeleteOrder={handleDeleteOrder} 
            />
            <CardFooter className="flex items-center justify-between pt-6">
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{indexOfFirstOrder + 1}-{Math.min(indexOfLastOrder, searchFilteredOrders.length)}</strong> of <strong>{searchFilteredOrders.length}</strong> orders
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                     <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages > 0 ? totalPages : 1}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages || totalPages === 0}
                    >
                        Next
                    </Button>
                </div>
            </CardFooter>
          </Card>
        </Tabs>
        {selectedOrder && <OrderDetailsDialog order={selectedOrder} />}
      </Dialog>
    </>
  );
}
