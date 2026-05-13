'use client';

import { ReactNode } from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: number | null;
  icon?: ReactNode;
}

function formatNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function MetricCard({ label, value, delta, icon }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">
          {typeof value === 'number' ? formatNumber(value) : value}
        </div>
        {delta !== undefined && delta !== null && (
          <div
            className={`mt-2 inline-flex items-center gap-1 text-xs ${
              delta > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : delta < 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-muted-foreground'
            }`}
          >
            {delta > 0 ? <ArrowUp className="h-3 w-3" /> : delta < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            <span>{Math.abs(delta) >= 1_000 ? formatNumber(Math.abs(delta)) : Math.abs(delta).toLocaleString('pt-BR')} vs período anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
