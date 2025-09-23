'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

const allMonthsData = [
  { month: 'Jan', total: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Feb', total: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Mar', total: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Apr', total: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'May', total: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Jun', total: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Jul', total: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Aug', total: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Sep', total: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Oct', total: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Nov', total: Math.floor(Math.random() * 5000) + 1000 },
  { month: 'Dec', total: Math.floor(Math.random() * 5000) + 1000 },
];

export function RevenueChart() {
  const chartData = allMonthsData.slice(-4);
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
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
        <Bar
          dataKey="total"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
          maxBarSize={60}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
