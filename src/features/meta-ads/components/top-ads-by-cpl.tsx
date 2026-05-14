'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useRouter } from 'next/navigation';
import { ChartTooltip } from '@/features/dashboard/components/chart-tooltip';
import { TopAdByCpl } from '../services/meta-ads.service';
import { formatCurrency, formatNumberCompact } from '../utils/format';

const COLORS = [
  'oklch(0.72 0.17 150)',
  'oklch(0.68 0.15 230)',
  'oklch(0.62 0.2 290)',
  'oklch(0.78 0.16 85)',
  'oklch(0.68 0.18 25)',
  'oklch(0.65 0.15 195)',
  'oklch(0.7 0.16 60)',
  'oklch(0.6 0.18 320)',
  'oklch(0.74 0.13 130)',
  'oklch(0.66 0.17 280)',
];

interface TopAdsByCplProps {
  ads: TopAdByCpl[];
  currency: string;
  loading?: boolean;
}

export function TopAdsByCpl({ ads, currency, loading }: TopAdsByCplProps) {
  const router = useRouter();

  if (loading) {
    return <div className="h-72 animate-pulse rounded-lg border border-border bg-muted/40" />;
  }

  if (ads.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Sem anúncios com leads no período.
      </div>
    );
  }

  const chartData = ads.map((a) => ({
    name: a.name,
    value: parseFloat(a.cpl),
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
      <div className="h-48 lg:h-auto">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={75}
              paddingAngle={2}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 uppercase text-muted-foreground">
            <tr>
              <th className="w-2 px-2 py-1.5"></th>
              <th className="px-2 py-1.5 text-left">Anúncio</th>
              <th className="px-2 py-1.5 text-right">CPL</th>
              <th className="px-2 py-1.5 text-right">Leads</th>
              <th className="px-2 py-1.5 text-right">Spend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ads.map((a, i) => (
              <tr
                key={a.adId ?? a.name}
                className={a.adId ? 'cursor-pointer hover:bg-muted/40' : ''}
                onClick={() => a.adId && router.push(`/meta-ads/ads/${a.adId}`)}
              >
                <td className="px-2 py-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    aria-hidden
                  />
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    {a.thumbnailUrl && (
                      <img
                        src={a.thumbnailUrl}
                        alt=""
                        className="h-6 w-6 flex-shrink-0 rounded border border-border object-cover"
                      />
                    )}
                    <span className="truncate font-medium">{a.name}</span>
                  </div>
                </td>
                <td className="px-2 py-1.5 text-right font-mono">{formatCurrency(a.cpl, currency)}</td>
                <td className="px-2 py-1.5 text-right">{formatNumberCompact(a.leads)}</td>
                <td className="px-2 py-1.5 text-right font-mono text-muted-foreground">
                  {formatCurrency(a.spend, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
