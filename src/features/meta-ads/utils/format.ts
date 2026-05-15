export function formatCurrency(value: string | number, currency = 'BRL', locale = 'pt-BR'): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!isFinite(n)) return '—';
  return n.toLocaleString(locale, { style: 'currency', currency });
}

export function formatCurrencyCompact(value: string | number, currency = 'BRL', locale = 'pt-BR'): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!isFinite(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 1 })}M ${currencySymbol(currency)}`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toLocaleString(locale, { maximumFractionDigits: 1 })}k ${currencySymbol(currency)}`;
  return formatCurrency(n, currency, locale);
}

export function currencySymbol(currency: string): string {
  try {
    const fmt = new Intl.NumberFormat('en', { style: 'currency', currency }).formatToParts(0);
    return fmt.find((p) => p.type === 'currency')?.value ?? currency;
  } catch {
    return currency;
  }
}

export function formatNumberCompact(value: number, locale = 'pt-BR'): string {
  if (!isFinite(value)) return '—';
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 1 })}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toLocaleString(locale, { maximumFractionDigits: 1 })}k`;
  return value.toLocaleString(locale);
}

export function formatPercent(value: string | number, decimals = 2): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!isFinite(n)) return '—';
  return `${n.toFixed(decimals)}%`;
}

export function formatDelta(value: number | null | undefined, locale = 'pt-BR'): string {
  if (value === null || value === undefined || !isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  if (Math.abs(value) >= 1_000) return `${sign}${formatNumberCompact(value, locale)}`;
  return `${sign}${value.toLocaleString(locale)}`;
}

export function toCSV(rows: Record<string, string | number | null | undefined>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number | null | undefined): string => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ];
  return lines.join('\n');
}

export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
