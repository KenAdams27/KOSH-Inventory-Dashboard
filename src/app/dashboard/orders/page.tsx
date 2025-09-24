import { initialOrders, products } from "@/lib/data";
import { OrdersClientPage } from "./client-page";

export default async function OrdersPage() {
  // In a real app, you would fetch this data from a database.
  const orders = initialOrders;
  const availableProducts = products;

  return <OrdersClientPage orders={orders} products={availableProducts} />;
}

    