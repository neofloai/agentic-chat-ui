import { f as ContentBlock, H as HitlDecision, g as StopReason, h as Usage, A as Attachment, i as SuggestedPrompt, j as Source, k as ContentBlockDelta, d as StreamEvent } from './types-BYSMQU8i.cjs';

/** A normalized error the UI can show and act on. */
interface ChatErrorInfo {
    /** `network`, `timeout`, `http_503`, an SSE `error_type`, … */
    type: string;
    message: string;
    /** Seconds to wait before retrying, when the server said so. */
    retryAfter?: number | null;
    retryable: boolean;
}
type CheckpointStatus = 'pending' | 'submitting' | 'resolved' | 'failed';
/** A HITL pause point attached to the block that asked the question. */
interface CheckpointState {
    id: string;
    /** What the decision must look like, as sent by the backend. */
    requires?: unknown;
    status: CheckpointStatus;
    decision?: HitlDecision;
    error?: ChatErrorInfo;
}
type BlockStatus = 'streaming' | 'complete' | 'interrupted';
/** One content block inside a message, as the UI reads it. */
interface ChatBlock {
    id: string;
    type: string;
    category: string;
    status: BlockStatus;
    /** The full wire block: `{ id, type, category, ...payload }`. */
    data: ContentBlock;
    checkpoint?: CheckpointState;
    /** Epoch ms, recorded client-side when the block started and stopped streaming. */
    startedAt?: number;
    completedAt?: number;
}
type MessageStatus = 'streaming' | 'complete' | 'paused' | 'error' | 'cancelled' | 'interrupted';
interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    blocks: ChatBlock[];
    status: MessageStatus;
    createdAt: string;
    stopReason?: StopReason;
    model?: string | null;
    usage?: Usage;
    error?: ChatErrorInfo;
    attachments?: Attachment[];
    /** True for an optimistic user message the server hasn't confirmed yet. */
    local?: boolean;
}
type RunStatus = 'idle' | 'submitting' | 'streaming' | 'paused' | 'cancelling' | 'error';
interface RunState {
    status: RunStatus;
    runId?: string;
    /** The assistant `message_id` from `message_start`, needed for cancel. */
    messageId?: string;
    /** The transient `status` event label ("Searching invoices…"). */
    statusLabel?: string;
    error?: ChatErrorInfo;
}
interface PendingCheckpoint {
    checkpointId: string;
    messageId: string;
    blockId: string;
    requires?: unknown;
}
interface ThreadMeta {
    title: string;
    subtitle?: string;
    greeting?: string;
    suggestedPrompts: SuggestedPrompt[];
    /** The model catalog from row 1. */
    models: string[];
    /** The model chosen through row 4, when known. */
    model?: string;
    sources: Source[];
    archived: boolean;
    createdAt?: string;
    updatedAt?: string;
}
type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
interface ThreadState {
    /** `null` for a new chat that hasn't been created on the server yet. */
    conversationId: string | null;
    loadStatus: LoadStatus;
    loadError?: ChatErrorInfo;
    meta: ThreadMeta;
    messages: ChatMessage[];
    run: RunState;
    pendingCheckpoint?: PendingCheckpoint;
    /** Stream `index` → block id, for the stream in flight. Internal. */
    streamBlockIds: Record<number, string>;
}
type ComposerAttachmentStatus = 'uploading' | 'ready' | 'error';
interface ComposerAttachment {
    id: string;
    name: string;
    size: number;
    contentType: string;
    status: ComposerAttachmentStatus;
    /** 0–1 while uploading, when the uploader reports progress. */
    progress?: number;
    attachment?: Attachment;
    error?: string;
}
interface ComposerState {
    text: string;
    attachments: ComposerAttachment[];
}
interface ConversationItem {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    archived: boolean;
}
interface ConversationsState {
    items: ConversationItem[];
    status: LoadStatus;
    error?: ChatErrorInfo;
    /** Conversation ids with a turn streaming right now (possibly in the background). */
    runningIds: string[];
}
type ConversationGroupKey = 'today' | 'yesterday' | 'previous7' | 'previous30' | 'older';
interface ConversationGroup {
    key: ConversationGroupKey;
    items: ConversationItem[];
}
interface ScopeItem {
    id: string;
    label: string;
    description?: string;
}
interface ScopeGroup {
    id: string;
    label: string;
    items: ScopeItem[];
}
/** Selected item ids, per group id. */
type ScopeSelection = Record<string, string[]>;
interface ScopeState {
    groups: ScopeGroup[];
    selection: ScopeSelection;
    status: LoadStatus;
}
declare const emptyMeta: () => ThreadMeta;
declare const createThreadState: (conversationId: string | null) => ThreadState;

/**
 * Lets a block type take over how deltas are applied (e.g. a plan block whose snapshot is a
 * step list). Return `undefined` to fall back to the default.
 */
type DeltaHandler = (block: ContentBlock, delta: ContentBlockDelta, snapshot: unknown) => ContentBlock | undefined;
interface ReduceContext {
    /** Epoch ms. */
    now: number;
    resolveDeltaHandler?: (block: ContentBlock) => DeltaHandler | undefined;
}
/** The field a text-like block streams into. Thinking blocks may use `thinking` instead of `text`. */
declare function textFieldOf(block: ContentBlock): 'text' | 'thinking';
/**
 * Default delta handling. A `snapshot` is a full overwrite, so it wins whenever it's present:
 * that makes delta application idempotent and a dropped delta can't corrupt the block.
 */
declare function defaultApplyDelta(block: ContentBlock, delta: ContentBlockDelta, snapshot: unknown): ContentBlock;
/** Applies one stream event to a thread. Pure: the same inputs always give the same output. */
declare function reduceStreamEvent(state: ThreadState, event: StreamEvent, ctx: ReduceContext): ThreadState;
/**
 * The stream ended without `message_stop` (network drop, abort, timeout). Marks the message and
 * any open blocks as interrupted so the UI can offer Retry instead of spinning forever.
 */
declare function interruptRun(state: ThreadState, error: ChatErrorInfo | undefined, ctx: Pick<ReduceContext, 'now'>): ThreadState;

export { type BlockStatus as B, type ChatBlock as C, type DeltaHandler as D, type LoadStatus as L, type MessageStatus as M, type PendingCheckpoint as P, type ReduceContext as R, type ScopeGroup as S, type ThreadMeta as T, type CheckpointState as a, type ChatMessage as b, type ComposerAttachment as c, type ChatErrorInfo as d, type CheckpointStatus as e, type ComposerAttachmentStatus as f, type ComposerState as g, type ConversationGroup as h, type ConversationGroupKey as i, type ConversationItem as j, type ConversationsState as k, type RunState as l, type ScopeItem as m, type ScopeSelection as n, type ScopeState as o, type ThreadState as p, createThreadState as q, defaultApplyDelta as r, emptyMeta as s, interruptRun as t, reduceStreamEvent as u, textFieldOf as v, type RunStatus as w };
