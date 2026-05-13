'use client';

import { DollarSign, Eye, Target } from 'lucide-react';
import { AccountSummary } from '../services/meta-ads.service';
import { formatCurrencyCompact, formatNumberCompact } from '../utils/format';

interface HeaderPillsProps {
  totals: AccountSummary['totals'] | undefined;
  currency: string;
}

export function HeaderPills({ totals, currency }: HeaderPillsProps) {
  if (!totals) return null;
  const items = [
    {
      icon: <DollarSign className="h-3 w-3" />,
      label: 'Spend',
      value: formatCurrencyCompact(totals.spend, currency),
    },
    {
      icon: <Eye className="h-3 w-3" />,
      label: 'Impressões',
      value: formatNumberCompact(totals.impressions),
    },
    {
      icon: <Target className="h-3 w-3" />,
      label: 'Conversões',
      value: formatNumberCompact(totals.conversions),
    },
  ];
  return (
    <div className="hidden items-center gap-2 md:flex">
      {items.map((p) => (
        <span
          key={p.label}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px]"
          aria-label={`${p.label}: ${p.value}`}
        >
          <span className="text-muted-foreground">{p.icon}</span>
          <span className="font-medium">{p.value}</span>
        </span>
      ))}
    </div>
  );
}
