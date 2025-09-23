"use client";

import { MoreHorizontal } from "lucide-react";
import { orders } from "@/lib/data";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";

type OrderStatus = "Pending" | "Fulfilled" | "Cancelled";

const statusStyles: Record<OrderStatus, string> = {
    Fulfilled: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    Cancelled: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};


function OrdersTable({ status }: { status: "All" | OrderStatus }) {
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
                        <DropdownMenuItem>View Details</DropdownMenuItem>
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
  return (
    <>
      <PageHeader title="Orders" description="View and manage all customer orders." />
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
          <OrdersTable status="All" />
        </TabsContent>
        <TabsContent value="Fulfilled">
          <OrdersTable status="Fulfilled" />
        </TabsContent>
        <TabsContent value="Pending">
          <OrdersTable status="Pending" />
        </TabsContent>
        <TabsContent value="Cancelled">
          <OrdersTable status="Cancelled" />
        </TabsContent>
      </Tabs>
    </>
  );
}
