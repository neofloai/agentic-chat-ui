import type { ContentBlock, ContentBlockDelta, HitlDecision } from '../core/protocol/types';
import type { ChatBlock } from '../core/store/types';
import type { ValueFormat } from './format';

/**
 * Canonical block types, with aliases a backend may already use. Registering a definition
 * under these covers them all. See docs/block-contracts.md for each payload.
 */
export const BLOCK_TYPES = {
  text: ['text', 'markdown'],
  thinking: ['thinking', 'reasoning'],
  toolCall: ['tool_call', 'tool_use', 'tool'],
  table: ['table', 'data_table'],
  sources: ['sources', 'citations'],
  approval: ['approval', 'hitl_approval', 'confirmation'],
  choice: ['choice', 'hitl_choice', 'selection'],
  error: ['error'],
  artifact: ['artifact', 'document'],
  image: ['image'],
  plan: ['plan', 'steps'],
  chart: ['chart'],
} as const;

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : fallback);
const optStr = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined);
const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const first = (...vals: unknown[]) => vals.find((v) => v !== undefined && v !== null);

function elapsed(cb?: ChatBlock): number | undefined {
  return cb?.startedAt && cb.completedAt && cb.completedAt >= cb.startedAt ? cb.completedAt - cb.startedAt : undefined;
}

// --- text -------------------------------------------------------------------------------------

export interface TextData {
  text: string;
}
export const parseText = (b: ContentBlock): TextData => ({ text: str(first(b.text, b.markdown, b.content)) });

// --- thinking ---------------------------------------------------------------------------------

export interface ThinkingData {
  text: string;
  /** How long the model thought, from `duration_ms` or measured while streaming. */
  durationMs?: number;
}
export const parseThinking = (b: ContentBlock, cb?: ChatBlock): ThinkingData => ({
  text: str(first(b.thinking, b.text)),
  durationMs: num(b.duration_ms) ?? elapsed(cb),
});

// --- tool call --------------------------------------------------------------------------------

export type ToolStatus = 'running' | 'success' | 'error';

export interface ToolCallData {
  name: string;
  title?: string;
  status: ToolStatus;
  input: [string, unknown][];
  output?: unknown;
  /** One-line result ("4 rows"), shown as the `returned` row. */
  summary?: string;
  durationMs?: number;
  error?: string;
}

function parsePartialJson(v: unknown): Json {
  if (typeof v !== 'string' || !v.trim()) return {};
  try {
    return obj(JSON.parse(v));
  } catch {
    return {};
  }
}

export const parseToolCall = (b: ContentBlock, cb?: ChatBlock): ToolCallData => {
  const input = obj(first(b.input, b.arguments, b.args, b.parameters));
  const inputEntries = Object.entries(Object.keys(input).length ? input : parsePartialJson(b.partial_json));
  const rawStatus = str(b.status).toLowerCase();
  const status: ToolStatus =
    rawStatus === 'error' || rawStatus === 'failed' || b.is_error === true || optStr(b.error)
      ? 'error'
      : rawStatus === 'running' || rawStatus === 'in_progress' || (cb?.status === 'streaming' && rawStatus !== 'success')
        ? 'running'
        : 'success';
  return {
    name: str(first(b.name, b.tool_name, b.tool), 'tool'),
    title: optStr(b.title),
    status,
    input: inputEntries,
    output: first(b.output, b.result),
    summary: optStr(first(b.result_summary, b.summary)),
    durationMs: num(b.duration_ms) ?? elapsed(cb),
    error: optStr(b.error),
  };
};

// --- table ------------------------------------------------------------------------------------

export interface TableColumn {
  key: string;
  label: string;
  align: 'left' | 'right' | 'center';
  format?: ValueFormat;
  currency?: string;
}

export interface TableData {
  title?: string;
  columns: TableColumn[];
  rows: Record<string, unknown>[];
  /** When the backend sent a preview of a bigger result. */
  totalRows: number;
}

const NUMERIC: ReadonlySet<string> = new Set(['number', 'currency', 'percent']);

export const parseTable = (b: ContentBlock): TableData => {
  let columns: TableColumn[] = arr(b.columns).map((c, i) => {
    if (typeof c === 'string') return { key: c, label: c, align: 'left' as const };
    const o = obj(c);
    const key = str(first(o.key, o.id, o.field, o.name), `col_${i}`);
    const format = optStr(o.format) as ValueFormat | undefined;
    const align = (optStr(o.align) as TableColumn['align'] | undefined) ?? (format && NUMERIC.has(format) ? 'right' : 'left');
    return { key, label: str(first(o.label, o.title, o.header), key), align, format, currency: optStr(o.currency) };
  });
  const rawRows = arr(b.rows);
  const rows = rawRows.map((r) => {
    if (Array.isArray(r)) return Object.fromEntries(columns.map((c, i) => [c.key, r[i]]));
    return obj(r);
  });
  if (!columns.length && rows[0]) {
    columns = Object.keys(rows[0]).map((k) => ({
      key: k,
      label: k,
      align: typeof rows[0]![k] === 'number' ? ('right' as const) : ('left' as const),
    }));
  }
  return { title: optStr(b.title), columns, rows, totalRows: num(first(b.total_rows, b.row_count)) ?? rows.length };
};

// --- sources ----------------------------------------------------------------------------------

export interface SourceItem {
  id: string;
  label: string;
  description?: string;
  url?: string;
  kind?: string;
  selected?: boolean;
}

export interface SourcesData {
  title?: string;
  /** Show checkboxes (e.g. which sources the answer used). */
  selectable: boolean;
  items: SourceItem[];
}

export const parseSources = (b: ContentBlock): SourcesData => {
  const items = arr(first(b.items, b.sources, b.citations)).map((raw, i) => {
    const o = typeof raw === 'string' ? { label: raw } : obj(raw);
    return {
      id: str(first(o.id, o.source_id), String(i)),
      label: str(first(o.label, o.title, o.name), `Source ${i + 1}`),
      description: optStr(first(o.description, o.snippet, o.subtitle)),
      url: optStr(first(o.url, o.href)),
      kind: optStr(first(o.kind, o.type)),
      selected: typeof first(o.selected, o.used) === 'boolean' ? Boolean(first(o.selected, o.used)) : undefined,
    };
  });
  return {
    title: optStr(b.title),
    selectable: b.selectable === true || items.some((i) => i.selected !== undefined),
    items,
  };
};

// --- approval (HITL) --------------------------------------------------------------------------

export interface ApprovalData {
  title: string;
  description?: string;
  approveLabel?: string;
  rejectLabel?: string;
  approveValue: HitlDecision;
  rejectValue: HitlDecision;
  tone: 'default' | 'warning' | 'danger';
  details: [string, unknown][];
}

export const parseApproval = (b: ContentBlock): ApprovalData => {
  const tone = str(first(b.tone, b.severity));
  return {
    title: str(first(b.title, b.question, b.prompt), ''),
    description: optStr(first(b.description, b.body, b.message, b.text)),
    approveLabel: optStr(first(b.approve_label, b.confirm_label)),
    rejectLabel: optStr(first(b.reject_label, b.cancel_label)),
    approveValue: (first(b.approve_value) as HitlDecision | undefined) ?? 'approve',
    rejectValue: (first(b.reject_value) as HitlDecision | undefined) ?? 'reject',
    tone: tone === 'danger' || tone === 'error' ? 'danger' : tone === 'warning' ? 'warning' : 'default',
    details: Object.entries(obj(b.details)),
  };
};

// --- choice (HITL) ----------------------------------------------------------------------------

export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
}

export interface ChoiceData {
  title: string;
  description?: string;
  options: ChoiceOption[];
  multiple: boolean;
  min: number;
  max?: number;
  submitLabel?: string;
}

export const parseChoice = (b: ContentBlock, cb?: ChatBlock): ChoiceData => {
  const requires = obj(cb?.checkpoint?.requires);
  const options = arr(first(b.options, requires.options)).map((raw) => {
    if (typeof raw === 'string') return { value: raw, label: raw };
    const o = obj(raw);
    const value = str(first(o.value, o.id), '');
    return { value, label: str(first(o.label, o.title), value), description: optStr(o.description) };
  });
  const multiple = Boolean(first(b.multiple, b.multi_select, requires.multiple));
  return {
    title: str(first(b.title, b.question, b.prompt), ''),
    description: optStr(first(b.description, b.body)),
    options: options.filter((o) => o.value !== ''),
    multiple,
    min: num(first(b.min, b.min_selections, requires.min)) ?? 1,
    max: num(first(b.max, b.max_selections, requires.max)) ?? (multiple ? undefined : 1),
    submitLabel: optStr(b.submit_label),
  };
};

// --- error ------------------------------------------------------------------------------------

export interface ErrorData {
  title: string;
  message?: string;
  retryable: boolean;
  retryAfter?: number;
  code?: string;
}

export const parseError = (b: ContentBlock): ErrorData => ({
  title: str(first(b.title, b.error_type), 'Something went wrong'),
  message: optStr(first(b.message, b.detail, b.text)),
  retryable: b.retryable !== false,
  retryAfter: num(b.retry_after),
  code: optStr(first(b.code, b.error_type)),
});

// --- artifact ---------------------------------------------------------------------------------

export interface ArtifactData {
  title: string;
  /** `markdown`, `text`, `json`, `csv`, `code`… */
  format: string;
  content?: string;
  url?: string;
  mimeType?: string;
  size?: number;
}

const EXT_FORMAT: Record<string, string> = { md: 'markdown', markdown: 'markdown', txt: 'text', json: 'json', csv: 'csv' };

export const parseArtifact = (b: ContentBlock): ArtifactData => {
  const title = str(first(b.filename, b.title, b.name), 'Untitled');
  const ext = title.includes('.') ? title.split('.').pop()!.toLowerCase() : '';
  return {
    title,
    format: str(first(b.format, b.language), EXT_FORMAT[ext] ?? (ext || 'text')),
    content: optStr(first(b.content, b.text)) ?? (typeof b.content === 'string' ? b.content : undefined),
    url: optStr(b.url),
    mimeType: optStr(first(b.mime_type, b.content_type)),
    size: num(b.size),
  };
};

// --- image ------------------------------------------------------------------------------------

export interface ImageData {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export const parseImage = (b: ContentBlock): ImageData => {
  const src = str(first(b.url, b.src));
  if (!src) throw new Error('image block has no url');
  return {
    src,
    alt: str(first(b.alt, b.caption), ''),
    caption: optStr(b.caption),
    width: num(b.width),
    height: num(b.height),
  };
};

// --- plan -------------------------------------------------------------------------------------

export type PlanStepStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped';

export interface PlanStep {
  id: string;
  title: string;
  status: PlanStepStatus;
  detail?: [string, unknown][] | string;
}

export interface PlanData {
  title?: string;
  steps: PlanStep[];
}

const STEP_STATUS: Record<string, PlanStepStatus> = {
  pending: 'pending',
  todo: 'pending',
  queued: 'pending',
  running: 'running',
  in_progress: 'running',
  active: 'running',
  done: 'done',
  completed: 'done',
  complete: 'done',
  success: 'done',
  failed: 'failed',
  error: 'failed',
  skipped: 'skipped',
};

export const parsePlan = (b: ContentBlock): PlanData => ({
  title: optStr(b.title),
  steps: arr(b.steps).map((raw, i) => {
    const o = typeof raw === 'string' ? { title: raw } : obj(raw);
    const detail = o.detail ?? o.details;
    return {
      id: str(o.id, String(i)),
      title: str(first(o.title, o.label, o.name), `Step ${i + 1}`),
      status: STEP_STATUS[str(o.status).toLowerCase()] ?? 'pending',
      detail:
        typeof detail === 'string' ? detail : detail && typeof detail === 'object' ? Object.entries(obj(detail)) : undefined,
    };
  }),
});

/** Plans stream by snapshot: a full step list (or `{ steps }`) replaces the old one. */
export function applyPlanDelta(block: ContentBlock, _delta: ContentBlockDelta, snapshot: unknown): ContentBlock | undefined {
  if (Array.isArray(snapshot)) return { ...block, steps: snapshot };
  return undefined;
}

// --- chart ------------------------------------------------------------------------------------

export type ChartKind = 'bar' | 'line' | 'area' | 'donut';

export interface ChartSeries {
  key: string;
  label: string;
  color?: string;
}

export interface ChartData {
  kind: ChartKind;
  title?: string;
  subtitle?: string;
  xKey: string;
  series: ChartSeries[];
  data: Record<string, unknown>[];
  stacked: boolean;
  /** Center label on a donut (e.g. "128 invoices"). */
  total?: { value: string; label?: string };
  valueFormat?: ValueFormat;
  currency?: string;
}

const KIND: Record<string, ChartKind> = { bar: 'bar', column: 'bar', line: 'line', area: 'area', donut: 'donut', pie: 'donut' };

export const parseChart = (b: ContentBlock): ChartData => {
  const data = arr(b.data).map(obj);
  const xKey = str(first(b.x_key, b.xKey, b.category_key), 'label');
  let series: ChartSeries[] = arr(b.series).map((s) => {
    if (typeof s === 'string') return { key: s, label: s };
    const o = obj(s);
    const key = str(first(o.key, o.id, o.field), 'value');
    return { key, label: str(first(o.label, o.name), key), color: optStr(o.color) };
  });
  if (!series.length && data[0]) {
    series = Object.keys(data[0])
      .filter((k) => k !== xKey && typeof data[0]![k] === 'number')
      .map((k) => ({ key: k, label: k }));
  }
  const total = obj(b.total);
  return {
    kind: KIND[str(first(b.chart_type, b.kind, b.variant)).toLowerCase()] ?? 'bar',
    title: optStr(b.title),
    subtitle: optStr(b.subtitle),
    xKey,
    series,
    data,
    stacked: b.stacked === true,
    total: total.value !== undefined ? { value: str(total.value), label: optStr(total.label) } : undefined,
    valueFormat: optStr(b.value_format) as ValueFormat | undefined,
    currency: optStr(b.currency),
  };
};
