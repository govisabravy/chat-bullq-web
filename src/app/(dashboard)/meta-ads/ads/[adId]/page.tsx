'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Eye, MousePointerClick, UserPlus, ImageOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAd } from '@/features/meta-ads/hooks/use-ads';
import { useTimeseries } from '@/features/meta-ads/hooks/use-insights';
import { DateRangePicker, useDateRange } from '@/features/meta-ads/components/date-range-picker';
import { MetricCard } from '@/features/meta-ads/components/metric-card';
import { SpendOverTimeChart } from '@/features/meta-ads/components/spend-over-time-chart';
import { formatCurrency } from '@/features/meta-ads/utils/format';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  PAUSED: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300',
  ARCHIVED: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  DELETED: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
};

export default function AdDetailPage({ params }: { params: Promise<{ adId: string }> }) {
  const { adId } = use(params);
  const { from, to } = useDateRange();
  const { data: ad } = useAd(adId, { from: from ?? undefined, to: to ?? undefined });
  const { data: timeseries, isLoading: tsLoading } = useTimeseries({
    accountId: (ad as any)?.adAccountId ?? '',
    level: 'AD',
    entityId: ad?.externalId,
    from: from ?? undefined,
    to: to ?? undefined,
    metric: 'spend',
  });

  const spendDisplay = useMemo(() => {
    if (!ad?.metrics?.spend) return '—';
    return formatCurrency(ad.metrics.spend);
  }, [ad?.metrics?.spend]);

  if (!ad) {
    return (
      <div className="mx-auto w-full max-w-6xl p-6">
        <div className="h-32 animate-pulse rounded-lg border border-border bg-muted/40" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Link
          href="/meta-ads"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <DateRangePicker />
      </div>

      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{ad.name}</h1>
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs uppercase ${STATUS_STYLES[ad.status]}`}>
            {ad.status}
          </span>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-6 p-5 md:grid-cols-[200px_1fr]">
          <div className="flex h-48 w-full items-center justify-center overflow-hidden rounded-md border border-border bg-muted/40 md:h-auto">
            {ad.creative?.thumbnailUrl ? (
              <img
                src={ad.creative.thumbnailUrl}
                alt={ad.creative.title ?? ad.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <ImageOff className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Título</div>
              <div>{ad.creative?.title ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Body</div>
              <div className="whitespace-pre-wrap">{ad.creative?.body ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Call to Action</div>
              <div>{ad.creative?.callToAction ?? '—'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Spend" value={spendDisplay} icon={<DollarSign className="h-4 w-4" />} />
        <MetricCard label="Impressões" value={ad.metrics.impressions} icon={<Eye className="h-4 w-4" />} />
        <MetricCard label="Clicks" value={ad.metrics.clicks} icon={<MousePointerClick className="h-4 w-4" />} />
        <MetricCard label="Leads" value={ad.metrics.leads} icon={<UserPlus className="h-4 w-4" />} />
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold">Spend ao longo do tempo</h3>
          <div className="mt-4">
            <SpendOverTimeChart data={timeseries ?? []} loading={tsLoading} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
