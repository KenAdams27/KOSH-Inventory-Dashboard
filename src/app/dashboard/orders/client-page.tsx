"use client";

import { useState, useEffect } from "react";
import { MoreHorizontal, Search, Download, Pencil, Mail, Loader2, FileText, X } from "lucide-react";
import { format } from "date-fns";
import jsPDF from 'jspdf';


import type { Order, Product, OrderItem, OrderStatus } from "@/lib/types";
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
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";


const statusStyles: Record<OrderStatus, string> = {
    delivered: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    placed: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    dispatched: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    "Refund Initiated": "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
    "Refund Complete": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

function numberToWords(num: number): string {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convert = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    if (n < 10000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
  };

  const main = Math.floor(num);
  const fraction = Math.round((num - main) * 100);

  let res = 'Indian Rupee ' + (main === 0 ? 'Zero' : convert(main));
  if (fraction > 0) {
    res += ' and ' + convert(fraction) + ' Paise';
  }
  return res + ' Only';
}

const generateInvoicePDF = (order: Order, hsn: string, invoiceNo: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Kunal Enterprises", 15, 20);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const sellerInfo = [
        "Rajasthan",
        "India",
        "GSTIN 08ABAFK3577D1ZE",
        "91-9256906351",
        "koshkunalenterprises32@gmail.com"
    ];
    doc.text(sellerInfo, 15, 26, { lineHeightFactor: 1.2 });

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", pageWidth - 15, 25, { align: "right" });

    doc.setDrawColor(200);
    doc.line(15, 45, pageWidth - 15, 45);
    doc.line(15, 45, 15, 75);
    doc.line(pageWidth - 15, 45, pageWidth - 15, 75);
    doc.line(pageWidth / 2, 45, pageWidth / 2, 75);
    doc.line(15, 75, pageWidth - 15, 75);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Invoice #", 18, 51);
    doc.setFont("helvetica", "bold");
    doc.text(`: ${invoiceNo}`, 45, 51);

    doc.setFont("helvetica", "normal");
    doc.text("Invoice Date", 18, 57);
    doc.setFont("helvetica", "bold");
    doc.text(`: ${format(new Date(order.createdAt), 'dd/MM/yyyy')}`, 45, 57);

    doc.setFont("helvetica", "normal");
    doc.text("Terms", 18, 63);
    doc.setFont("helvetica", "bold");
    doc.text(": Due on Receipt", 45, 63);

    doc.setFont("helvetica", "normal");
    doc.text("Due Date", 18, 69);
    doc.setFont("helvetica", "bold");
    doc.text(`: ${format(new Date(order.createdAt), 'dd/MM/yyyy')}`, 45, 69);

    doc.setFont("helvetica", "normal");
    doc.text("Place Of Supply", pageWidth / 2 + 5, 51);
    doc.setFont("helvetica", "bold");
    doc.text(": Rajasthan (08)", pageWidth / 2 + 35, 51);

    const boxY = 75;
    
    const maxAddrWidth = (pageWidth / 2) - 25;
    const wrappedAddress = doc.splitTextToSize(order.shippingAddress.address, maxAddrWidth);

    const addressLines = [
      ...wrappedAddress,
      order.shippingAddress.city,
      `${order.shippingAddress.pincode} Rajasthan`,
      "India"
    ];

    const boxH = Math.max(48, (addressLines.length * 5) + 20);

    doc.line(15, boxY + boxH, pageWidth - 15, boxY + boxH);
    doc.line(15, boxY, 15, boxY + boxH);
    doc.line(pageWidth - 15, boxY, pageWidth - 15, boxY + boxH);
    doc.line(pageWidth / 2, boxY, pageWidth / 2, boxY + boxH);

    doc.setFillColor(245, 245, 245);
    doc.rect(15.5, boxY + 0.5, (pageWidth / 2) - 15.5, 6, 'F');
    doc.rect((pageWidth / 2) + 0.5, boxY + 0.5, (pageWidth / 2) - 15.5, 6, 'F');
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Bill To", 18, boxY + 4.5);
    doc.text("Ship To", pageWidth / 2 + 5, boxY + 4.5);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(order.shippingAddress.fullName, 18, boxY + 12);
    doc.setFont("helvetica", "normal");
    doc.text(addressLines, 18, boxY + 18, { lineHeightFactor: 1.1 });

    doc.setFont("helvetica", "bold");
    doc.text(order.shippingAddress.fullName, pageWidth / 2 + 5, boxY + 12);
    doc.setFont("helvetica", "normal");
    doc.text(addressLines, pageWidth / 2 + 5, boxY + 18, { lineHeightFactor: 1.1 });

    const tableY = boxY + boxH + 8;
    doc.line(15, tableY, pageWidth - 15, tableY);
    doc.line(15, tableY + 12, pageWidth - 15, tableY + 12);

    doc.setFillColor(245, 245, 245);
    doc.rect(15.5, tableY + 0.5, pageWidth - 31, 11, 'F');

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("#", 17, tableY + 7);
    doc.text("Item & Description", 24, tableY + 7);
    doc.text("HSN", 87, tableY + 5, { align: "center" });
    doc.text("/SAC", 87, tableY + 9, { align: "center" });
    doc.text("Qty", 100, tableY + 7, { align: "center" });
    doc.text("Rate", 114, tableY + 7, { align: "center" });
    
    doc.text("CGST", 135, tableY + 4, { align: "center" });
    doc.line(123, tableY + 6, 147, tableY + 6);
    doc.text("%", 129, tableY + 10, { align: "center" });
    doc.text("Amt", 141, tableY + 10, { align: "center" });

    doc.text("SGST", 159, tableY + 4, { align: "center" });
    doc.line(147, tableY + 6, 171, tableY + 6);
    doc.text("%", 153, tableY + 10, { align: "center" });
    doc.text("Amt", 165, tableY + 10, { align: "center" });

    doc.text("Amount", 183, tableY + 7, { align: "center" });

    const drawTableLines = (y: number, h: number) => {
        doc.line(15, y, 15, y + h);
        doc.line(22, y, 22, y + h);
        doc.line(80, y, 80, y + h);
        doc.line(95, y, 95, y + h);
        doc.line(105, y, 105, y + h);
        doc.line(123, y, 123, y + h);
        doc.line(135, y + 6, 135, y + h);
        doc.line(147, y, 147, y + h);
        doc.line(159, y + 6, 159, y + h);
        doc.line(171, y, 171, y + h);
        doc.line(pageWidth - 15, y, pageWidth - 15, y + h);
    };
    drawTableLines(tableY, 12);

    let rowY = tableY + 18;
    let totalTaxable = 0;
    let totalCGST = 0;
    let totalSGST = 0;

    doc.setFont("helvetica", "normal");
    order.orderItems.forEach((item, index) => {
        const itemInclusiveTotal = item.price * item.quantity;
        const taxableValue = Number((itemInclusiveTotal / 1.05).toFixed(2));
        const totalTax = Number((itemInclusiveTotal - taxableValue).toFixed(2));
        const cgst = Number((totalTax / 2).toFixed(2));
        const sgst = Number((totalTax - cgst).toFixed(2));

        totalTaxable += taxableValue;
        totalCGST += cgst;
        totalSGST += sgst;

        doc.text((index + 1).toString(), 18.5, rowY, { align: "center" });
        const itemName = item.name + (item.size ? ` (${item.size})` : "") + (item.color ? ` - ${item.color}` : "");
        const splitName = doc.splitTextToSize(itemName, 55);
        doc.text(splitName, 24, rowY);
        doc.text(hsn, 87, rowY, { align: "center" });
        doc.text(item.quantity.toFixed(2), 100, rowY, { align: "center" });
        doc.text("pcs", 100, rowY + 4, { align: "center" });
        doc.text((taxableValue / item.quantity).toFixed(2), 114, rowY, { align: "center" });
        doc.text("2.5%", 129, rowY, { align: "center" });
        doc.text(cgst.toFixed(2), 141, rowY, { align: "center" });
        doc.text("2.5%", 153, rowY, { align: "center" });
        doc.text(sgst.toFixed(2), 165, rowY, { align: "center" });
        doc.text(taxableValue.toFixed(2), 183, rowY, { align: "center" });

        const itemH = Math.max((splitName.length * 5) + 5, 10);
        drawTableLines(rowY - 6, itemH);
        rowY += itemH;
    });

    doc.line(15, rowY - 6, pageWidth - 15, rowY - 6);

    const footerY = rowY + 5;
    const shipping = order.totalPrice < 1089 ? 90 : 0;
    
    const grandTotal = Number((totalTaxable + totalCGST + totalSGST + shipping).toFixed(2));

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Total In Words", 15, footerY);
    doc.setFont("helvetica", "bolditalic");
    doc.text(numberToWords(grandTotal), 15, footerY + 5);

    doc.setFont("helvetica", "normal");
    doc.text("Notes", 15, footerY + 15);
    doc.text("Thanks for your business.", 15, footerY + 20);

    const sumX = pageWidth / 2;
    doc.line(sumX, rowY - 6, sumX, footerY + 45);
    doc.line(sumX, footerY + 45, pageWidth - 15, footerY + 45);
    doc.line(pageWidth - 15, rowY - 6, pageWidth - 15, footerY + 45);

    const drawSummaryRow = (label: string, value: string, y: number, bold = false, color?: [number, number, number]) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        if (color) doc.setTextColor(color[0], color[1], color[2]);
        doc.text(label, sumX + 5, y);
        doc.text(value, pageWidth - 17, y, { align: "right" });
        doc.setTextColor(0);
    };

    drawSummaryRow("Sub Total", totalTaxable.toFixed(2), footerY);
    drawSummaryRow("CGST (2.5%)", totalCGST.toFixed(2), footerY + 7);
    drawSummaryRow("SGST (2.5%)", totalSGST.toFixed(2), footerY + 14);
    
    let summaryY = footerY + 21;
    if (shipping > 0) {
        drawSummaryRow("Shipping Charges", shipping.toFixed(2), summaryY);
        summaryY += 7;
    }

    doc.line(sumX, summaryY - 3, pageWidth - 15, summaryY - 3);
    drawSummaryRow("Total", `Rs. ${grandTotal.toFixed(2)}`, summaryY + 4, true);
    drawSummaryRow("Payment Made", `(-) ${grandTotal.toFixed(2)}`, summaryY + 11, false, [200, 0, 0]);
    doc.line(sumX, summaryY + 15, pageWidth - 15, summaryY + 15);
    drawSummaryRow("Balance Due", "Rs. 0.00", summaryY + 21, true);

    doc.setFont("helvetica", "normal");
    doc.text("Authorized Signature", pageWidth - 35, summaryY + 50, { align: "center" });
    doc.line(pageWidth - 60, summaryY + 45, pageWidth - 10, summaryY + 45);

    doc.save(`Invoice_KOSH_${invoiceNo}.pdf`);
};

const generateLabelPage = (doc: jsPDF, order: Order, yOffset: number = 10) => {
    const { shippingAddress } = order;
    const labelHeight = 50;

    doc.setProperties({ title: `Shipping Label - ${order.id}` });
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
    const fromAddress = ["KUNAL Enterprises", "Udaipur 313001", "Rajasthan, India"];
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

function OrderDetailsDialog({
  order,
  products,
  onEditTrackingId,
  onGenerateBill,
}: {
  order: Order;
  products: Product[];
  onEditTrackingId: (order: Order) => void;
  onGenerateBill: (order: Order) => void;
}) {
  const status = order.status;
  const [skuDialog, setSkuDialog] = useState<{ open: boolean, item: OrderItem | null, sku: string | null }>({ open: false, item: null, sku: null });

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    generateLabelPage(doc, order);
    doc.save(`shipping-label-${order.id}.pdf`);
  };

  const handleItemClick = (item: OrderItem) => {
    const product = products.find(p => p.id === item.itemId);
    const baseSku = product ? product.sku : 'N/A';
    const colorAbbr = item.color ? item.color.substring(0, 2).toUpperCase() : 'NA';
    const dynamicSku = `${baseSku}_${colorAbbr}_${item.size || 'NA'}`;
    setSkuDialog({ open: true, item, sku: dynamicSku });
  };

  return (
    <>
      <Dialog open={skuDialog.open} onOpenChange={(open) => setSkuDialog({ ...skuDialog, open })}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>SKU Details</DialogTitle>
          </DialogHeader>
          {skuDialog.item && (
            <div className="grid gap-4 py-4">
              <p><span className="font-semibold">Product ID:</span> {skuDialog.item.itemId}</p>
              <p><span className="font-semibold">SKU:</span> {skuDialog.sku}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
          {order.status === 'dispatched' && order.tracking_id && (
             <div className="space-y-2">
                <h4 className="font-medium">Tracking ID</h4>
                <div className="flex items-center gap-2">
                    <a href={order.tracking_id} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline-offset-4 hover:underline">
                      {order.tracking_id}
                    </a>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditTrackingId(order)}>
                        <Pencil className="h-3 w-3" />
                        <span className="sr-only">Edit Tracking ID</span>
                    </Button>
                </div>
            </div>
          )}
          <div className="space-y-2">
            <h4 className="font-medium">Items Ordered</h4>
              {order.orderItems.map((item, index) => (
                <div key={`${item.itemId}-${item.name}-${index}`} className="text-sm text-muted-foreground cursor-pointer" onClick={() => handleItemClick(item)}>
                  <span className="font-medium">{item.name}</span>
                  {` (x${item.quantity})`}
                  {item.size && ` - Size: ${item.size}`}
                  {` - Color: ${item.color || 'null'}`}
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
              <Badge className={`border-none relative -left-px ${statusStyles[status]} capitalize`} variant="secondary">{status}</Badge>
            </div>
            <div className="space-y-1">
              <h4 className="font-medium">Payment</h4>
              <div className="text-sm text-muted-foreground">{order.isPaid ? `Paid` : `Unpaid`}</div>
            </div>
          </div>

        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
              <Download className="mr-2 h-4 w-4" />
              Shipping Label
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onGenerateBill(order)}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Bill
            </Button>
          </DialogFooter>
      </DialogContent>
    </>
  );
}

function OrdersTable({ 
  orders,
  products,
  onViewDetails,
  onStatusChange,
  onDeleteOrder,
  onGenerateBill,
}: { 
  orders: Order[],
  products: Product[],
  onViewDetails: (order: Order) => void,
  onStatusChange: (orderId: string, newStatus: OrderStatus, trackingId?: string, sendEmail?: boolean) => void,
  onDeleteOrder: (orderId: string) => void,
  onGenerateBill: (order: Order) => void,
}) {
  const { toast } = useToast();
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [currentOrderForTracking, setCurrentOrderForTracking] = useState<Order | null>(null);
  const [trackingId, setTrackingId] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [statusChangeConfirm, setStatusChangeConfirm] = useState<{ order: Order; status: OrderStatus } | null>(null);
  const statusOptions: OrderStatus[] = ['placed', 'dispatched', 'delivered', 'Refund Initiated', 'Refund Complete'];
  const statusDisplayNames: Record<OrderStatus, string> = {
    'placed': 'Placed',
    'dispatched': 'Dispatched',
    'delivered': 'Delivered',
    'Refund Initiated': 'Refund Initiated',
    'Refund Complete': 'Refund Complete',
  };

  const handleStatusClick = (order: Order, status: OrderStatus) => {
    if (status === 'placed') {
      onStatusChange(order.id, status, undefined, false);
      toast({ title: "Order Status Updated", description: `Order status changed to "Placed".` });
      return;
    }

    const hasBeenNotified = order.notifiedStatuses?.includes(status);
    if (hasBeenNotified) {
      onStatusChange(order.id, status, undefined, false);
      toast({ title: "Order Status Updated", description: `Order status changed to "${status}".` });
      return;
    }
    if (status === 'dispatched') {
      setCurrentOrderForTracking(order);
      setTrackingId(order.tracking_id || "");
      setNotifyCustomer(true);
      setIsTrackingDialogOpen(true);
    } else {
      setStatusChangeConfirm({ order, status });
    }
  };
  
  const handleConfirmStatusUpdate = (sendEmail: boolean) => {
    if (!statusChangeConfirm) return;
    onStatusChange(statusChangeConfirm.order.id, statusChangeConfirm.status, undefined, sendEmail);
    setStatusChangeConfirm(null);
  };

  const handleSaveTrackingId = () => {
    if (currentOrderForTracking) {
      onStatusChange(currentOrderForTracking.id, 'dispatched', trackingId, notifyCustomer);
      setIsTrackingDialogOpen(false);
      setCurrentOrderForTracking(null);
      setTrackingId("");
    }
  };

  return (
    <>
      <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispatch Order</DialogTitle>
            <DialogDescription>
              Enter the tracking ID for order #{currentOrderForTracking?.id.slice(-6)}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="trackingId" className="text-right">Tracking ID</Label>
              <Input id="trackingId" value={trackingId} onChange={(e) => setTrackingId(e.target.value)} className="col-span-3" placeholder="Enter tracking ID" />
            </div>
            <div className="col-span-4 flex items-center justify-end space-x-2">
                <Checkbox id="notify" checked={notifyCustomer} onCheckedChange={(checked) => setNotifyCustomer(!!checked)} />
                <Label htmlFor="notify" className="cursor-pointer">Notify customer via email</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTrackingDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTrackingId}>Confirm Dispatch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
       <AlertDialog open={!!statusChangeConfirm} onOpenChange={() => setStatusChangeConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Order Status</AlertDialogTitle>
            <AlertDialogDescription>
              Update order #{statusChangeConfirm?.order.id.slice(-6)} to "{statusChangeConfirm?.status}".
              <br/><br/>
              Send notification email?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={() => handleConfirmStatusUpdate(false)}>Update Only</Button>
            <AlertDialogAction onClick={() => handleConfirmStatusUpdate(true)}>Update & Notify</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            {orders.map(order => (
              <TableRow key={order.id}>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="font-medium cursor-pointer">{order.shippingAddress.fullName}</div>
                      </TooltipTrigger>
                      <TooltipContent><p>Customer ID: {order.user}</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <div className="hidden text-sm text-muted-foreground md:inline">{order.id}</div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge className={`border-none relative -left-px ${statusStyles[order.status]} capitalize`} variant="secondary">
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">{format(new Date(order.createdAt), "PPP")}</TableCell>
                <TableCell className="hidden sm:table-cell text-right">₹{order.totalPrice.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => onViewDetails(order)}>View Details</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onGenerateBill(order)}><FileText className="mr-2 h-4 w-4" />Generate Bill</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {statusOptions.map((opt) => (
                            <DropdownMenuItem key={opt} onSelect={(e) => e.preventDefault()} onClick={() => handleStatusClick(order, opt)} className="justify-between">
                              <span>{statusDisplayNames[opt]}</span>
                              {order.notifiedStatuses?.includes(opt) && <span className="text-xs text-muted-foreground">Sent</span>}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                      <AlertDialog>
                        <AlertDialogTrigger asChild><DropdownMenuItem className="text-red-600" onSelect={(e) => e.preventDefault()}>Delete Order</DropdownMenuItem></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDeleteOrder(order.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </>
  );
}

export function OrdersClientPage({ orders: initialOrders, products }: { orders: Order[], products: Product[] }) {
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | OrderStatus>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
    const [currentOrderForTracking, setCurrentOrderForTracking] = useState<Order | null>(null);
    const [trackingId, setTrackingId] = useState("");
    const [isInvoiceInputDialogVisible, setIsInvoiceInputDialogVisible] = useState(false);
    const [orderForInvoice, setOrderForInvoice] = useState<Order | null>(null);
    const [manualHsn, setManualHsn] = useState("");
    const [manualInvoiceNo, setManualInvoiceNo] = useState("");

    const ordersPerPage = 10;
    useEffect(() => { setOrders(initialOrders); }, [initialOrders]);
    useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery]);

    const handleViewDetails = (order: Order) => { setSelectedOrder(order); setIsDetailsOpen(true); };

    const handleStatusChange = async (orderId: string, newStatus: OrderStatus, tId?: string, sendEmail?: boolean) => {
      setOrders(prev => prev.map(o => {
        if (o.id === orderId) {
          const updated = { ...o, status: newStatus, tracking_id: tId !== undefined ? tId : o.tracking_id, deliveredAt: newStatus === 'delivered' ? new Date().toISOString() : o.deliveredAt };
          if (newStatus !== 'delivered' && 'deliveredAt' in updated) delete (updated as any).deliveredAt;
          if (sendEmail) updated.notifiedStatuses = Array.from(new Set([...(o.notifiedStatuses || []), newStatus]));
          return updated as Order;
        }
        return o;
      }));
      const res = await updateOrderStatusAction(orderId, newStatus, tId, sendEmail);
      if (!res.success) { setOrders(initialOrders); toast({ variant: "destructive", title: "Error", description: res.message }); }
    };
    
    const handleDeleteOrder = async (id: string) => {
        const res = await deleteOrderAction(id);
        if (res.success) toast({ title: "Order Deleted", description: res.message });
        else toast({ variant: "destructive", title: "Error", description: res.message });
    };
    
    const handleEditTrackingId = (order: Order) => { setCurrentOrderForTracking(order); setTrackingId(order.tracking_id || ""); setIsTrackingDialogOpen(true); };
    const handleSaveTrackingId = () => { if (currentOrderForTracking) { handleStatusChange(currentOrderForTracking.id, currentOrderForTracking.status, trackingId, true); setIsTrackingDialogOpen(false); } };

    const handlePromptForInvoiceInfo = (order: Order) => { setOrderForInvoice(order); setManualHsn(""); setManualInvoiceNo(""); setIsInvoiceInputDialogVisible(true); };
    const handleGenerateBillWithInputs = () => { if (orderForInvoice) { generateInvoicePDF(orderForInvoice, manualHsn, manualInvoiceNo); setIsInvoiceInputDialogVisible(false); } };

    const searchFilteredOrders = orders.filter(o => {
      const q = searchQuery.toLowerCase();
      const tabFilter = activeTab === 'all' || o.status === activeTab;
      const sFilter = o.shippingAddress.fullName.toLowerCase().includes(q) || o.id.toLowerCase().includes(q);
      return tabFilter && sFilter;
    });
    
    const currentOrders = searchFilteredOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);
    const totalPages = Math.ceil(searchFilteredOrders.length / ordersPerPage);

    const handleBulkDownload = () => {
        const placed = currentOrders.filter(o => o.status === 'placed');
        if (placed.length === 0) return toast({ variant: "destructive", title: "No Placed Orders" });
        const doc = new jsPDF();
        let yOffset = 10;
        placed.forEach(o => { if (yOffset + 65 > doc.internal.pageSize.height) { doc.addPage(); yOffset = 10; } yOffset = generateLabelPage(doc, o, yOffset) + 15; });
        doc.save(`shipping-labels-placed-page-${currentPage}.pdf`);
    };

  return (
    <>
      <PageHeader title="Orders" description="View and manage all customer orders." />
      <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
        <DialogContent><DialogHeader><DialogTitle>Update Tracking ID</DialogTitle></DialogHeader>
          <div className="py-4"><div className="grid grid-cols-4 items-center gap-4"><Label className="text-right">Tracking ID</Label><Input value={trackingId} onChange={(e) => setTrackingId(e.target.value)} className="col-span-3" /></div></div>
          <DialogFooter><Button variant="outline" onClick={() => setIsTrackingDialogOpen(false)}>Cancel</Button><Button onClick={handleSaveTrackingId}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isInvoiceInputDialogVisible} onOpenChange={setIsInvoiceInputDialogVisible}>
        <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Generate Tax Invoice</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Invoice Number</Label><Input value={manualInvoiceNo} onChange={(e) => setManualInvoiceNo(e.target.value)} placeholder="e.g. VYP061" /></div>
            <div className="grid gap-2"><Label>HSN Code</Label><Input value={manualHsn} onChange={(e) => setManualHsn(e.target.value)} placeholder="e.g. 52082120" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setIsInvoiceInputDialogVisible(false)}>Cancel</Button><Button onClick={handleGenerateBillWithInputs} disabled={!manualHsn || !manualInvoiceNo}>Download Invoice</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
                <TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="placed">Placed</TabsTrigger><TabsTrigger value="dispatched">Dispatched</TabsTrigger><TabsTrigger value="delivered">Delivered</TabsTrigger></TabsList>
                <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className={`h-10 ${(activeTab === 'Refund Initiated' || activeTab === 'Refund Complete') ? 'bg-accent text-accent-foreground' : ''}`}>Refund</Button></DropdownMenuTrigger>
                    <DropdownMenuContent><DropdownMenuItem onSelect={() => setActiveTab('Refund Initiated')}>Initiated</DropdownMenuItem><DropdownMenuItem onSelect={() => setActiveTab('Refund Complete')}>Completed</DropdownMenuItem></DropdownMenuContent>
                </DropdownMenu>
            </div>
             <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full sm:w-auto"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Search..." className="pl-8 w-full sm:w-48" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                <Button variant="outline" size="sm" onClick={handleBulkDownload} className="w-full sm:w-auto"><Download className="mr-2 h-4 w-4" />Labels</Button>
            </div>
          </div>
           <Card>
            <OrdersTable orders={currentOrders} products={products} onViewDetails={handleViewDetails} onStatusChange={handleStatusChange} onDeleteOrder={handleDeleteOrder} onGenerateBill={handlePromptForInvoiceInfo} />
            <CardFooter className="flex items-center justify-between pt-6">
                <div className="text-xs text-muted-foreground">Showing <strong>{currentOrders.length > 0 ? (currentPage - 1) * ordersPerPage + 1 : 0}-{Math.min(currentPage * ordersPerPage, searchFilteredOrders.length)}</strong> of <strong>{searchFilteredOrders.length}</strong></div>
                <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>Prev</Button><span className="text-sm">Page {currentPage} of {totalPages || 1}</span><Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0}>Next</Button></div>
            </CardFooter>
          </Card>
        </Tabs>
        {selectedOrder && <OrderDetailsDialog order={selectedOrder} products={products} onEditTrackingId={handleEditTrackingId} onGenerateBill={handlePromptForInvoiceInfo} />}
      </Dialog>
    </>
  );
}