'use client';

import { Metrics, MetaCampaignStatus } from '../services/meta-ads.service';
import { formatCurrency, formatPercent } from '../utils/format';

interface MetricsTableRow {
  id: string;
  name: string;
  status: MetaCampaignStatus;
  objective?: string | null;
  metrics: Metrics;
}

interface MetricsTableProps<T extends MetricsTableRow> {
  items: T[];
  showObjective?: boolean;
  currency?: string;
  onRowClick?: (row: T) => void;
  emptyLabel?: string;
}

const STATUS_STYLES: Record<MetaCampaignStatus, string> = {
  ACTIVE: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  PAUSED: 'border-zinc-500/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300',
  ARCHIVED: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  DELETED: 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300',
};

function fmtNumber(n: number): string {
  return n.toLocaleString('pt-BR');
}

export function MetricsTable<T extends MetricsTableRow>({
  items,
  showObjective,
  currency = 'BRL',
  onRowClick,
  emptyLabel = 'Nenhum item no período.',
}: MetricsTableProps<T>) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Nome</th>
            {showObjective && <th className="px-3 py-2 text-left">Objetivo</th>}
            <th className="px-3 py-2 text-right">Spend</th>
            <th className="px-3 py-2 text-right">Impr</th>
            <th className="px-3 py-2 text-right">Clicks</th>
            <th className="px-3 py-2 text-right">CTR</th>
            <th className="px-3 py-2 text-right">CPC</th>
            <th className="px-3 py-2 text-right">Leads</th>
            <th className="px-3 py-2 text-right">CPL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((row) => (
            <tr
              key={row.id}
              className={onRowClick ? 'cursor-pointer hover:bg-muted/40' : ''}
              onClick={() => onRowClick?.(row)}
            >
              <td className="px-3 py-2">
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase ${STATUS_STYLES[row.status]}`}
                  aria-label={`Status: ${row.status}`}
                >
                  {row.status}
                </span>
              </td>
              <td className="px-3 py-2 font-medium">{row.name}</td>
              {showObjective && (
                <td className="px-3 py-2 text-xs text-muted-foreground">{row.objective ?? '—'}</td>
              )}
              <td className="px-3 py-2 text-right">{formatCurrency(row.metrics.spend, currency)}</td>
              <td className="px-3 py-2 text-right">{fmtNumber(row.metrics.impressions)}</td>
              <td className="px-3 py-2 text-right">{fmtNumber(row.metrics.clicks)}</td>
              <td className="px-3 py-2 text-right">{formatPercent(row.metrics.ctr)}</td>
              <td className="px-3 py-2 text-right">{formatCurrency(row.metrics.cpc, currency)}</td>
              <td className="px-3 py-2 text-right">{fmtNumber(row.metrics.leads)}</td>
              <td className="px-3 py-2 text-right">{row.metrics.cpl ? formatCurrency(row.metrics.cpl, currency) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
