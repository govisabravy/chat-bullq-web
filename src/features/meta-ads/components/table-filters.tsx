'use client';

import { Search } from 'lucide-react';
import { MetaCampaignStatus } from '../services/meta-ads.service';

export interface TableFiltersState {
  search: string;
  status: MetaCampaignStatus | 'ALL';
  sort: 'spend' | 'impressions' | 'clicks' | 'leads' | 'ctr' | 'name';
}

interface TableFiltersProps {
  value: TableFiltersState;
  onChange: (next: TableFiltersState) => void;
}

const STATUS_OPTIONS: Array<{ value: TableFiltersState['status']; label: string }> = [
  { value: 'ALL', label: 'Todos' },
  { value: 'ACTIVE', label: 'Ativos' },
  { value: 'PAUSED', label: 'Pausados' },
  { value: 'ARCHIVED', label: 'Arquivados' },
  { value: 'DELETED', label: 'Excluídos' },
];

const SORT_OPTIONS: Array<{ value: TableFiltersState['sort']; label: string }> = [
  { value: 'spend', label: 'Spend (maior)' },
  { value: 'impressions', label: 'Impressões' },
  { value: 'clicks', label: 'Clicks' },
  { value: 'leads', label: 'Leads' },
  { value: 'ctr', label: 'CTR' },
  { value: 'name', label: 'Nome (A-Z)' },
];

export function TableFilters({ value, onChange }: TableFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Buscar por nome"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          className="h-8 w-48 rounded-md border border-input bg-background pl-7 pr-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <select
        value={value.status}
        onChange={(e) => onChange({ ...value, status: e.target.value as TableFiltersState['status'] })}
        className="h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <select
        value={value.sort}
        onChange={(e) => onChange({ ...value, sort: e.target.value as TableFiltersState['sort'] })}
        className="h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>Ordenar: {o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function defaultFilters(): TableFiltersState {
  return { search: '', status: 'ALL', sort: 'spend' };
}

interface ApplyFiltersRow {
  name: string;
  status: MetaCampaignStatus;
  metrics: {
    impressions: number;
    clicks: number;
    leads: number;
    spend: string;
    ctr: string;
  };
}

export function applyFilters<T extends ApplyFiltersRow>(items: T[], f: TableFiltersState): T[] {
  let out = items;
  if (f.search.trim()) {
    const q = f.search.trim().toLowerCase();
    out = out.filter((i) => i.name.toLowerCase().includes(q));
  }
  if (f.status !== 'ALL') {
    out = out.filter((i) => i.status === f.status);
  }
  out = [...out].sort((a, b) => {
    switch (f.sort) {
      case 'name': return a.name.localeCompare(b.name);
      case 'impressions': return b.metrics.impressions - a.metrics.impressions;
      case 'clicks': return b.metrics.clicks - a.metrics.clicks;
      case 'leads': return b.metrics.leads - a.metrics.leads;
      case 'ctr': return parseFloat(b.metrics.ctr) - parseFloat(a.metrics.ctr);
      case 'spend':
      default: return parseFloat(b.metrics.spend) - parseFloat(a.metrics.spend);
    }
  });
  return out;
}
