'use client';

import { ResponsivePie } from '@nivo/pie';
import { useRouter } from 'next/navigation';
import { TopAdByCpl } from '../services/meta-ads.service';
import { formatCurrency, formatNumberCompact } from '../utils/format';

const PALETTE = [
  '#10b981',
  '#3b82f6',
  '#a855f7',
  '#f59e0b',
  '#ef4444',
  '#14b8a6',
  '#f97316',
  '#ec4899',
  '#84cc16',
  '#8b5cf6',
];

interface TopAdsByCplProps {
  ads: TopAdByCpl[];
  currency: string;
  loading?: boolean;
}

export function TopAdsByCpl({ ads, currency, loading }: TopAdsByCplProps) {
  const router = useRouter();

  if (loading) {
    return <div className="h-80 animate-pulse rounded-lg border border-border bg-muted/40" />;
  }

  if (ads.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Sem anúncios com leads no período.
      </div>
    );
  }

  const chartData = ads.map((a, i) => ({
    id: a.adId ?? a.name,
    label: a.name,
    value: parseFloat(a.cpl),
    color: PALETTE[i % PALETTE.length],
  }));

  const totalLeads = ads.reduce((s, a) => s + a.leads, 0);
  const totalSpend = ads.reduce((s, a) => s + parseFloat(a.spend), 0);
  const avgCpl = totalLeads > 0 ? totalSpend / totalLeads : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="relative h-72">
        <ResponsivePie
          data={chartData}
          colors={{ datum: 'data.color' }}
          margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
          innerRadius={0.62}
          padAngle={1.2}
          cornerRadius={4}
          activeOuterRadiusOffset={10}
          activeInnerRadiusOffset={4}
          borderWidth={0}
          enableArcLabels={false}
          enableArcLinkLabels={false}
          animate
          motionConfig="gentle"
          tooltip={({ datum }) => (
            <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-soft">
              <div className="font-medium">{datum.label}</div>
              <div className="mt-1 text-muted-foreground">
                CPL: <span className="font-mono text-foreground">{formatCurrency(datum.value, currency)}</span>
              </div>
            </div>
          )}
          theme={{
            text: { fontFamily: 'inherit', fontSize: 11 },
          }}
        />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            CPL médio
          </div>
          <div className="text-xl font-semibold tracking-tight">
            {formatCurrency(avgCpl, currency)}
          </div>
          <div className="mt-0.5 text-[10px] text-muted-foreground">
            {formatNumberCompact(totalLeads)} leads · {ads.length} ads
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {ads.map((a, i) => (
          <button
            key={a.adId ?? a.name}
            type="button"
            disabled={!a.adId}
            onClick={() => a.adId && router.push(`/meta-ads/ads/${a.adId}`)}
            className="group flex w-full items-center gap-3 rounded-md border border-transparent px-2 py-2 text-left text-xs transition-colors hover:border-border hover:bg-muted/40 disabled:cursor-not-allowed"
          >
            <span
              className="h-3 w-3 flex-shrink-0 rounded-sm"
              style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
              aria-hidden
            />
            {a.thumbnailUrl ? (
              <img
                src={a.thumbnailUrl}
                alt=""
                className="h-7 w-7 flex-shrink-0 rounded border border-border object-cover"
              />
            ) : (
              <div className="h-7 w-7 flex-shrink-0 rounded border border-dashed border-border bg-muted/40" />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-foreground">{a.name}</div>
              <div className="text-[10px] text-muted-foreground">
                {formatNumberCompact(a.leads)} leads · {formatCurrency(a.spend, currency)}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm font-semibold tabular-nums">
                {formatCurrency(a.cpl, currency)}
              </div>
              <div className="text-[10px] text-muted-foreground">CPL</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
