
'use client';

import type { Order } from '@/lib/types';
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function RevenueChart({ data: orders }: { data: Order[] }) {

  const getRevenueData = () => {
    if (!orders || orders.length === 0) {
      const today = new Date();
      return Array.from({ length: 4 }, (_, i) => {
        const d = new Date(today.getFullYear(), today.getMonth() - (3 - i), 1);
        return { month: monthNames[d.getMonth()], total: 0 };
      });
    }

    const monthlyRevenue: { [key: string]: number } = {};

    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const monthYear = `${monthNames[date.getMonth()]}`;
      if (!monthlyRevenue[monthYear]) {
        monthlyRevenue[monthYear] = 0;
      }
      monthlyRevenue[monthYear] += order.totalPrice;
    });

    const today = new Date();
    const chartData = [];
    for (let i = 3; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = monthNames[d.getMonth()];
        chartData.push({
            month: monthKey,
            total: monthlyRevenue[monthKey] || 0,
        });
    }

    return chartData;
  }

  const chartData = getRevenueData();

  if (chartData.every(d => d.total === 0)) {
    return (
        <div className="flex h-[350px] w-full items-center justify-center">
            <p className="text-muted-foreground">No revenue data to display.</p>
        </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={chartData}>
        <CartesianGrid vertical={false} strokeOpacity={0} />
        <XAxis
          dataKey="month"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₹${value}`}
        />
        <Tooltip
            contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
            }}
        />
        <Line
          type="monotone"
          dataKey="total"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{
            fill: "hsl(var(--primary))",
            r: 4,
          }}
          activeDot={{
            r: 6
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

