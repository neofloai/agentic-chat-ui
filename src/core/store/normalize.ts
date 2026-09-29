import type {
  ContentBlock,
  ConversationBootstrap,
  ConversationDetail,
  ConversationSummary,
  HitlDecision,
  StopReason,
  WireMessage,
} from '../protocol/types';
import type {
  ChatBlock,
  ChatMessage,
  CheckpointState,
  ConversationItem,
  MessageStatus,
  PendingCheckpoint,
  ThreadMeta,
} from './types';
import { emptyMeta } from './types';

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);

const STATUS_BY_STOP: Record<StopReason, MessageStatus> = {
  end_turn: 'complete',
  paused: 'paused',
  error: 'error',
  cancelled: 'cancelled',
};

export function toConversationItem(s: ConversationSummary): ConversationItem {
  return {
    id: s.conversation_id,
    title: s.title || 'New chat',
    createdAt: s.created_at,
    updatedAt: s.updated_at || s.created_at,
    archived: Boolean(s.archived),
  };
}

export function metaFromBootstrap(b: ConversationBootstrap): ThreadMeta {
  return {
    ...emptyMeta(),
    title: b.title || 'New chat',
    subtitle: b.subtitle,
    greeting: b.greeting,
    suggestedPrompts: Array.isArray(b.suggested_prompts) ? b.suggested_prompts : [],
    models: Array.isArray(b.model) ? b.model : [],
    sources: Array.isArray(b.sources) ? b.sources : [],
    archived: Boolean(b.archived),
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  };
}

/**
 * Reads a checkpoint off a history block. Schema v1 doesn't say how history carries HITL
 * state (gap #2), so this accepts the shape proposed in docs/block-contracts.md
 * (`checkpoint: { checkpoint_id, requires, status, decision }`) and a bare `checkpoint_id`.
 */
function checkpointFromBlock(block: ContentBlock): CheckpointState | undefined {
  const cp = isObject(block.checkpoint) ? block.checkpoint : undefined;
  const id =
    typeof cp?.checkpoint_id === 'string'
      ? cp.checkpoint_id
      : typeof block.checkpoint_id === 'string'
        ? block.checkpoint_id
        : undefined;
  if (!id) return undefined;
  const decision = (cp?.decision ?? block.decision) as HitlDecision | undefined;
  const resolved = cp?.status === 'resolved' || cp?.resolved === true || decision !== undefined;
  return {
    id,
    requires: cp?.requires ?? block.requires,
    status: resolved ? 'resolved' : 'pending',
    decision,
  };
}

function toBlock(raw: ContentBlock, fallbackId: string): ChatBlock {
  const data: ContentBlock = {
    ...raw,
    id: typeof raw.id === 'string' && raw.id ? raw.id : fallbackId,
    type: typeof raw.type === 'string' ? raw.type : 'text',
    category: typeof raw.category === 'string' ? raw.category : 'content',
  };
  return {
    id: data.id,
    type: data.type,
    category: data.category,
    status: 'complete',
    data,
    checkpoint: checkpointFromBlock(data),
  };
}

/** Wire content can be a block array, a `{ default: text }` send body, or a plain string. */
function contentToBlocks(message: WireMessage): ContentBlock[] {
  const { content } = message;
  if (Array.isArray(content)) return content.filter(isObject) as ContentBlock[];
  if (typeof content === 'string') return [{ id: `${message.message_id}:0`, type: 'text', category: 'content', text: content }];
  if (isObject(content)) {
    if (typeof content.default === 'string') {
      return [{ id: `${message.message_id}:0`, type: 'text', category: 'content', text: content.default }];
    }
    return [{ id: `${message.message_id}:0`, type: 'hitl_decision', category: 'hitl', ...content }];
  }
  return [];
}

/** A user message that only records a HITL decision; it isn't rendered as a bubble. */
function decisionOf(message: WireMessage, blocks: ContentBlock[]): { checkpointId: string; decision: HitlDecision } | null {
  if (message.role !== 'user') return null;
  if (message.type === 'hitl' || blocks.some((b) => typeof b.checkpoint_id === 'string')) {
    const b = blocks.find((x) => typeof x.checkpoint_id === 'string');
    if (b) return { checkpointId: b.checkpoint_id as string, decision: b.decision as HitlDecision };
  }
  return null;
}

export function normalizeMessages(wire: WireMessage[]): { messages: ChatMessage[]; pendingCheckpoint?: PendingCheckpoint } {
  const decisions = new Map<string, HitlDecision>();
  const messages: ChatMessage[] = [];

  for (const w of wire) {
    if (!isObject(w) || typeof w.message_id !== 'string') continue;
    const raw = contentToBlocks(w);
    const decision = decisionOf(w, raw);
    if (decision) {
      decisions.set(decision.checkpointId, decision.decision);
      continue;
    }
    const role = w.role === 'user' ? 'user' : 'assistant';
    const stop = typeof w.stop_reason === 'string' ? (w.stop_reason as StopReason) : undefined;
    messages.push({
      id: w.message_id,
      role,
      blocks: raw.map((b, i) => toBlock(b, `${w.message_id}:${i}`)),
      status: stop ? (STATUS_BY_STOP[stop] ?? 'complete') : 'complete',
      stopReason: stop,
      createdAt: typeof w.created_at === 'string' ? w.created_at : new Date(0).toISOString(),
      model: typeof w.model === 'string' ? w.model : undefined,
      attachments: Array.isArray(w.attachments) ? (w.attachments as ChatMessage['attachments']) : undefined,
    });
  }

  // Apply recorded decisions to their checkpoints.
  if (decisions.size) {
    for (const m of messages) {
      m.blocks = m.blocks.map((b) =>
        b.checkpoint && decisions.has(b.checkpoint.id)
          ? { ...b, checkpoint: { ...b.checkpoint, status: 'resolved', decision: decisions.get(b.checkpoint.id) } }
          : b,
      );
    }
  }

  // A paused last assistant turn with an unresolved checkpoint is still waiting on the user.
  let pendingCheckpoint: PendingCheckpoint | undefined;
  const last = messages[messages.length - 1];
  if (last && last.role === 'assistant' && last.status === 'paused') {
    const block = [...last.blocks].reverse().find((b) => b.checkpoint?.status === 'pending');
    if (block?.checkpoint) {
      pendingCheckpoint = {
        checkpointId: block.checkpoint.id,
        messageId: last.id,
        blockId: block.id,
        requires: block.checkpoint.requires,
      };
    }
  }
  return { messages, pendingCheckpoint };
}

export function normalizeConversationDetail(
  detail: ConversationDetail,
  previous?: ThreadMeta,
): { meta: ThreadMeta; messages: ChatMessage[]; pendingCheckpoint?: PendingCheckpoint } {
  const { messages, pendingCheckpoint } = normalizeMessages(Array.isArray(detail.messages) ? detail.messages : []);
  const base = previous ?? emptyMeta();
  const model = typeof detail.model === 'string' ? detail.model : base.model;
  return {
    meta: {
      ...base,
      title: detail.title || base.title,
      subtitle: detail.subtitle ?? base.subtitle,
      sources: Array.isArray(detail.sources) ? detail.sources : base.sources,
      archived: Boolean(detail.archived),
      createdAt: detail.created_at,
      updatedAt: detail.updated_at,
      model,
      models: Array.isArray(detail.model) ? detail.model : base.models,
    },
    messages,
    pendingCheckpoint,
  };
}
