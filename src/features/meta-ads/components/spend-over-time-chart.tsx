'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartTooltip } from '@/features/dashboard/components/chart-tooltip';
import { TimeseriesPoint } from '../services/meta-ads.service';

interface SpendOverTimeChartProps {
  data: TimeseriesPoint[];
  loading?: boolean;
  currency?: string;
}

export function SpendOverTimeChart({ data, loading, currency = 'BRL' }: SpendOverTimeChartProps) {
  if (loading) {
    return <div className="h-64 animate-pulse rounded-lg border border-border bg-muted/40" />;
  }
  const chartData = data.map((p) => ({
    date: p.date,
    value: typeof p.value === 'string' ? parseFloat(p.value) : p.value,
  }));
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 270)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            tickFormatter={(d: string) => d.slice(5)}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            tickFormatter={(v: number) => {
              const sym = currency === 'BRL' ? 'R$' : '$';
              return v >= 1000 ? `${sym}${(v / 1000).toFixed(1)}k` : `${sym}${v.toFixed(0)}`;
            }}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="oklch(0.68 0.15 230)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
