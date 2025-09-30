
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

export const dynamic = 'force-dynamic';

async function getOrders(): Promise<Order[]> {
  if (!clientPromise) {
    console.warn('MongoDB client is not available. No orders will be fetched.');
    return [];
  }
  try {
    const client = await clientPromise;
    const dbName = process.env.DB_NAME;

    if (!dbName) {
      throw new Error('DB_NAME environment variable is not set.');
    }

    const db = client.db(dbName);
    const ordersFromDb = await db
      .collection("orders")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
      
    // Manually map and convert all ObjectIDs to strings, including nested ones.
    const orders = ordersFromDb.map((order) => {
      const { _id, user, orderItems, isDelivered, ...rest } = order;

      // Backward compatibility for old schema
      let status: 'placed' | 'dispatched' | 'delivered' = 'placed';
      if (order.status) {
        status = order.status;
      } else if (isDelivered) {
        status = 'delivered';
      }

      return {
        ...rest,
        _id: _id.toHexString(),   // Store the raw ObjectId as a string
        id: _id.toString(),
        user: user.toString(),
        status: status,
        orderItems: orderItems.map((item: any) => {
          // Ensure item is a plain object without complex types
          const { _id: item_id, ...restOfItem } = item;
          const plainItem: any = {
            name: restOfItem.name,
            price: restOfItem.price,
            quantity: restOfItem.quantity,
          };
          if (restOfItem.image) plainItem.image = restOfItem.image;
          if (restOfItem.size) plainItem.size = restOfItem.size;
          if (restOfItem.color) plainItem.color = restOfItem.color;
          // Check for 'item' or 'itemId' and convert if it's an ObjectId
          if (restOfItem.item && restOfItem.item.toString) plainItem.itemId = restOfItem.item.toString();
          if (restOfItem.itemId && restOfItem.itemId.toString) plainItem.itemId = restOfItem.itemId.toString();
          
          return plainItem;
        }),
      } as Order;
    });

    return orders;

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

    // Manually map and convert all ObjectIDs to strings to ensure serializable data.
    const products = JSON.parse(JSON.stringify(productsFromDb)).map((product: any) => ({
      ...product,
      id: product._id.toString(),
    }));
    return products;
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

  const currentMonthPendingOrders = currentMonthOrders.filter((o) => o.status !== 'delivered').length;
  const previousMonthPendingOrders = previousMonthOrders.filter((o) => o.status !== 'delivered').length;

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  }
  
  const totalRevenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status !== 'delivered').length;

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
      <div className="grid gap-4 md:gap-8">
         <div className="grid gap-4 md:gap-8 grid-cols-1 lg:grid-cols-2">
             <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <RevenueChart data={orders} />
              </CardContent>
            </Card>
            <RecentSales orders={orders} />
        </div>
        <div>
            <DownloadOrders orders={orders} />
        </div>
      </div>
    </>
  );
}
