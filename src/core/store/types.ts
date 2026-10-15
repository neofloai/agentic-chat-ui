import type {
  Attachment,
  ChatConfig,
  ContentBlock,
  Ext,
  HitlDecision,
  Source,
  StopReason,
  SuggestedPrompt,
  Usage,
} from '../protocol/types';

/**
 * What the UI offers for an error: Try again, sign in again, reconnect a source, or nothing.
 * Decided from the error code first and the HTTP status second.
 */
export type ErrorAction = 'retry' | 'sign_in' | 'reconnect' | 'none';

/** A normalized error the UI can show and act on. */
export interface ChatErrorInfo {
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

export type CheckpointStatus = 'pending' | 'submitting' | 'resolved' | 'failed';

/** A HITL pause point attached to the block that asked the question. */
export interface CheckpointState {
  id: string;
  /** What the decision must look like, as sent by the backend. */
  requires?: unknown;
  status: CheckpointStatus;
  decision?: HitlDecision;
  error?: ChatErrorInfo;
}

export type BlockStatus = 'streaming' | 'complete' | 'interrupted';

/** One content block inside a message, as the UI reads it. */
export interface ChatBlock {
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

export type MessageStatus = 'streaming' | 'complete' | 'paused' | 'error' | 'cancelled' | 'interrupted';

export interface ChatMessage {
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

export type RunStatus = 'idle' | 'submitting' | 'streaming' | 'paused' | 'cancelling' | 'error';

export interface RunState {
  status: RunStatus;
  runId?: string;
  /** The assistant `message_id` from `message_start`, needed for cancel. */
  messageId?: string;
  /** The transient `status` event label ("Searching invoices…"). */
  statusLabel?: string;
  error?: ChatErrorInfo;
}

export interface PendingCheckpoint {
  checkpointId: string;
  messageId: string;
  blockId: string;
  requires?: unknown;
}

export interface ThreadMeta {
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

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface ThreadState {
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

export type ComposerAttachmentStatus = 'uploading' | 'ready' | 'error';

export interface ComposerAttachment {
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

export interface ComposerState {
  text: string;
  attachments: ComposerAttachment[];
}

export interface ConversationItem {
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

export interface ConversationsState {
  items: ConversationItem[];
  status: LoadStatus;
  error?: ChatErrorInfo;
  /** Conversation ids with a turn streaming right now (possibly in the background). */
  runningIds: string[];
}

export type ConversationGroupKey = 'today' | 'yesterday' | 'previous7' | 'previous30' | 'older';

export interface ConversationGroup {
  key: ConversationGroupKey;
  items: ConversationItem[];
}

// --- Backend config (endpoint 0) ---------------------------------------------------------------

/**
 * `ready`: the backend returned its config. `unavailable`: it has no config endpoint (404), so
 * the host's `capabilities` option and the defaults apply. `error`: the call failed; the
 * defaults apply until the next start.
 */
export type ConfigStatus = 'idle' | 'loading' | 'ready' | 'unavailable' | 'error';

/** What the UI can use, after combining the backend's config with the host's switches. */
export interface Capabilities {
  hitl: boolean;
  attachments: boolean;
  workflowContext: boolean;
  archive: boolean;
  cancel: 'server' | 'disconnect';
  perTurnModel: boolean;
  perTurnSources: boolean;
}

export interface ChatConfigState {
  status: ConfigStatus;
  /** The backend's config, normalized. Present when `status` is `ready`. */
  config?: ChatConfig;
  capabilities: Capabilities;
  error?: ChatErrorInfo;
}

// --- Scope picker (composer "All workflows") --------------------------------------------------

export interface ScopeItem {
  id: string;
  label: string;
  description?: string;
}

export interface ScopeGroup {
  id: string;
  label: string;
  items: ScopeItem[];
}

/** Selected item ids, per group id. */
export type ScopeSelection = Record<string, string[]>;

export interface ScopeState {
  groups: ScopeGroup[];
  selection: ScopeSelection;
  status: LoadStatus;
  /** Where the catalog came from: the host's `scope` option, or the backend config's `workflows`. */
  origin?: 'host' | 'config';
}

export const emptyMeta = (): ThreadMeta => ({
  title: 'New chat',
  suggestedPrompts: [],
  models: [],
  sources: [],
  archived: false,
});

export const createThreadState = (conversationId: string | null): ThreadState => ({
  conversationId,
  loadStatus: conversationId ? 'idle' : 'ready',
  meta: emptyMeta(),
  messages: [],
  run: { status: 'idle' },
  streamBlockIds: {},
});
