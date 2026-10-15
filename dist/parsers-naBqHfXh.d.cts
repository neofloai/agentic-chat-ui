import { ComponentType } from 'react';
import { g as ContentBlock, H as HitlDecision, l as ContentBlockDelta } from './types-CIFoqVVK.cjs';
import { C as ChatBlock, B as BlockStatus, a as CheckpointState, b as ChatMessage, D as DeltaHandler } from './stream-reducer-Dbqb9d6I.cjs';

/** What a block can do from inside the chat. */
interface BlockActions {
    /** Sends a new user message (e.g. a follow-up chip inside a card). */
    send(text: string): void;
    /** Answers this block's HITL checkpoint. A no-op if the block has none. */
    resume(decision: HitlDecision): Promise<void>;
    /** Hands an action to the host app's `onAction` (open a record, navigate, download…). */
    emit(name: string, payload?: unknown): void;
    /** Retries the last failed turn in this conversation. */
    retry(): void;
}
interface BlockRenderProps<TData = ContentBlock> {
    block: ChatBlock;
    /** The block's payload after `parse`. The raw wire block when there's no parser. */
    data: TData;
    status: BlockStatus;
    checkpoint?: CheckpointState;
    message: ChatMessage;
    actions: BlockActions;
    /** The last block of a message that's still streaming. */
    isLast: boolean;
}
interface BlockDefinition<TData = any> {
    /** Wire `type`(s) this definition renders. */
    type?: string | readonly string[];
    /** Used when no definition claims the `type`. */
    category?: string | readonly string[];
    /** Full control over matching. Checked before `type` and `category`. */
    match?: (block: ContentBlock) => boolean;
    /** Validates and normalizes the payload. Throwing falls back to the unknown-block renderer. */
    parse?: (block: ContentBlock, chatBlock: ChatBlock) => TData;
    /** Custom delta handling while the block streams. */
    applyDelta?: DeltaHandler;
    render: ComponentType<BlockRenderProps<TData>>;
    /** Plain text for the copy action and screen readers. */
    toText?: (data: TData, block: ChatBlock) => string;
    /** Consecutive blocks with the same group render together (e.g. `'activity'`). */
    group?: string;
    /** A short name for diagnostics. */
    name?: string;
}
interface BlockRegistry {
    readonly definitions: readonly BlockDefinition[];
    resolve(block: ContentBlock): BlockDefinition | undefined;
    /** For the runtime: delta handlers declared by definitions. */
    deltaResolver(block: ContentBlock): DeltaHandler | undefined;
    readonly fallback?: BlockDefinition;
}
interface ChatAction {
    name: string;
    payload?: unknown;
    block?: ChatBlock;
    message?: ChatMessage;
    conversationId: string | null;
}

type ValueFormat = 'text' | 'number' | 'currency' | 'percent' | 'date';
interface FormatOptions {
    format?: ValueFormat;
    currency?: string;
    locale?: string;
}
/** Formats a cell or KPI value for display. Never throws. */
declare function formatValue(value: unknown, { format, currency, locale }?: FormatOptions): string;
/** How tool inputs read in the Figma ToolBlock: strings quoted, everything else as JSON. */
declare function formatJsonish(value: unknown): string;
declare function humanizeKey(key: string): string;

/**
 * Canonical block types, with aliases a backend may already use. Registering a definition
 * under these covers them all. See docs/block-contracts.md for each payload.
 */
declare const BLOCK_TYPES: {
    readonly text: readonly ["text", "markdown"];
    readonly thinking: readonly ["thinking", "reasoning"];
    /** `tool_result` renders inside its tool call's card; one with no matching call gets its own. */
    readonly toolCall: readonly ["tool_call", "tool_use", "tool", "tool_result"];
    readonly table: readonly ["table", "data_table"];
    readonly sources: readonly ["sources", "citations"];
    readonly approval: readonly ["approval", "hitl_approval", "confirmation"];
    readonly choice: readonly ["choice", "hitl_choice", "selection"];
    readonly error: readonly ["error"];
    readonly artifact: readonly ["artifact", "document"];
    readonly image: readonly ["image"];
    readonly plan: readonly ["plan", "steps"];
    readonly chart: readonly ["chart"];
};
interface TextData {
    text: string;
}
declare const parseText: (b: ContentBlock) => TextData;
interface ThinkingData {
    text: string;
    /** How long the model thought, from `duration_ms` or measured while streaming. */
    durationMs?: number;
}
declare const parseThinking: (b: ContentBlock, cb?: ChatBlock) => ThinkingData;
/** `interrupted`: the reply ended before the tool's `tool_result` arrived. */
type ToolStatus = 'running' | 'success' | 'error' | 'interrupted';
interface ToolResultItem {
    title: string;
    snippet?: string;
    url?: string;
}
interface ToolCallData {
    name: string;
    title?: string;
    status: ToolStatus;
    input: [string, unknown][];
    output?: unknown;
    /** One-line result ("4 rows"), shown as the `returned` row. */
    summary?: string;
    /** From a `tool_result`: what the tool found. */
    results?: ToolResultItem[];
    /** From a `tool_result`: how many results there were in total. */
    resultCount?: number;
    durationMs?: number;
    error?: string;
}
/**
 * A tool call and its result as one card. The result is the paired `tool_result` block
 * (`tool_use_id` → the call's id), or the call's own `output` for backends that put it inline.
 * Debug fields such as `http_trace` are never shown.
 */
declare const parseToolCall: (b: ContentBlock, cb?: ChatBlock) => ToolCallData;
interface FallbackData {
    /** Markdown the product sends for clients that don't have its renderer. */
    text?: string;
}
declare const parseFallback: (b: ContentBlock) => FallbackData;
interface TableColumn {
    key: string;
    label: string;
    align: 'left' | 'right' | 'center';
    format?: ValueFormat;
    currency?: string;
}
interface TableData {
    title?: string;
    columns: TableColumn[];
    rows: Record<string, unknown>[];
    /** When the backend sent a preview of a bigger result. */
    totalRows: number;
}
declare const parseTable: (b: ContentBlock) => TableData;
interface SourceItem {
    id: string;
    label: string;
    description?: string;
    url?: string;
    kind?: string;
    selected?: boolean;
}
interface SourcesData {
    title?: string;
    /** Show checkboxes (e.g. which sources the answer used). */
    selectable: boolean;
    items: SourceItem[];
}
declare const parseSources: (b: ContentBlock) => SourcesData;
interface ApprovalData {
    title: string;
    description?: string;
    approveLabel?: string;
    rejectLabel?: string;
    approveValue: HitlDecision;
    rejectValue: HitlDecision;
    tone: 'default' | 'warning' | 'danger';
    details: [string, unknown][];
}
declare const parseApproval: (b: ContentBlock) => ApprovalData;
interface ChoiceOption {
    value: string;
    label: string;
    description?: string;
}
interface ChoiceData {
    title: string;
    description?: string;
    options: ChoiceOption[];
    multiple: boolean;
    min: number;
    max?: number;
    submitLabel?: string;
}
declare const parseChoice: (b: ContentBlock, cb?: ChatBlock) => ChoiceData;
interface ErrorData {
    title: string;
    message?: string;
    retryable: boolean;
    retryAfter?: number;
    code?: string;
}
declare const parseError: (b: ContentBlock) => ErrorData;
interface ArtifactData {
    title: string;
    /** `markdown`, `text`, `json`, `csv`, `code`… */
    format: string;
    content?: string;
    url?: string;
    mimeType?: string;
    size?: number;
}
declare const parseArtifact: (b: ContentBlock) => ArtifactData;
interface ImageData {
    src: string;
    alt: string;
    caption?: string;
    width?: number;
    height?: number;
}
declare const parseImage: (b: ContentBlock) => ImageData;
type PlanStepStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped';
interface PlanStep {
    id: string;
    title: string;
    status: PlanStepStatus;
    detail?: [string, unknown][] | string;
}
interface PlanData {
    title?: string;
    steps: PlanStep[];
}
declare const parsePlan: (b: ContentBlock) => PlanData;
/** Plans stream by snapshot: a full step list (or `{ steps }`) replaces the old one. */
declare function applyPlanDelta(block: ContentBlock, _delta: ContentBlockDelta, snapshot: unknown): ContentBlock | undefined;
type ChartKind = 'bar' | 'line' | 'area' | 'donut';
interface ChartSeries {
    key: string;
    label: string;
    color?: string;
}
interface ChartData {
    kind: ChartKind;
    title?: string;
    subtitle?: string;
    xKey: string;
    series: ChartSeries[];
    data: Record<string, unknown>[];
    stacked: boolean;
    /** Center label on a donut (e.g. "128 invoices"). */
    total?: {
        value: string;
        label?: string;
    };
    valueFormat?: ValueFormat;
    currency?: string;
}
declare const parseChart: (b: ContentBlock) => ChartData;

export { type ApprovalData as A, type BlockRenderProps as B, type ChartData as C, parseArtifact as D, type ErrorData as E, type FallbackData as F, parseChoice as G, parseError as H, type ImageData as I, parseFallback as J, parseImage as K, parsePlan as L, parseSources as M, parseTable as N, parseText as O, type PlanData as P, parseThinking as Q, parseToolCall as R, type SourcesData as S, type TextData as T, type ValueFormat as V, type BlockDefinition as a, type ChartKind as b, type ChartSeries as c, type ThinkingData as d, type ToolCallData as e, type ChoiceData as f, type ArtifactData as g, type TableColumn as h, type TableData as i, BLOCK_TYPES as j, type BlockActions as k, type BlockRegistry as l, type ChatAction as m, type ChoiceOption as n, type FormatOptions as o, parseChart as p, type PlanStep as q, type PlanStepStatus as r, type SourceItem as s, type ToolResultItem as t, type ToolStatus as u, applyPlanDelta as v, formatJsonish as w, formatValue as x, humanizeKey as y, parseApproval as z };
