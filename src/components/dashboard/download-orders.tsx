
"use client";

import { useState, useMemo } from 'react';
import type { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function DownloadOrders({ orders }: { orders: Order[] }) {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth.toString());

  const availableYears = useMemo(() => {
    if (!orders || orders.length === 0) return [currentYear.toString()];
    const years = new Set(orders.map(order => new Date(order.createdAt).getFullYear().toString()));
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [orders, currentYear]);

  const handleDownload = () => {
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);

    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getFullYear() === year && orderDate.getMonth() === month;
    });

    if (filteredOrders.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: `No orders found for ${monthNames[month]} ${year}.`,
      });
      return;
    }

    // Generate CSV content
    const headers = [
        "Order ID", "Date", "Customer Name", "Items", "Total Price", "Payment Method", "Payment Status", "Delivery Status"
    ];
    const rows = filteredOrders.map(order => [
      order.id,
      new Date(order.createdAt).toLocaleDateString(),
      order.shippingAddress.fullName,
      order.orderItems.map(item => `${item.name} (x${item.quantity})`).join(', '),
      order.totalPrice,
      order.paymentMethod,
      order.isPaid ? "Paid" : "Unpaid",
      order.status,
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(",")).join("\n");

    // Create a link and trigger the download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orders_${year}_${monthNames[month]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
        title: "Download Started",
        description: `Your CSV for ${monthNames[month]} ${year} is downloading.`,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Download Orders</CardTitle>
        <CardDescription>
          Export monthly order data as a CSV file.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger>
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((month, index) => (
                <SelectItem key={month} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleDownload} size="sm">
          <Download className="mr-2 h-4 w-4" />
          Download CSV
        </Button>
      </CardContent>
    </Card>
  );
}
