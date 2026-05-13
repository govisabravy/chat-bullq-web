'use client';

import { useEffect, use, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DollarSign, Eye, MousePointerClick, Target, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAdAccount } from '@/features/meta-ads/hooks/use-ad-accounts';
import { useCampaigns } from '@/features/meta-ads/hooks/use-campaigns';
import { useSummary, useTimeseries } from '@/features/meta-ads/hooks/use-insights';
import { AccountSelector } from '@/features/meta-ads/components/account-selector';
import { DateRangePicker, useDateRange } from '@/features/meta-ads/components/date-range-picker';
import { SyncStatusBadge } from '@/features/meta-ads/components/sync-status-badge';
import { MetricCard } from '@/features/meta-ads/components/metric-card';
import { MetricsTable } from '@/features/meta-ads/components/metrics-table';
import { SpendOverTimeChart } from '@/features/meta-ads/components/spend-over-time-chart';

export default function AccountDashboardPage({ params }: { params: Promise<{ accId: string }> }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { accId } = use(params);
  const { from, to } = useDateRange();
  const { data: account } = useAdAccount(accId);
  const { data: summary } = useSummary({ accountId: accId, from: from ?? undefined, to: to ?? undefined });
  const { data: timeseries, isLoading: tsLoading } = useTimeseries({
    accountId: accId,
    level: 'ACCOUNT',
    from: from ?? undefined,
    to: to ?? undefined,
    metric: 'spend',
  });
  const { data: campaigns = [] } = useCampaigns(accId, { from: from ?? undefined, to: to ?? undefined });

  useEffect(() => {
    if (account?.lastSyncStatus === 'SUCCESS') {
      qc.invalidateQueries({ queryKey: ['meta-ads', 'campaigns', accId] });
      qc.invalidateQueries({ queryKey: ['meta-ads', 'summary'] });
    }
  }, [account?.lastSyncStatus, account?.lastSyncAt, accId, qc]);

  const totals = summary?.totals;
  const delta = summary?.deltaVsPrevious;

  const spendDisplay = useMemo(() => {
    if (!totals?.spend) return '—';
    const n = parseFloat(totals.spend);
    return n.toLocaleString('pt-BR', { style: 'currency', currency: account?.currency ?? 'USD' });
  }, [totals?.spend, account?.currency]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 bg-background py-2">
        <AccountSelector activeAccountId={accId} />
        <DateRangePicker />
        <div className="ml-auto">
          <SyncStatusBadge accountId={accId} />
        </div>
      </div>

      {account?.status === 'ERROR' && (
        <div className="flex items-center gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <AlertCircle className="h-5 w-5" />
          <div className="flex-1">
            Token expirou. Reconecte para continuar a sincronização.
          </div>
          <Link href={`/meta-ads/connect?reconnect=${accId}`} className="font-medium underline">
            Reconectar
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Spend"
          value={spendDisplay}
          delta={delta?.spend}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricCard
          label="Impressões"
          value={totals?.impressions ?? 0}
          delta={delta?.impressions}
          icon={<Eye className="h-4 w-4" />}
        />
        <MetricCard
          label="Clicks"
          value={totals?.clicks ?? 0}
          delta={delta?.clicks}
          icon={<MousePointerClick className="h-4 w-4" />}
        />
        <MetricCard
          label="Conversões"
          value={totals?.conversions ?? 0}
          delta={delta?.conversions}
          icon={<Target className="h-4 w-4" />}
        />
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
          <h3 className="text-sm font-semibold">Campanhas</h3>
          <div className="mt-4">
            <MetricsTable
              items={campaigns}
              showObjective
              onRowClick={(c) => router.push(`/meta-ads/campaigns/${c.id}`)}
              emptyLabel="Nenhuma campanha no período."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
