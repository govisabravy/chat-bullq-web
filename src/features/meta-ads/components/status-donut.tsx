'use client';

import { ResponsivePie } from '@nivo/pie';
import { MetaCampaignStatus } from '../services/meta-ads.service';

interface StatusDonutProps {
  items: Array<{ status: MetaCampaignStatus }>;
  height?: number;
}

const COLORS: Record<MetaCampaignStatus, string> = {
  ACTIVE: '#10b981',
  PAUSED: '#71717a',
  ARCHIVED: '#f59e0b',
  DELETED: '#ef4444',
};

const LABELS: Record<MetaCampaignStatus, string> = {
  ACTIVE: 'Ativas',
  PAUSED: 'Pausadas',
  ARCHIVED: 'Arquivadas',
  DELETED: 'Excluídas',
};

export function StatusDonut({ items, height = 240 }: StatusDonutProps) {
  const counts: Record<MetaCampaignStatus, number> = {
    ACTIVE: 0,
    PAUSED: 0,
    ARCHIVED: 0,
    DELETED: 0,
  };
  for (const item of items) counts[item.status] += 1;
  const total = items.length;
  const data = (Object.keys(counts) as MetaCampaignStatus[])
    .filter((k) => counts[k] > 0)
    .map((k) => ({
      id: k,
      label: LABELS[k],
      value: counts[k],
      color: COLORS[k],
    }));

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
    <div className="relative" style={{ height }}>
      <ResponsivePie
        data={data}
        colors={{ datum: 'data.color' }}
        margin={{ top: 12, right: 12, bottom: 28, left: 12 }}
        innerRadius={0.65}
        padAngle={1.5}
        cornerRadius={4}
        activeOuterRadiusOffset={8}
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
              {datum.value} {datum.value === 1 ? 'campanha' : 'campanhas'} ({((Number(datum.value) / total) * 100).toFixed(0)}%)
            </div>
          </div>
        )}
        theme={{ text: { fontFamily: 'inherit', fontSize: 11 } }}
      />
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-7 text-center">
        <div className="text-2xl font-semibold tracking-tight">{total}</div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          campanha{total === 1 ? '' : 's'}
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-1 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px]">
        {data.map((d) => (
          <span key={d.id} className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: d.color }} aria-hidden />
            <span className="text-muted-foreground">{d.label}</span>
            <span className="font-medium text-foreground">{d.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
