'use client';

import { formatNumberCompact, formatPercent } from '../utils/format';

interface FunnelChartProps {
  impressions: number;
  clicks: number;
  conversions: number;
}

interface Stage {
  label: string;
  value: number;
  color: string;
}

export function FunnelChart({ impressions, clicks, conversions }: FunnelChartProps) {
  const max = Math.max(impressions, 1);
  const stages: Stage[] = [
    { label: 'Impressões', value: impressions, color: 'oklch(0.68 0.15 230)' },
    { label: 'Clicks', value: clicks, color: 'oklch(0.72 0.17 150)' },
    { label: 'Leads', value: conversions, color: 'oklch(0.62 0.2 290)' },
  ];

  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const cr = clicks > 0 ? (conversions / clicks) * 100 : 0;
  const cvr = impressions > 0 ? (conversions / impressions) * 100 : 0;

  return (
    <div className="space-y-3">
      {stages.map((stage, idx) => {
        const widthPct = max > 0 ? (stage.value / max) * 100 : 0;
        return (
          <div key={stage.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium">{stage.label}</span>
              <span className="text-muted-foreground">{formatNumberCompact(stage.value)}</span>
            </div>
            <div className="h-6 w-full rounded-md bg-muted/40 overflow-hidden">
              <div
                className="h-full rounded-md transition-all"
                style={{ width: `${Math.max(widthPct, 1)}%`, backgroundColor: stage.color }}
                aria-label={`${stage.label}: ${stage.value}`}
              />
            </div>
            {idx < stages.length - 1 && (
              <div className="mt-1 text-right text-[10px] text-muted-foreground">
                ↓ {idx === 0 ? `CTR ${formatPercent(ctr)}` : `CR ${formatPercent(cr)}`}
              </div>
            )}
          </div>
        );
      })}
      <div className="mt-3 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs">
        <span className="font-medium">Conversão total: </span>
        <span>{formatPercent(cvr)}</span>
        <span className="text-muted-foreground"> (impressão → conversão)</span>
      </div>
    </div>
  );
}
