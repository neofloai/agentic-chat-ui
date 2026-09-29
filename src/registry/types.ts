import type { ComponentType } from 'react';
import type { ContentBlock, HitlDecision } from '../core/protocol/types';
import type { DeltaHandler } from '../core/store/stream-reducer';
import type { BlockStatus, ChatBlock, ChatMessage, CheckpointState } from '../core/store/types';

/** What a block can do from inside the chat. */
export interface BlockActions {
  /** Sends a new user message (e.g. a follow-up chip inside a card). */
  send(text: string): void;
  /** Answers this block's HITL checkpoint. A no-op if the block has none. */
  resume(decision: HitlDecision): Promise<void>;
  /** Hands an action to the host app's `onAction` (open a record, navigate, download…). */
  emit(name: string, payload?: unknown): void;
  /** Retries the last failed turn in this conversation. */
  retry(): void;
}

export interface BlockRenderProps<TData = ContentBlock> {
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

export interface BlockDefinition<TData = any> {
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

export interface BlockRegistry {
  readonly definitions: readonly BlockDefinition[];
  resolve(block: ContentBlock): BlockDefinition | undefined;
  /** For the runtime: delta handlers declared by definitions. */
  deltaResolver(block: ContentBlock): DeltaHandler | undefined;
  readonly fallback?: BlockDefinition;
}

export interface ChatAction {
  name: string;
  payload?: unknown;
  block?: ChatBlock;
  message?: ChatMessage;
  conversationId: string | null;
}
