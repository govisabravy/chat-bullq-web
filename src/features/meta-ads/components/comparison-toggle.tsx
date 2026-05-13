'use client';

import { useQueryState, parseAsString } from 'nuqs';
import { GitCompare } from 'lucide-react';

export function useComparison() {
  const [compare, setCompare] = useQueryState('compare', parseAsString.withDefault('on'));
  const enabled = compare !== 'off';
  return {
    enabled,
    toggle: () => setCompare(enabled ? 'off' : 'on'),
  };
}

export function ComparisonToggle() {
  const { enabled, toggle } = useComparison();
  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs transition-colors ${
        enabled
          ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
          : 'border-input bg-background text-muted-foreground hover:bg-accent'
      }`}
      aria-pressed={enabled}
      aria-label="Comparar com período anterior"
    >
      <GitCompare className="h-3 w-3" />
      {enabled ? 'Comparando' : 'Comparar'}
    </button>
  );
}
