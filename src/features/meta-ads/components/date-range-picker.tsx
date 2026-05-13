'use client';

import { useState } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { Calendar, ChevronDown } from 'lucide-react';
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
  DropdownLabel,
} from '@/components/ui/dropdown';

function isoDay(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

const PRESETS: Array<{ label: string; days: number }> = [
  { label: 'Hoje', days: 0 },
  { label: 'Ontem', days: 1 },
  { label: 'Últimos 7 dias', days: 6 },
  { label: 'Últimos 14 dias', days: 13 },
  { label: 'Últimos 30 dias', days: 29 },
  { label: 'Últimos 90 dias', days: 89 },
];

export function useDateRange() {
  const [from, setFrom] = useQueryState('from', parseAsString.withDefault(isoDay(6)));
  const [to, setTo] = useQueryState('to', parseAsString.withDefault(isoDay(0)));
  return { from, to, setFrom, setTo };
}

export function DateRangePicker() {
  const { from, to, setFrom, setTo } = useDateRange();
  const [customMode, setCustomMode] = useState(false);

  const applyPreset = (days: number) => {
    if (days === 1) {
      const yesterday = isoDay(1);
      setFrom(yesterday);
      setTo(yesterday);
    } else if (days === 0) {
      const today = isoDay(0);
      setFrom(today);
      setTo(today);
    } else {
      setFrom(isoDay(days));
      setTo(isoDay(0));
    }
    setCustomMode(false);
  };

  const label = customMode
    ? `${from} — ${to}`
    : (PRESETS.find((p) => {
        if (p.days === 0) return from === isoDay(0) && to === isoDay(0);
        if (p.days === 1) return from === isoDay(1) && to === isoDay(1);
        return from === isoDay(p.days) && to === isoDay(0);
      })?.label ?? `${from} — ${to}`);

  return (
    <Dropdown>
      <DropdownButton className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
        <Calendar className="h-4 w-4" />
        <span>{label}</span>
        <ChevronDown className="h-4 w-4" />
      </DropdownButton>
      <DropdownMenu anchor="bottom start" className="min-w-56">
        {PRESETS.map((p) => (
          <DropdownItem key={p.label} onClick={() => applyPreset(p.days)}>
            <DropdownLabel>{p.label}</DropdownLabel>
          </DropdownItem>
        ))}
        <DropdownItem onClick={() => setCustomMode(true)}>
          <DropdownLabel>Personalizado…</DropdownLabel>
        </DropdownItem>
        {customMode && (
          <div className="space-y-2 p-2">
            <input
              type="date"
              value={from ?? ''}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
            />
            <input
              type="date"
              value={to ?? ''}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
            />
          </div>
        )}
      </DropdownMenu>
    </Dropdown>
  );
}
