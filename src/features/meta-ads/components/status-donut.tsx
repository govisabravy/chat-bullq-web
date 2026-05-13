'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, type PieLabelRenderProps } from 'recharts';
import { ChartTooltip } from '@/features/dashboard/components/chart-tooltip';
import { MetaCampaignStatus } from '../services/meta-ads.service';

interface StatusDonutProps {
  items: Array<{ status: MetaCampaignStatus }>;
  height?: number;
}

const COLORS: Record<MetaCampaignStatus, string> = {
  ACTIVE: 'oklch(0.72 0.17 150)',
  PAUSED: 'oklch(0.65 0.02 270)',
  ARCHIVED: 'oklch(0.78 0.16 85)',
  DELETED: 'oklch(0.65 0.2 25)',
};

export function StatusDonut({ items, height = 220 }: StatusDonutProps) {
  const counts: Record<MetaCampaignStatus, number> = {
    ACTIVE: 0, PAUSED: 0, ARCHIVED: 0, DELETED: 0,
  };
  for (const item of items) counts[item.status] += 1;
  const total = items.length;
  const data = (Object.keys(counts) as MetaCampaignStatus[])
    .filter((k) => counts[k] > 0)
    .map((k) => ({ status: k, count: counts[k], pct: total > 0 ? (counts[k] / total) * 100 : 0 }));

  if (data.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
      >
        Sem campanhas para exibir.
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            label={(entry: PieLabelRenderProps) => {
              const idx = entry.index as number;
              const d = data[idx];
              return d ? `${d.status} ${d.pct.toFixed(0)}%` : '';
            }}
          >
            {data.map((entry) => (
              <Cell key={entry.status} fill={COLORS[entry.status]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
