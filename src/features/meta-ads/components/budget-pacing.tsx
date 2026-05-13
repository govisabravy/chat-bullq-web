'use client';

import { formatCurrency, formatPercent } from '../utils/format';

interface BudgetPacingProps {
  spend: string | number;
  dailyBudget?: string | null;
  lifetimeBudget?: string | null;
  currency: string;
  compact?: boolean;
}

export function BudgetPacing({
  spend,
  dailyBudget,
  lifetimeBudget,
  currency,
  compact,
}: BudgetPacingProps) {
  const spendN = typeof spend === 'string' ? parseFloat(spend) : spend;
  const dailyN = dailyBudget ? parseFloat(dailyBudget) : null;
  const lifetimeN = lifetimeBudget ? parseFloat(lifetimeBudget) : null;

  // Meta returns budgets in account currency minor units (cents). Detect and convert.
  // Heuristic: if value >= 1000 and looks integer, assume cents.
  const normalize = (n: number | null): number | null => {
    if (n === null || !isFinite(n)) return null;
    return n >= 1000 && Number.isInteger(n) ? n / 100 : n;
  };
  const daily = normalize(dailyN);
  const lifetime = normalize(lifetimeN);

  if (daily === null && lifetime === null) {
    return <span className="text-xs text-muted-foreground">Sem orçamento</span>;
  }

  const budget = daily ?? lifetime ?? 0;
  const budgetLabel = daily !== null ? 'diário' : 'total';
  const pct = budget > 0 ? Math.min((spendN / budget) * 100, 999) : 0;
  const barWidth = Math.min(pct, 100);
  const color =
    pct >= 95 ? 'bg-red-500'
    : pct >= 75 ? 'bg-amber-500'
    : 'bg-primary';

  if (compact) {
    return (
      <div className="space-y-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
          <div className={`h-full ${color}`} style={{ width: `${barWidth}%` }} />
        </div>
        <div className="text-[10px] text-muted-foreground">
          {formatPercent(pct, 0)} do orçamento {budgetLabel}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Spend / orçamento {budgetLabel}</span>
        <span className="font-medium">
          {formatCurrency(spendN, currency)} / {formatCurrency(budget, currency)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
        <div className={`h-full ${color} transition-all`} style={{ width: `${barWidth}%` }} />
      </div>
      <div className="text-[10px] text-muted-foreground">{formatPercent(pct)} consumido</div>
    </div>
  );
}
