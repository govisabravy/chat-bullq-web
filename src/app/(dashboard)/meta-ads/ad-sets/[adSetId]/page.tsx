'use client';

import { use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, DollarSign, Eye, MousePointerClick, UserPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAdSet } from '@/features/meta-ads/hooks/use-ad-sets';
import { useAds } from '@/features/meta-ads/hooks/use-ads';
import { useTimeseries } from '@/features/meta-ads/hooks/use-insights';
import { DateRangePicker, useDateRange } from '@/features/meta-ads/components/date-range-picker';
import { MetricCard } from '@/features/meta-ads/components/metric-card';
import { MetricsTable } from '@/features/meta-ads/components/metrics-table';
import { SpendOverTimeChart } from '@/features/meta-ads/components/spend-over-time-chart';
import { formatCurrency } from '@/features/meta-ads/utils/format';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  PAUSED: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300',
  ARCHIVED: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  DELETED: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
};

export default function AdSetDrillPage({ params }: { params: Promise<{ adSetId: string }> }) {
  const router = useRouter();
  const { adSetId } = use(params);
  const { from, to } = useDateRange();
  const { data: adSet } = useAdSet(adSetId, { from: from ?? undefined, to: to ?? undefined });
  const { data: ads = [] } = useAds(adSetId, { from: from ?? undefined, to: to ?? undefined });
  const { data: timeseries, isLoading: tsLoading } = useTimeseries({
    accountId: (adSet as any)?.adAccountId ?? '',
    level: 'ADSET',
    entityId: adSet?.externalId,
    from: from ?? undefined,
    to: to ?? undefined,
    metric: 'spend',
  });

  const spendDisplay = useMemo(() => {
    if (!adSet?.metrics?.spend) return '—';
    return formatCurrency(adSet.metrics.spend);
  }, [adSet?.metrics?.spend]);

  if (!adSet) {
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
          <h1 className="text-2xl font-semibold tracking-tight">{adSet.name}</h1>
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs uppercase ${STATUS_STYLES[adSet.status]}`}>
            {adSet.status}
          </span>
        </div>
        {adSet.optimizationGoal && (
          <p className="mt-1 text-sm text-muted-foreground">Otimização: {adSet.optimizationGoal}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Spend" value={spendDisplay} icon={<DollarSign className="h-4 w-4" />} />
        <MetricCard label="Impressões" value={adSet.metrics.impressions} icon={<Eye className="h-4 w-4" />} />
        <MetricCard label="Clicks" value={adSet.metrics.clicks} icon={<MousePointerClick className="h-4 w-4" />} />
        <MetricCard label="Leads" value={adSet.metrics.leads} icon={<UserPlus className="h-4 w-4" />} />
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold">Spend ao longo do tempo</h3>
          <div className="mt-4">
            <SpendOverTimeChart data={timeseries ?? []} loading={tsLoading} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold">Ads</h3>
          <div className="mt-4">
            <MetricsTable
              items={ads}
              onRowClick={(a) => router.push(`/meta-ads/ads/${a.id}`)}
              emptyLabel="Nenhum ad no período."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
