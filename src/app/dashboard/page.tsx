
import { Boxes, IndianRupee, ShoppingCart, Truck } from 'lucide-react';
import Image from "next/image";
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

  const totalRevenue = orders
    .filter(order => order.isDelivered)
    .reduce((acc, order) => acc + order.totalPrice, 0);

  const totalOrders = orders.length;

  const totalInventory = products.reduce((acc, p) => acc + p.quantity, 0);

  const pendingOrders = orders.filter((o) => !o.isDelivered).length;
  
  // Note: Since there is no historical data, the percentage change is currently 0.
  // This logic should be updated to compare with data from the previous month.
  const revenuePercentageChange = 0;
  const ordersPercentageChange = 0;
  const inventoryPercentageChange = 0;
  const pendingPercentageChange = 0;


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
              +{revenuePercentageChange.toFixed(1)}% from last month
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
              +{ordersPercentageChange.toFixed(1)}% from last month
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
                +{inventoryPercentageChange.toFixed(1)}% from last month
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
              +{pendingPercentageChange.toFixed(1)}% from last month
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
        <Card>
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
                    <div key={order.id} className="flex items-center gap-4">
                        {firstItem.image ? (
                        <div className="h-12 w-12 flex-shrink-0">
                            <Image
                            src={firstItem.image}
                            alt={firstItem.name}
                            width={48}
                            height={48}
                            className="h-full w-full rounded-md object-cover"
                            />
                        </div>
                        ) : (
                        <div className="h-12 w-12 flex-shrink-0 rounded-md bg-muted" />
                        )}
                        <div className="flex-1">
                        <p className="text-sm font-medium leading-none truncate">
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
      </div>
    </>
  );
}
