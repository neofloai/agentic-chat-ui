/**
 * Wire types for the Ask Neo ↔ Reef chat-layer schema v1.
 *
 * Field names stay snake_case here because these are the exact payloads on the wire.
 * The runtime models in `core/store/types.ts` are the camelCased view the UI reads.
 *
 * Identity, workspace and tenant never appear in a payload: they come from the
 * `Authorization: Bearer` token on every request.
 */
declare const PROTOCOL_VERSION: "v1";
/** ISO-8601 timestamp, e.g. `2026-09-21T09:12:00Z`. */
type ISODateString = string;
/** A retrieval/tool capability available to a turn. `meta` is an open bag. */
interface Source {
    id: string;
    enabled: boolean;
    meta: Record<string, unknown>;
}
/** A starter-prompt chip. `label` is the chip text; `prompt` is what gets sent. */
interface SuggestedPrompt {
    label: string;
    prompt: string;
}
/** A file already uploaded by the host app. The schema has no upload endpoint. */
interface Attachment {
    url: string;
    filename: string;
    content_type: string;
    size: number;
    meta: Record<string, unknown>;
}
/** Known workflow names; any other string is allowed so new workflows don't need a release. */
type WorkflowName = 'ip' | 'vq' | 'col' | (string & {});
interface WorkflowContext {
    workflow_name: WorkflowName;
    workspace_id: string[];
    context: Record<string, unknown>;
}
/** Row 2 item. */
interface ConversationSummary {
    conversation_id: string;
    title: string;
    created_at: ISODateString;
    updated_at: ISODateString;
    archived: boolean;
}
/** Row 1 response. */
interface ConversationBootstrap extends ConversationSummary {
    subtitle?: string;
    sources: Source[];
    greeting?: string;
    suggested_prompts?: SuggestedPrompt[];
    /** A catalog of available models, not the selected one. */
    model?: string[];
}
/**
 * One unit of an assistant turn. Every block carries `id`, `type` and `category`;
 * everything else depends on the type (see docs/block-contracts.md).
 */
interface ContentBlock {
    id: string;
    type: string;
    category: string;
    [key: string]: unknown;
}
type MessageRole = 'user' | 'assistant';
type StopReason = 'end_turn' | 'paused' | 'error' | 'cancelled';
/** A message as it comes back from row 3. */
interface WireMessage {
    message_id: string;
    conversation_id: string;
    role: MessageRole;
    content: ContentBlock[] | Record<string, unknown> | string;
    stop_reason?: StopReason | null;
    created_at: ISODateString;
    model?: string | null;
    [key: string]: unknown;
}
/** Row 3 response. */
interface ConversationDetail extends ConversationSummary {
    subtitle?: string;
    sources?: Source[];
    messages: WireMessage[];
    /** Not in schema v1 yet (gap #5); read when a backend sends it. */
    model?: string | string[] | null;
}
/**
 * Row 4 body. At least one field is required. `archived` isn't in the v1 PATCH body
 * (gap #4) but the glossary says archiving goes through row 4, so it's accepted here.
 */
interface ConversationPatch {
    title?: string | null;
    model?: string | null;
    sources?: Source[] | null;
    archived?: boolean | null;
}
/** Row 4 response: a row-2 item plus `sources`. */
interface UpdatedConversation extends ConversationSummary {
    sources?: Source[];
}
/**
 * What a HITL card sends back. The schema shows a string (`"approve"`) and a
 * string array (checkbox cards); an object is allowed for form-style cards.
 */
type HitlDecision = string | string[] | Record<string, unknown>;
interface DefaultMessage {
    role: 'user';
    type: 'default';
    content: {
        default: string;
    };
}
interface HitlMessage {
    role: 'user';
    type: 'hitl';
    content: {
        checkpoint_id: string;
        decision: HitlDecision;
    };
}
/** Row 6 body: send a turn, or resume a paused HITL turn. */
interface SendMessageBody {
    stream?: boolean;
    message: DefaultMessage | HitlMessage;
    workflow_context?: WorkflowContext[];
    attachments?: Attachment[];
    sources?: Source[];
}
/** Row 7 response. `status: false` means the turn already finished (a harmless no-op). */
interface CancelResult {
    status: boolean;
}
interface Usage {
    input_tokens?: number;
    output_tokens?: number;
    cache_read_input_tokens?: number;
    [key: string]: number | undefined;
}
interface MessageStartEvent {
    type: 'message_start';
    message_id: string;
    conversation_id: string;
    run_id: string;
    /** Reserved, unused today. */
    persona?: unknown;
}
interface StatusEvent {
    type: 'status';
    label: string;
}
interface ContentBlockStartEvent {
    type: 'content_block_start';
    index: number;
    block: ContentBlock;
}
interface ContentBlockDelta {
    type: string;
    text?: string;
    [key: string]: unknown;
}
interface ContentBlockDeltaEvent {
    type: 'content_block_delta';
    index: number;
    delta: ContentBlockDelta;
    /** A full overwrite, not incremental. */
    snapshot?: unknown;
}
interface ContentBlockStopEvent {
    type: 'content_block_stop';
    index: number;
    /** The complete, final block. */
    block: ContentBlock;
}
interface CheckpointEvent {
    type: 'checkpoint';
    checkpoint_id: string;
    block_index: number;
    requires?: unknown;
}
interface MessageDeltaEvent {
    type: 'message_delta';
    usage?: Usage;
}
interface MessageStopEvent {
    type: 'message_stop';
    message_id: string;
    model?: string | null;
    title?: string | null;
    stop_reason: StopReason;
}
interface ErrorEvent {
    type: 'error';
    error_type: string;
    message: string;
    retry_after?: number | null;
}
type StreamEvent = MessageStartEvent | StatusEvent | ContentBlockStartEvent | ContentBlockDeltaEvent | ContentBlockStopEvent | CheckpointEvent | MessageDeltaEvent | MessageStopEvent | ErrorEvent;
type StreamEventType = StreamEvent['type'];

export { type Attachment as A, type ConversationBootstrap as C, type DefaultMessage as D, type ErrorEvent as E, type HitlDecision as H, type ISODateString as I, type MessageDeltaEvent as M, PROTOCOL_VERSION as P, type SendMessageBody as S, type UpdatedConversation as U, type WireMessage as W, type ConversationSummary as a, type ConversationDetail as b, type ConversationPatch as c, type StreamEvent as d, type CancelResult as e, type ContentBlock as f, type StopReason as g, type Usage as h, type SuggestedPrompt as i, type Source as j, type ContentBlockDelta as k, type CheckpointEvent as l, type ContentBlockDeltaEvent as m, type ContentBlockStartEvent as n, type ContentBlockStopEvent as o, type HitlMessage as p, type MessageRole as q, type MessageStartEvent as r, type MessageStopEvent as s, type StatusEvent as t, type StreamEventType as u, type WorkflowContext as v, type WorkflowName as w };
