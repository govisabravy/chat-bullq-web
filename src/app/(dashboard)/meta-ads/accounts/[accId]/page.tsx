'use client';

import { useEffect, use, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DollarSign, AlertCircle,
  Percent, BarChart3, Download, UserPlus, DollarSign as Money, Repeat,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAdAccount } from '@/features/meta-ads/hooks/use-ad-accounts';
import { useCampaigns } from '@/features/meta-ads/hooks/use-campaigns';
import { useSummary, useTimeseries, useTopAdsByCpl } from '@/features/meta-ads/hooks/use-insights';
import { AccountSelector } from '@/features/meta-ads/components/account-selector';
import { DateRangePicker, useDateRange } from '@/features/meta-ads/components/date-range-picker';
import { SyncStatusBadge } from '@/features/meta-ads/components/sync-status-badge';
import { MetricCard } from '@/features/meta-ads/components/metric-card';
import { MetricsTable } from '@/features/meta-ads/components/metrics-table';
import { MultiMetricChart } from '@/features/meta-ads/components/multi-metric-chart';
import { FunnelChart } from '@/features/meta-ads/components/funnel-chart';
import { StatusDonut } from '@/features/meta-ads/components/status-donut';
import { TopCampaignsCards } from '@/features/meta-ads/components/top-campaigns-cards';
import { TopAdsByCpl } from '@/features/meta-ads/components/top-ads-by-cpl';
import {
  TableFilters,
  TableFiltersState,
  defaultFilters,
  applyFilters,
} from '@/features/meta-ads/components/table-filters';
import { HeaderPills } from '@/features/meta-ads/components/header-pills';
import { ComparisonToggle, useComparison } from '@/features/meta-ads/components/comparison-toggle';
import { DashboardSkeleton } from '@/features/meta-ads/components/dashboard-skeleton';
import {
  formatCurrency,
  formatNumberCompact,
  formatPercent,
  toCSV,
  downloadCSV,
} from '@/features/meta-ads/utils/format';

export default function AccountDashboardPage({ params }: { params: Promise<{ accId: string }> }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { accId } = use(params);
  const { from, to } = useDateRange();
  const { enabled: comparisonEnabled } = useComparison();
  const { data: account, isLoading: loadingAccount } = useAdAccount(accId);
  const { data: summary, isLoading: loadingSummary } = useSummary({
    accountId: accId,
    from: from ?? undefined,
    to: to ?? undefined,
  });
  const { data: leadsSeries, isLoading: tsLoading } = useTimeseries({
    accountId: accId,
    level: 'ACCOUNT',
    from: from ?? undefined,
    to: to ?? undefined,
    metric: 'leads',
  });
  const { data: cplSeries } = useTimeseries({
    accountId: accId,
    level: 'ACCOUNT',
    from: from ?? undefined,
    to: to ?? undefined,
    metric: 'cpl',
  });
  const { data: topAdsCpl } = useTopAdsByCpl({
    accountId: accId,
    from: from ?? undefined,
    to: to ?? undefined,
  });
  const { data: campaigns = [], isLoading: loadingCampaigns } = useCampaigns(accId, {
    from: from ?? undefined,
    to: to ?? undefined,
  });

  useEffect(() => {
    if (account?.lastSyncStatus === 'SUCCESS') {
      qc.invalidateQueries({ queryKey: ['meta-ads', 'campaigns', accId] });
      qc.invalidateQueries({ queryKey: ['meta-ads', 'summary'] });
    }
  }, [account?.lastSyncStatus, account?.lastSyncAt, accId, qc]);

  const [filters, setFilters] = useState<TableFiltersState>(defaultFilters());
  const filteredCampaigns = useMemo(() => applyFilters(campaigns, filters), [campaigns, filters]);

  const totals = summary?.totals;
  const delta = comparisonEnabled ? summary?.deltaVsPrevious : undefined;
  const currency = account?.currency ?? 'USD';

  const derived = useMemo(() => {
    if (!totals) return null;
    const impr = totals.impressions;
    const clicks = totals.clicks;
    const spend = parseFloat(totals.spend) || 0;
    const leads = totals.leads;
    const reach = totals.reach;
    return {
      ctr: impr > 0 ? (clicks / impr) * 100 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      cpm: impr > 0 ? (spend / impr) * 1000 : 0,
      cpl: leads > 0 ? spend / leads : null,
      frequency: reach > 0 ? impr / reach : 0,
    };
  }, [totals]);

  const handleExportCSV = () => {
    const rows = filteredCampaigns.map((c) => ({
      Status: c.status,
      Nome: c.name,
      Objetivo: c.objective ?? '',
      Spend: c.metrics.spend,
      Impressoes: c.metrics.impressions,
      Clicks: c.metrics.clicks,
      CTR: c.metrics.ctr,
      CPC: c.metrics.cpc,
    }));
    const csv = toCSV(rows);
    const filename = `meta-ads-${accId}-${from}-${to}.csv`;
    downloadCSV(filename, csv);
  };

  if (loadingAccount && loadingSummary && loadingCampaigns) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="sticky top-0 z-10 -mx-6 flex flex-wrap items-center gap-3 border-b border-border bg-background px-6 py-2">
        <AccountSelector activeAccountId={accId} />
        <HeaderPills totals={totals} currency={currency} />
        <div className="ml-auto flex items-center gap-2">
          <ComparisonToggle />
          <DateRangePicker />
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          label="Gasto"
          value={totals ? formatCurrency(totals.spend, currency) : '—'}
          delta={delta?.spend}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <MetricCard
          label="Leads"
          value={totals?.leads ?? 0}
          delta={delta?.leads}
          icon={<UserPlus className="h-4 w-4" />}
        />
        <MetricCard
          label="CPL"
          value={derived?.cpl !== null && derived?.cpl !== undefined ? formatCurrency(derived.cpl, currency) : '—'}
          icon={<Money className="h-4 w-4" />}
        />
        <MetricCard
          label="CTR"
          value={derived ? formatPercent(derived.ctr) : '—'}
          icon={<Percent className="h-4 w-4" />}
        />
        <MetricCard
          label="CPM"
          value={derived ? formatCurrency(derived.cpm, currency) : '—'}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <MetricCard
          label="Frequência"
          value={derived ? derived.frequency.toFixed(2) : '—'}
          icon={<Repeat className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold">Tendência diária de Leads e CPL</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Se CPL sobe sem Leads subir, é hora de revisar criativo.
            </p>
            <div className="mt-4">
              <MultiMetricChart
                loading={tsLoading}
                series={[
                  {
                    data: leadsSeries ?? [],
                    label: 'Leads',
                    color: 'oklch(0.72 0.17 150)',
                    type: 'bar',
                    yAxis: 'left',
                  },
                  {
                    data: cplSeries ?? [],
                    label: 'CPL',
                    color: 'oklch(0.68 0.18 25)',
                    type: 'line',
                    yAxis: 'right',
                  },
                ]}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold">Status das campanhas</h3>
            <div className="mt-2 text-xs text-muted-foreground">
              {campaigns.length} campanha{campaigns.length === 1 ? '' : 's'} no período
            </div>
            <div className="mt-4">
              <StatusDonut items={campaigns} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold">Funil Impressões → Clicks → Leads</h3>
            <div className="mt-4">
              <FunnelChart
                impressions={totals?.impressions ?? 0}
                clicks={totals?.clicks ?? 0}
                conversions={totals?.leads ?? 0}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold">Top campanhas (por spend)</h3>
            <div className="mt-4">
              <TopCampaignsCards
                topCampaigns={summary?.topCampaigns ?? []}
                currency={currency}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold">Anúncios rankeados por CPL (menor primeiro)</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Qual criativo gera lead mais barato. Click numa linha pra ver detalhes do anúncio.
          </p>
          <div className="mt-4">
            <TopAdsByCpl ads={topAdsCpl ?? []} currency={currency} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Campanhas</h3>
              <p className="text-xs text-muted-foreground">
                {filteredCampaigns.length} de {campaigns.length} {campaigns.length === 1 ? 'campanha' : 'campanhas'}
                {' · '}Total spend exibido: {formatCurrency(
                  filteredCampaigns.reduce((s, c) => s + (parseFloat(c.metrics.spend) || 0), 0),
                  currency,
                )}
                {' · '}Total impressões: {formatNumberCompact(
                  filteredCampaigns.reduce((s, c) => s + c.metrics.impressions, 0),
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <TableFilters value={filters} onChange={setFilters} />
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={filteredCampaigns.length === 0}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-input bg-background px-2 text-xs hover:bg-accent disabled:opacity-50"
                aria-label="Exportar CSV"
              >
                <Download className="h-3 w-3" />
                CSV
              </button>
            </div>
          </div>
          <MetricsTable
            items={filteredCampaigns}
            showObjective
            onRowClick={(c) => router.push(`/meta-ads/campaigns/${c.id}`)}
            emptyLabel="Nenhuma campanha no período."
          />
        </CardContent>
      </Card>
    </div>
  );
}
