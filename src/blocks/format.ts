export type ValueFormat = 'text' | 'number' | 'currency' | 'percent' | 'date';

export interface FormatOptions {
  format?: ValueFormat;
  currency?: string;
  locale?: string;
}

/** Formats a cell or KPI value for display. Never throws. */
export function formatValue(value: unknown, { format = 'text', currency, locale }: FormatOptions = {}): string {
  if (value === null || value === undefined || value === '') return '—';
  try {
    if (format === 'number' && typeof value === 'number') return value.toLocaleString(locale);
    if (format === 'currency') {
      const n = typeof value === 'number' ? value : Number(value);
      if (Number.isFinite(n)) {
        return currency
          ? new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n)
          : n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    }
    if (format === 'percent') {
      const n = typeof value === 'number' ? value : Number(value);
      if (Number.isFinite(n)) return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(n);
    }
    if (format === 'date') {
      const d = new Date(value as string | number);
      if (!Number.isNaN(d.getTime())) return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
    }
  } catch {
    // fall through to the plain rendering
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/** How tool inputs read in the Figma ToolBlock: strings quoted, everything else as JSON. */
export function formatJsonish(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value);
  if (value === undefined) return '—';
  try {
    const s = JSON.stringify(value);
    return s.length > 160 ? `${s.slice(0, 157)}…` : s;
  } catch {
    return String(value);
  }
}

export function humanizeKey(key: string): string {
  return key.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}
