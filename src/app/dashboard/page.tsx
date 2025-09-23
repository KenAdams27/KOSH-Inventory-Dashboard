import { Boxes, IndianRupee, ShoppingCart, Truck } from 'lucide-react';

import { orders, products } from '@/lib/data';
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { RevenueChart } from '@/components/dashboard/revenue-chart';

export default function DashboardHomePage() {
  const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
  const totalOrders = orders.length;
  const totalInventory = products.reduce((acc, p) => acc + p.quantity, 0);
  const pendingOrders = orders.filter((o) => o.status === 'Pending').length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Here's a summary of your store's performance."
      />
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
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
              +20.1% from last month
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
              +180.1% from last month
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
            <p className="text-xs text-muted-foreground">+19% from last month</p>
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
              +2 from last hour
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
            <RevenueChart />
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
            <div className="space-y-4">
              {orders.slice(0, 5).map((order) => {
                const product = products.find(
                  (p) => p.price === order.total
                );
                return (
                  <div key={order.id} className="flex items-center gap-4">
                    {product ? (
                      <div className="h-12 w-12 flex-shrink-0">
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="h-full w-full rounded-md object-cover"
                          data-ai-hint={product.imageHints[0]}
                        />
                      </div>
                    ) : (
                      <div className="h-12 w-12 flex-shrink-0 rounded-md bg-muted" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-none truncate">
                        {product ? product.name : "Unknown Item"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.customer.name}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">
                      +₹{order.total.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
