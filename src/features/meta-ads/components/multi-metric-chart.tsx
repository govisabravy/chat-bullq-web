'use client';

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ChartTooltip } from '@/features/dashboard/components/chart-tooltip';
import { TimeseriesPoint } from '../services/meta-ads.service';

interface Series {
  data: TimeseriesPoint[];
  label: string;
  color: string;
  type: 'line' | 'bar';
  yAxis: 'left' | 'right';
}

interface MultiMetricChartProps {
  series: Series[];
  loading?: boolean;
  height?: number;
}

export function MultiMetricChart({ series, loading, height = 280 }: MultiMetricChartProps) {
  if (loading) {
    return <div className="animate-pulse rounded-lg border border-border bg-muted/40" style={{ height }} />;
  }

  // Merge series by date
  const map = new Map<string, Record<string, number | string>>();
  for (const s of series) {
    for (const p of s.data) {
      const row = map.get(p.date) ?? { date: p.date };
      row[s.label] = typeof p.value === 'string' ? parseFloat(p.value) : p.value;
      map.set(p.date, row);
    }
  }
  const merged = Array.from(map.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={merged}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.005 270)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            tickFormatter={(d: string) => d.slice(5)}
          />
          <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s) =>
            s.type === 'bar' ? (
              <Bar
                key={s.label}
                yAxisId={s.yAxis}
                dataKey={s.label}
                fill={s.color}
                radius={[3, 3, 0, 0]}
                opacity={0.7}
              />
            ) : (
              <Line
                key={s.label}
                yAxisId={s.yAxis}
                type="monotone"
                dataKey={s.label}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
              />
            ),
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
