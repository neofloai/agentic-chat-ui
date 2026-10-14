/**
 * Wire types for the Neoflo chat standard (schema v1, revision 1.2): endpoints 0–7 and the
 * SSE stream. Every product backend implements these, and the library reads them.
 *
 * Field names stay snake_case here because these are the exact payloads on the wire.
 * The runtime models in `core/store/types.ts` are the camelCased view the UI reads.
 *
 * Identity, workspace and tenant never appear in a payload: they come from the session
 * (a Bearer header or a session cookie). Credentials for other systems stay on the server;
 * the browser only ever sees a connection's status.
 */

export const PROTOCOL_VERSION = 'v1' as const;

/** The standard revision this library implements, as `GET /v1/chat/config` reports it. */
export const STANDARD_REVISION = '1.2' as const;

/** ISO-8601 timestamp, e.g. `2026-09-21T09:12:00Z`. */
export type ISODateString = string;

/** A retrieval/tool capability available to a turn. `meta` holds the product's own settings. */
export interface Source {
  id: string;
  enabled: boolean;
  meta: Record<string, unknown>;
}

export type ConnectionState = 'connected' | 'expired' | 'missing';

/**
 * A connected system's status, read from `source.meta.connection`. Nothing else about the
 * credential ever reaches the browser.
 */
export interface ConnectionStatus {
  status: ConnectionState;
  expires_at?: ISODateString | null;
}

/** Product-only fields, keyed by `config.product.id`, e.g. `{ askneo: { … } }`. */
export type Ext = Record<string, unknown>;

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

/** Endpoint 2 item. */
export interface ConversationSummary {
  conversation_id: string;
  title: string;
  created_at: ISODateString;
  updated_at: ISODateString;
  archived: boolean;
  /** The model this conversation uses. */
  selected_model?: string | null;
  /** Older backends send the selected model as `model` on endpoints 2–4. */
  model?: string | string[] | null;
  message_count?: number;
  ext?: Ext;
}

/** Endpoint 1 response. */
export interface ConversationBootstrap extends ConversationSummary {
  subtitle?: string;
  sources: Source[];
  greeting?: string;
  suggested_prompts?: SuggestedPrompt[];
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

/** A message as it comes back from endpoint 3. */
export interface WireMessage {
  message_id: string;
  conversation_id: string;
  role: MessageRole;
  content: ContentBlock[] | Record<string, unknown> | string;
  stop_reason?: StopReason | null;
  created_at: ISODateString;
  model?: string | null;
  run_id?: string | null;
  usage?: Usage | null;
  /** On user messages: the id the client sent with the message. */
  client_message_id?: string | null;
  ext?: Ext;
  [key: string]: unknown;
}

/** Endpoint 3 response. */
export interface ConversationDetail extends ConversationSummary {
  subtitle?: string;
  sources?: Source[];
  messages: WireMessage[];
  /** Only with the `message_pagination` capability. */
  has_more_messages?: boolean;
}

/** Endpoint 4 body. At least one field is required. `archived` needs the `archive` capability. */
export interface ConversationPatch {
  title?: string | null;
  model?: string | null;
  sources?: Source[] | null;
  archived?: boolean | null;
}

/** Endpoint 4 response: the conversation object (endpoint 1 without the greeting). */
export interface UpdatedConversation extends ConversationSummary {
  subtitle?: string;
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

/** Endpoint 6 body: send a turn, or resume a paused HITL turn. */
export interface SendMessageBody {
  stream?: boolean;
  message: DefaultMessage | HitlMessage;
  /**
   * Created by the client. A repeat with the same id returns 409 `duplicate_message`, so a
   * retry after a network error or a double click never starts two replies.
   */
  client_message_id?: string;
  /** A per-message model (needs the `per_turn_model` capability). */
  model?: string;
  workflow_context?: WorkflowContext[];
  attachments?: Attachment[];
  /** For this message only; overrides the conversation's defaults by id. Settings only, never credentials. */
  sources?: Source[];
  ext?: Ext;
}

/**
 * Endpoint 7 response. With `cancel: "server"`, `true` means the run stopped. `false` means
 * the turn already finished, or the backend cancels by disconnect: either way the client
 * closes the stream itself.
 */
export interface CancelResult {
  status: boolean;
}

// ---------------------------------------------------------------------------------------------
// Endpoint 0: GET /v1/chat/config
// ---------------------------------------------------------------------------------------------

/**
 * What a backend supports. A flag missing from a config the backend returned means
 * "not supported".
 */
export interface ChatCapabilities {
  hitl?: boolean;
  attachments?: boolean;
  workflow_context?: boolean;
  archive?: boolean;
  /** `server` calls endpoint 7; `disconnect` closes the stream instead. */
  cancel?: 'server' | 'disconnect';
  per_turn_model?: boolean;
  per_turn_sources?: boolean;
  conversation_pagination?: boolean;
  message_pagination?: boolean;
  stream_resume?: boolean;
}

export interface ConfigModel {
  id: string;
  label: string;
  default?: boolean;
}

export interface ConfigSource {
  id: string;
  label: string;
  description?: string;
  default_enabled: boolean;
  /** Product settings. `meta.connection` is a hint only; conversation responses are authoritative. */
  meta: Record<string, unknown>;
}

export interface ConfigWorkflow {
  id: string;
  label: string;
  workspaces: { id: string; label: string }[];
}

export interface ChatLimits {
  max_message_chars?: number;
  max_attachments?: number;
  max_attachment_bytes?: number;
  /** MIME types or extensions, as for a file input's `accept`. */
  attachment_types?: string[];
}

/** Endpoint 0 response. */
export interface ChatConfig {
  protocol_version: string;
  /** `id` is the product's key in `ext` and the prefix of its own error codes and block types. */
  product: { id: string; name: string };
  capabilities: ChatCapabilities;
  models: ConfigModel[];
  sources: ConfigSource[];
  workflows: ConfigWorkflow[];
  limits: ChatLimits;
  ext?: Ext;
}

// ---------------------------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------------------------

/**
 * The shared error codes. HTTP errors and stream `error` events use the same list. A product
 * adds its own as `<product>.<code>`; a client that doesn't know a code falls back to the
 * behaviour for its HTTP status.
 */
export const ERROR_CODES = [
  'invalid_request',
  'unsupported_feature',
  'connection_required',
  'connection_expired',
  'unauthenticated',
  'access_denied',
  'not_found',
  'session_busy',
  'duplicate_message',
  'rate_limited',
  'upstream_unavailable',
  'internal',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number] | (string & {});

/** Every non-2xx response body. */
export interface ErrorEnvelope {
  error: {
    type: ErrorCode;
    message: string;
    /** Seconds. Also sent as `Retry-After` on 429. */
    retry_after?: number | null;
    /** Also sent as the `X-Request-Id` header. Quote it when reporting a bug. */
    request_id?: string | null;
    /** For example `{ "field": "sources.0.meta.chunk_size" }` or `{ "source": "invoice_processing" }`. */
    details?: Record<string, unknown> | null;
  };
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
  /** The id the server saved the user's message under. */
  user_message_id?: string | null;
  /** Echo of the request's `client_message_id`. */
  client_message_id?: string | null;
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
  /** A code from `ERROR_CODES`, or a product's own `<product>.<code>`. */
  error_type: ErrorCode;
  message: string;
  retry_after?: number | null;
  request_id?: string | null;
  details?: Record<string, unknown> | null;
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
