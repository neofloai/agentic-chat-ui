/**
 * Wire types for the Ask Neo ↔ Reef chat-layer schema v1.
 *
 * Field names stay snake_case here because these are the exact payloads on the wire.
 * The runtime models in `core/store/types.ts` are the camelCased view the UI reads.
 *
 * Identity, workspace and tenant never appear in a payload: they come from the
 * `Authorization: Bearer` token on every request.
 */

export const PROTOCOL_VERSION = 'v1' as const;

/** ISO-8601 timestamp, e.g. `2026-09-21T09:12:00Z`. */
export type ISODateString = string;

/** A retrieval/tool capability available to a turn. `meta` is an open bag. */
export interface Source {
  id: string;
  enabled: boolean;
  meta: Record<string, unknown>;
}

/** A starter-prompt chip. `label` is the chip text; `prompt` is what gets sent. */
export interface SuggestedPrompt {
  label: string;
  prompt: string;
}

/** A file already uploaded by the host app. The schema has no upload endpoint. */
export interface Attachment {
  url: string;
  filename: string;
  content_type: string;
  size: number;
  meta: Record<string, unknown>;
}

/** Known workflow names; any other string is allowed so new workflows don't need a release. */
export type WorkflowName = 'ip' | 'vq' | 'col' | (string & {});

export interface WorkflowContext {
  workflow_name: WorkflowName;
  workspace_id: string[];
  context: Record<string, unknown>;
}

/** Row 2 item. */
export interface ConversationSummary {
  conversation_id: string;
  title: string;
  created_at: ISODateString;
  updated_at: ISODateString;
  archived: boolean;
}

/** Row 1 response. */
export interface ConversationBootstrap extends ConversationSummary {
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
export interface ContentBlock {
  id: string;
  type: string;
  category: string;
  [key: string]: unknown;
}

export type MessageRole = 'user' | 'assistant';

export type StopReason = 'end_turn' | 'paused' | 'error' | 'cancelled';

/** A message as it comes back from row 3. */
export interface WireMessage {
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
export interface ConversationDetail extends ConversationSummary {
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
export interface ConversationPatch {
  title?: string | null;
  model?: string | null;
  sources?: Source[] | null;
  archived?: boolean | null;
}

/** Row 4 response: a row-2 item plus `sources`. */
export interface UpdatedConversation extends ConversationSummary {
  sources?: Source[];
}

/**
 * What a HITL card sends back. The schema shows a string (`"approve"`) and a
 * string array (checkbox cards); an object is allowed for form-style cards.
 */
export type HitlDecision = string | string[] | Record<string, unknown>;

export interface DefaultMessage {
  role: 'user';
  type: 'default';
  content: { default: string };
}

export interface HitlMessage {
  role: 'user';
  type: 'hitl';
  content: { checkpoint_id: string; decision: HitlDecision };
}

/** Row 6 body: send a turn, or resume a paused HITL turn. */
export interface SendMessageBody {
  stream?: boolean;
  message: DefaultMessage | HitlMessage;
  workflow_context?: WorkflowContext[];
  attachments?: Attachment[];
  sources?: Source[];
}

/** Row 7 response. `status: false` means the turn already finished (a harmless no-op). */
export interface CancelResult {
  status: boolean;
}

export interface Usage {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  [key: string]: number | undefined;
}

// ---------------------------------------------------------------------------------------------
// SSE events (row 6, stream: true)
// ---------------------------------------------------------------------------------------------

export interface MessageStartEvent {
  type: 'message_start';
  message_id: string;
  conversation_id: string;
  run_id: string;
  /** Reserved, unused today. */
  persona?: unknown;
}

export interface StatusEvent {
  type: 'status';
  label: string;
}

export interface ContentBlockStartEvent {
  type: 'content_block_start';
  index: number;
  block: ContentBlock;
}

export interface ContentBlockDelta {
  type: string;
  text?: string;
  [key: string]: unknown;
}

export interface ContentBlockDeltaEvent {
  type: 'content_block_delta';
  index: number;
  delta: ContentBlockDelta;
  /** A full overwrite, not incremental. */
  snapshot?: unknown;
}

export interface ContentBlockStopEvent {
  type: 'content_block_stop';
  index: number;
  /** The complete, final block. */
  block: ContentBlock;
}

export interface CheckpointEvent {
  type: 'checkpoint';
  checkpoint_id: string;
  block_index: number;
  requires?: unknown;
}

export interface MessageDeltaEvent {
  type: 'message_delta';
  usage?: Usage;
}

export interface MessageStopEvent {
  type: 'message_stop';
  message_id: string;
  model?: string | null;
  title?: string | null;
  stop_reason: StopReason;
}

export interface ErrorEvent {
  type: 'error';
  error_type: string;
  message: string;
  retry_after?: number | null;
}

export type StreamEvent =
  | MessageStartEvent
  | StatusEvent
  | ContentBlockStartEvent
  | ContentBlockDeltaEvent
  | ContentBlockStopEvent
  | CheckpointEvent
  | MessageDeltaEvent
  | MessageStopEvent
  | ErrorEvent;

export type StreamEventType = StreamEvent['type'];
