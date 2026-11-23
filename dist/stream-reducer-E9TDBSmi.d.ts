import { g as ContentBlock, H as HitlDecision, h as StopReason, i as Usage, A as Attachment, E as Ext, C as ChatConfig, j as SuggestedPrompt, k as Source, l as ContentBlockDelta, e as StreamEvent } from './types-CIFoqVVK.js';

/**
 * What the UI offers for an error: Try again, sign in again, reconnect a source, or nothing.
 * Decided from the error code first and the HTTP status second.
 */
type ErrorAction = 'retry' | 'sign_in' | 'reconnect' | 'none';
/** A normalized error the UI can show and act on. */
interface ChatErrorInfo {
    /**
     * The error code: the server's `error.type` or stream `error_type` when it sent one
     * (`session_busy`, `connection_expired`, `askneo.gate_required`…), else `http_<status>`,
     * `network`, `timeout`…
     */
    type: string;
    message: string;
    /** Seconds to wait before retrying, when the server said so. */
    retryAfter?: number | null;
    retryable: boolean;
    /** What the UI should offer. Absent on errors from older versions; read `retryable` then. */
    action?: ErrorAction;
    /** The HTTP status, for errors from a REST call. */
    status?: number;
    /** Quote it when reporting a bug. */
    requestId?: string | null;
    details?: Record<string, unknown> | null;
    /** For `connection_required` / `connection_expired`: the source to reconnect (`details.source`). */
    sourceId?: string;
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
    /** On a tool call: its paired `tool_result` block, shown in the same card. */
    toolResult?: ChatBlock;
    /** On a `tool_use`: the reply ended without its `tool_result`, so the card shows "interrupted". */
    toolResultMissing?: boolean;
    /** On a `tool_result`: the id of the tool call whose card shows it. Not rendered on its own. */
    pairedWith?: string;
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
    /** On user messages: the `client_message_id` sent with it. */
    clientMessageId?: string;
    runId?: string;
    /** Product-only fields, passed through untouched. */
    ext?: Ext;
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
    /** The model catalog an older backend returned on endpoint 1. The config's `models` replaces it. */
    models: string[];
    /** The conversation's `selected_model`. */
    model?: string;
    /** The server's sources for this conversation (settings and connection status, never credentials). */
    sources: Source[];
    archived: boolean;
    createdAt?: string;
    updatedAt?: string;
    /** Product-only fields, passed through untouched. */
    ext?: Ext;
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
    /** The conversation's `selected_model`, when the list sends it. */
    model?: string;
    messageCount?: number;
    ext?: Ext;
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
/**
 * `ready`: the backend returned its config. `unavailable`: it has no config endpoint (404), so
 * the host's `capabilities` option and the defaults apply. `error`: the call failed; the
 * defaults apply until the next start.
 */
type ConfigStatus = 'idle' | 'loading' | 'ready' | 'unavailable' | 'error';
/** What the UI can use, after combining the backend's config with the host's switches. */
interface Capabilities {
    hitl: boolean;
    attachments: boolean;
    workflowContext: boolean;
    archive: boolean;
    cancel: 'server' | 'disconnect';
    perTurnModel: boolean;
    perTurnSources: boolean;
}
interface ChatConfigState {
    status: ConfigStatus;
    /** The backend's config, normalized. Present when `status` is `ready`. */
    config?: ChatConfig;
    capabilities: Capabilities;
    error?: ChatErrorInfo;
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
    /** Where the catalog came from: the host's `scope` option, or the backend config's `workflows`. */
    origin?: 'host' | 'config';
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
/** Block types that call a tool and can be answered by a `tool_result`. */
declare const TOOL_CALL_TYPES: ReadonlySet<string>;
/**
 * Pairs each `tool_result` with its tool call (by `tool_use_id`) so both render as one card.
 * With `ended`, a `tool_use` still without a result is marked `toolResultMissing`. Returns the
 * same message object when nothing changed, so memoized blocks don't re-render.
 */
declare function linkToolResults(message: ChatMessage, options?: {
    ended?: boolean;
}): ChatMessage;
/** Applies one stream event to a thread. Pure: the same inputs always give the same output. */
declare function reduceStreamEvent(state: ThreadState, event: StreamEvent, ctx: ReduceContext): ThreadState;
/**
 * The stream ended without `message_stop` (network drop, abort, timeout). Marks the message and
 * any open blocks as interrupted so the UI can offer Retry instead of spinning forever.
 */
declare function interruptRun(state: ThreadState, error: ChatErrorInfo | undefined, ctx: Pick<ReduceContext, 'now'>): ThreadState;

export { textFieldOf as A, type BlockStatus as B, type ChatBlock as C, type DeltaHandler as D, type ErrorAction as E, type RunStatus as F, type LoadStatus as L, type MessageStatus as M, type PendingCheckpoint as P, type ReduceContext as R, type ScopeGroup as S, TOOL_CALL_TYPES as T, type CheckpointState as a, type ChatMessage as b, type ComposerAttachment as c, type ChatErrorInfo as d, type Capabilities as e, type ChatConfigState as f, type CheckpointStatus as g, type ComposerAttachmentStatus as h, type ComposerState as i, type ConfigStatus as j, type ConversationGroup as k, type ConversationGroupKey as l, type ConversationItem as m, type ConversationsState as n, type RunState as o, type ScopeItem as p, type ScopeSelection as q, type ScopeState as r, type ThreadMeta as s, type ThreadState as t, createThreadState as u, defaultApplyDelta as v, emptyMeta as w, interruptRun as x, linkToolResults as y, reduceStreamEvent as z };
