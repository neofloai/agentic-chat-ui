import type { Attachment, ContentBlock, HitlDecision, Source, StopReason, SuggestedPrompt, Usage } from '../protocol/types';

/** A normalized error the UI can show and act on. */
export interface ChatErrorInfo {
  /** `network`, `timeout`, `http_503`, an SSE `error_type`, … */
  type: string;
  message: string;
  /** Seconds to wait before retrying, when the server said so. */
  retryAfter?: number | null;
  retryable: boolean;
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
  /** The model catalog from row 1. */
  models: string[];
  /** The model chosen through row 4, when known. */
  model?: string;
  sources: Source[];
  archived: boolean;
  createdAt?: string;
  updatedAt?: string;
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
