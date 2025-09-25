
import { Boxes, IndianRupee, ShoppingCart, Truck } from 'lucide-react';
import clientPromise from "@/lib/mongodb";
import type { Order, Product } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { RecentSales } from '@/components/dashboard/recent-sales';
import { DownloadOrders } from '@/components/dashboard/download-orders';

async function getOrders(): Promise<Order[]> {
  if (!clientPromise) {
    return [];
  }
  try {
    const client = await clientPromise;
    const dbName = process.env.DB_NAME;
    if (!dbName) {
      throw new Error('DB_NAME environment variable is not set.');
    }
    const db = client.db(dbName);
    const ordersFromDb = await db.collection("orders").find({}).sort({ createdAt: -1 }).toArray();
    return JSON.parse(JSON.stringify(ordersFromDb)).map((o: any) => ({ ...o, id: o._id.toString() }));
  } catch (error) {
    console.error("[getOrders dashboard] Failed to fetch orders:", error);
    return [];
  }
}

async function getProducts(): Promise<Product[]> {
  if (!clientPromise) {
    return [];
  }
  try {
    const client = await clientPromise;
    const dbName = process.env.DB_NAME;
    if (!dbName) {
      throw new Error('DB_NAME environment variable is not set.');
    }
    const db = client.db(dbName);
    const productsFromDb = await db.collection("items").find({}).toArray();
    return JSON.parse(JSON.stringify(productsFromDb)).map((p: any) => ({ ...p, id: p._id.toString() }));
  } catch (error) {
    console.error("[getProducts dashboard] Failed to fetch products:", error);
    return [];
  }
}

export default async function DashboardHomePage() {
  const orders = await getOrders();
  const products = await getProducts();
  
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const previousMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const previousMonth = previousMonthDate.getMonth();
  const previousMonthYear = previousMonthDate.getFullYear();

  const currentMonthOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
  });

  const previousMonthOrders = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    return orderDate.getMonth() === previousMonth && orderDate.getFullYear() === previousMonthYear;
  });

  const currentMonthRevenue = currentMonthOrders.reduce((acc, order) => acc + order.totalPrice, 0);
  const previousMonthRevenue = previousMonthOrders.reduce((acc, order) => acc + order.totalPrice, 0);

  const currentMonthTotalOrders = currentMonthOrders.length;
  const previousMonthTotalOrders = previousMonthOrders.length;
  
  const totalInventory = products.length;

  const currentMonthPendingOrders = currentMonthOrders.filter((o) => !o.isDelivered).length;
  const previousMonthPendingOrders = previousMonthOrders.filter((o) => !o.isDelivered).length;

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }
  
  const totalRevenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => !o.isDelivered).length;

  const revenuePercentageChange = calculatePercentageChange(currentMonthRevenue, previousMonthRevenue);
  const ordersPercentageChange = calculatePercentageChange(currentMonthTotalOrders, previousMonthTotalOrders);
  const pendingPercentageChange = calculatePercentageChange(currentMonthPendingOrders, previousMonthPendingOrders);


  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Here's a summary of your store's performance."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {revenuePercentageChange >= 0 ? '+' : ''}{revenuePercentageChange.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {ordersPercentageChange >= 0 ? '+' : ''}{ordersPercentageChange.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Inventory
            </CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInventory}</div>
            <p className="text-xs text-muted-foreground">
                Total unique products in your store.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              {pendingPercentageChange >= 0 ? '+' : ''}{pendingPercentageChange.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <RevenueChart data={orders} />
          </CardContent>
        </Card>
        <div className="grid gap-4 md:gap-8">
            <RecentSales orders={orders} />
            <DownloadOrders orders={orders} />
        </div>
      </div>
    </>
  );
}
