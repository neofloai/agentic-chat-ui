import type { ContentBlock, ContentBlockDelta, StopReason, StreamEvent } from '../protocol/types';
import type { ChatBlock, ChatErrorInfo, ChatMessage, MessageStatus, RunStatus, ThreadState } from './types';

/**
 * Lets a block type take over how deltas are applied (e.g. a plan block whose snapshot is a
 * step list). Return `undefined` to fall back to the default.
 */
export type DeltaHandler = (block: ContentBlock, delta: ContentBlockDelta, snapshot: unknown) => ContentBlock | undefined;

export interface ReduceContext {
  /** Epoch ms. */
  now: number;
  resolveDeltaHandler?: (block: ContentBlock) => DeltaHandler | undefined;
}

/** The field a text-like block streams into. Thinking blocks may use `thinking` instead of `text`. */
export function textFieldOf(block: ContentBlock): 'text' | 'thinking' {
  return block.type === 'thinking' && typeof block.thinking === 'string' && typeof block.text !== 'string' ? 'thinking' : 'text';
}

/**
 * Default delta handling. A `snapshot` is a full overwrite, so it wins whenever it's present:
 * that makes delta application idempotent and a dropped delta can't corrupt the block.
 */
export function defaultApplyDelta(block: ContentBlock, delta: ContentBlockDelta, snapshot: unknown): ContentBlock {
  if (typeof snapshot === 'string') {
    return { ...block, [textFieldOf(block)]: snapshot };
  }
  if (snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot)) {
    return { ...block, ...(snapshot as Record<string, unknown>), id: block.id, type: block.type, category: block.category };
  }
  if (typeof delta.text === 'string') {
    const field = textFieldOf(block);
    const prev = typeof block[field] === 'string' ? (block[field] as string) : '';
    return { ...block, [field]: prev + delta.text };
  }
  if (typeof delta.partial_json === 'string') {
    const prev = typeof block.partial_json === 'string' ? block.partial_json : '';
    return { ...block, partial_json: prev + delta.partial_json };
  }
  return block;
}

const STATUS_BY_STOP: Record<StopReason, MessageStatus> = {
  end_turn: 'complete',
  paused: 'paused',
  error: 'error',
  cancelled: 'cancelled',
};

const RUN_BY_STOP: Record<StopReason, RunStatus> = {
  end_turn: 'idle',
  paused: 'paused',
  error: 'error',
  cancelled: 'idle',
};

function updateMessage(state: ThreadState, messageId: string | undefined, fn: (m: ChatMessage) => ChatMessage): ThreadState {
  if (!messageId) return state;
  let changed = false;
  const messages = state.messages.map((m) => {
    if (m.id !== messageId) return m;
    changed = true;
    return fn(m);
  });
  return changed ? { ...state, messages } : state;
}

function updateBlock(message: ChatMessage, blockId: string, fn: (b: ChatBlock) => ChatBlock): ChatMessage {
  let changed = false;
  const blocks = message.blocks.map((b) => {
    if (b.id !== blockId) return b;
    changed = true;
    return fn(b);
  });
  return changed ? { ...message, blocks } : message;
}

/** Makes sure there's an assistant message to write into, even if `message_start` never came. */
function ensureAssistantMessage(state: ThreadState, ctx: ReduceContext): ThreadState {
  if (state.run.messageId && state.messages.some((m) => m.id === state.run.messageId)) return state;
  const id = state.run.messageId ?? `msg_local_${ctx.now.toString(36)}`;
  const message: ChatMessage = {
    id,
    role: 'assistant',
    blocks: [],
    status: 'streaming',
    createdAt: new Date(ctx.now).toISOString(),
  };
  return { ...state, messages: [...state.messages, message], run: { ...state.run, messageId: id, status: 'streaming' } };
}

/** Applies one stream event to a thread. Pure: the same inputs always give the same output. */
export function reduceStreamEvent(state: ThreadState, event: StreamEvent, ctx: ReduceContext): ThreadState {
  switch (event.type) {
    case 'message_start': {
      const exists = state.messages.some((m) => m.id === event.message_id);
      const messages = exists
        ? state.messages.map((m) => (m.id === event.message_id ? { ...m, status: 'streaming' as const, error: undefined } : m))
        : [
            ...state.messages,
            {
              id: event.message_id,
              role: 'assistant' as const,
              blocks: [],
              status: 'streaming' as const,
              createdAt: new Date(ctx.now).toISOString(),
            },
          ];
      return {
        ...state,
        messages,
        run: { status: 'streaming', runId: event.run_id || undefined, messageId: event.message_id },
        streamBlockIds: {},
      };
    }

    case 'status':
      return { ...state, run: { ...state.run, statusLabel: event.label || undefined } };

    case 'content_block_start': {
      const s = ensureAssistantMessage(state, ctx);
      const messageId = s.run.messageId;
      const incoming: ChatBlock = {
        id: event.block.id,
        type: event.block.type,
        category: event.block.category,
        status: 'streaming',
        data: event.block,
        startedAt: ctx.now,
      };
      const next = updateMessage(s, messageId, (m) => {
        const existing = m.blocks.find((b) => b.id === incoming.id);
        if (existing) {
          return updateBlock(m, incoming.id, (b) => ({ ...incoming, checkpoint: b.checkpoint, startedAt: b.startedAt }));
        }
        return { ...m, blocks: [...m.blocks, incoming] };
      });
      return { ...next, streamBlockIds: { ...next.streamBlockIds, [event.index]: incoming.id } };
    }

    case 'content_block_delta': {
      const blockId = state.streamBlockIds[event.index];
      if (!blockId) return state;
      return updateMessage(state, state.run.messageId, (m) =>
        updateBlock(m, blockId, (b) => {
          const handler = ctx.resolveDeltaHandler?.(b.data);
          const data = handler?.(b.data, event.delta, event.snapshot) ?? defaultApplyDelta(b.data, event.delta, event.snapshot);
          return data === b.data ? b : { ...b, data };
        }),
      );
    }

    case 'content_block_stop': {
      const s = ensureAssistantMessage(state, ctx);
      const blockId = s.streamBlockIds[event.index] ?? event.block.id;
      const next = updateMessage(s, s.run.messageId, (m) => {
        const final: Omit<ChatBlock, 'checkpoint' | 'startedAt'> = {
          id: blockId,
          type: event.block.type,
          category: event.block.category,
          status: 'complete',
          data: { ...event.block, id: blockId },
          completedAt: ctx.now,
        };
        if (!m.blocks.some((b) => b.id === blockId)) {
          return { ...m, blocks: [...m.blocks, { ...final, startedAt: ctx.now }] };
        }
        return updateBlock(m, blockId, (b) => ({ ...final, checkpoint: b.checkpoint, startedAt: b.startedAt }));
      });
      return next.streamBlockIds[event.index]
        ? next
        : { ...next, streamBlockIds: { ...next.streamBlockIds, [event.index]: blockId } };
    }

    case 'checkpoint': {
      const messageId = state.run.messageId;
      const message = state.messages.find((m) => m.id === messageId);
      if (!message) return state;
      const blockId = state.streamBlockIds[event.block_index] ?? message.blocks[message.blocks.length - 1]?.id;
      if (!blockId) return state;
      const next = updateMessage(state, messageId, (m) =>
        updateBlock(m, blockId, (b) => ({
          ...b,
          checkpoint: { id: event.checkpoint_id, requires: event.requires, status: 'pending' },
        })),
      );
      return {
        ...next,
        pendingCheckpoint: {
          checkpointId: event.checkpoint_id,
          messageId: message.id,
          blockId,
          requires: event.requires,
        },
      };
    }

    case 'message_delta':
      if (!event.usage) return state;
      return updateMessage(state, state.run.messageId, (m) => ({ ...m, usage: { ...m.usage, ...event.usage } }));

    case 'message_stop': {
      const messageId = event.message_id || state.run.messageId;
      const status = STATUS_BY_STOP[event.stop_reason];
      let next = updateMessage(state, messageId, (m) => ({
        ...m,
        status,
        stopReason: event.stop_reason,
        model: event.model ?? m.model,
        error: event.stop_reason === 'error' ? (m.error ?? state.run.error) : m.error,
        blocks: m.blocks.map((b) => (b.status === 'streaming' ? { ...b, status: 'complete', completedAt: ctx.now } : b)),
      }));
      if (event.title) next = { ...next, meta: { ...next.meta, title: event.title } };
      const runStatus = RUN_BY_STOP[event.stop_reason];
      return {
        ...next,
        run: {
          status: runStatus,
          messageId,
          error: runStatus === 'error' ? state.run.error : undefined,
        },
        pendingCheckpoint: event.stop_reason === 'paused' ? next.pendingCheckpoint : undefined,
        streamBlockIds: {},
      };
    }

    case 'error': {
      const error: ChatErrorInfo = {
        type: event.error_type,
        message: event.message,
        retryAfter: event.retry_after ?? null,
        retryable: true,
      };
      const next = updateMessage(state, state.run.messageId, (m) => ({ ...m, error }));
      return { ...next, run: { ...next.run, status: 'error', statusLabel: undefined, error } };
    }

    default:
      return state;
  }
}

/**
 * The stream ended without `message_stop` (network drop, abort, timeout). Marks the message and
 * any open blocks as interrupted so the UI can offer Retry instead of spinning forever.
 */
export function interruptRun(state: ThreadState, error: ChatErrorInfo | undefined, ctx: Pick<ReduceContext, 'now'>): ThreadState {
  const messageId = state.run.messageId;
  const next = updateMessage(state, messageId, (m) =>
    m.status === 'streaming'
      ? {
          ...m,
          status: error ? 'interrupted' : 'cancelled',
          error: error ?? m.error,
          blocks: m.blocks.map((b) => (b.status === 'streaming' ? { ...b, status: 'interrupted', completedAt: ctx.now } : b)),
        }
      : m,
  );
  return {
    ...next,
    run: error ? { status: 'error', messageId, error } : { status: 'idle', messageId },
    streamBlockIds: {},
  };
}
