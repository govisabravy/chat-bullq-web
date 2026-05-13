'use client';

import { useRouter } from 'next/navigation';
import { Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AccountSummary } from '../services/meta-ads.service';
import { formatCurrency, formatNumberCompact } from '../utils/format';

interface TopCampaignsCardsProps {
  topCampaigns: AccountSummary['topCampaigns'];
  currency: string;
}

export function TopCampaignsCards({ topCampaigns, currency }: TopCampaignsCardsProps) {
  const router = useRouter();
  if (topCampaigns.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Nenhuma campanha com dados no período.
        </CardContent>
      </Card>
    );
  }

  const maxSpend = Math.max(...topCampaigns.map((c) => parseFloat(c.spend) || 0), 1);

  return (
    <div className="space-y-2">
      {topCampaigns.map((c, idx) => {
        const spendN = parseFloat(c.spend) || 0;
        const pct = maxSpend > 0 ? (spendN / maxSpend) * 100 : 0;
        return (
          <button
            key={c.campaignId ?? c.name}
            type="button"
            onClick={() => c.campaignId && router.push(`/meta-ads/campaigns/${c.campaignId}`)}
            disabled={!c.campaignId}
            className="flex w-full items-center gap-3 rounded-md border border-border bg-card px-3 py-2 text-left transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-xs font-semibold text-amber-700 dark:text-amber-300">
              {idx === 0 ? <Trophy className="h-4 w-4" /> : idx + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{c.name}</div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-muted/60">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${pct}%` }}
                  aria-label={`${pct.toFixed(0)}% relativo ao maior`}
                />
              </div>
              <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>{formatNumberCompact(c.impressions)} impr</span>
                <span>{formatNumberCompact(c.clicks)} clicks</span>
                <span>{formatNumberCompact(c.conversions)} conv</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{formatCurrency(c.spend, currency)}</div>
              <div className="text-[10px] text-muted-foreground">spend</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
