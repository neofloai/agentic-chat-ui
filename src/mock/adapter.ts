import type {
  CancelResult,
  ContentBlock,
  ConversationBootstrap,
  ConversationDetail,
  ConversationSummary,
  HitlDecision,
  SendMessageBody,
  StreamEvent,
  SuggestedPrompt,
  WireMessage,
} from '../core/protocol/types';
import type { ChatAdapter } from '../core/transport/adapter';
import { ChatApiError } from '../core/transport/errors';
import { DEFAULT_SCENARIOS, DEFAULT_SUGGESTIONS, type MockScenario } from './scenarios';
import { createWriter, MockStop, type PauseOptions } from './writer';

export interface MockAdapterOptions {
  /** Checked in order; the first whose `match` accepts the prompt runs. */
  scenarios?: MockScenario[];
  /** Also try the built-in demo scenarios after yours. @default true */
  includeDefaultScenarios?: boolean;
  /** Delay for REST calls, ms. @default 250 */
  latency?: number;
  /** Delay between streamed words, ms. @default 28 */
  speed?: number;
  greeting?: string;
  suggestedPrompts?: SuggestedPrompt[];
  models?: string[];
  /** Conversations that already exist. */
  seed?: ConversationDetail[];
  /** Keep the mock database in localStorage under this key, so a demo survives reloads. */
  persistKey?: string;
}

interface StoredConversation {
  summary: ConversationSummary;
  messages: WireMessage[];
}

interface PendingResume {
  conversationId: string;
  messageId: string;
  blockId: string;
  onResume: PauseOptions['onResume'];
}

const now = () => new Date().toISOString();
let counter = 0;
const newId = (prefix: string) => `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}`;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function titleFrom(prompt: string): string {
  const words = prompt
    .replace(/[?!.]+$/, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);
  const t = words.join(' ');
  return t ? t[0]!.toUpperCase() + t.slice(1) : 'New chat';
}

class Channel<T> implements AsyncIterable<T> {
  private queue: T[] = [];
  private wake: (() => void) | null = null;
  private closed = false;
  push(v: T) {
    this.queue.push(v);
    this.wake?.();
  }
  close() {
    this.closed = true;
    this.wake?.();
  }
  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    for (;;) {
      if (this.queue.length) {
        yield this.queue.shift()!;
        continue;
      }
      if (this.closed) return;
      await new Promise<void>((r) => (this.wake = r));
      this.wake = null;
    }
  }
}

/**
 * An in-memory schema-v1 backend with scripted demo turns for every built-in block. Use it to
 * build UI without a server, in tests, and in the public demo.
 */
export function createMockAdapter(options: MockAdapterOptions = {}): ChatAdapter & { reset(): void } {
  const latency = options.latency ?? 250;
  const speed = options.speed ?? 28;
  const scenarios = [...(options.scenarios ?? []), ...(options.includeDefaultScenarios === false ? [] : DEFAULT_SCENARIOS)];
  const db = new Map<string, StoredConversation>();
  const pending = new Map<string, PendingResume>();
  const cancelled = new Set<string>();

  const load = () => {
    if (!options.persistKey || typeof localStorage === 'undefined') return false;
    try {
      const raw = localStorage.getItem(options.persistKey);
      if (!raw) return false;
      for (const c of JSON.parse(raw) as StoredConversation[]) db.set(c.summary.conversation_id, c);
      return true;
    } catch {
      return false;
    }
  };
  const save = () => {
    if (!options.persistKey || typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(options.persistKey, JSON.stringify([...db.values()]));
    } catch {
      // quota; the demo just forgets
    }
  };
  const seed = () => {
    for (const d of options.seed ?? []) {
      db.set(d.conversation_id, {
        summary: {
          conversation_id: d.conversation_id,
          title: d.title,
          created_at: d.created_at,
          updated_at: d.updated_at,
          archived: d.archived,
        },
        messages: d.messages,
      });
    }
  };
  if (!load()) seed();

  const get = (id: string) => {
    const c = db.get(id);
    if (!c) throw new ChatApiError(404, 'Conversation not found', { detail: 'not found' });
    return c;
  };

  const bootstrap = (summary: ConversationSummary): ConversationBootstrap => ({
    ...summary,
    subtitle: 'Ask Neo',
    sources: [
      { id: 'search_v2', enabled: true, meta: { search_v2_chunk_size: 10 } },
      { id: 'web_search', enabled: false, meta: {} },
    ],
    greeting: options.greeting ?? 'Hey! What can I help you dig into today?',
    suggested_prompts: options.suggestedPrompts ?? DEFAULT_SUGGESTIONS,
    model: options.models ?? ['claude-sonnet-5', 'claude-opus-5'],
  });

  function run(
    conversationId: string,
    messageId: string,
    signal: AbortSignal,
    firstTurn: boolean,
    prompt: string,
    body: (writer: ReturnType<typeof createWriter>) => Promise<void>,
  ): AsyncIterable<StreamEvent> {
    const ch = new Channel<StreamEvent>();
    const conv = get(conversationId);
    let index = -1;
    let assistant = conv.messages.find((m) => m.message_id === messageId);
    if (!assistant) {
      assistant = {
        message_id: messageId,
        conversation_id: conversationId,
        role: 'assistant',
        content: [],
        created_at: now(),
        stop_reason: null,
      };
      conv.messages.push(assistant);
    }
    const content = assistant.content as ContentBlock[];

    const writer = createWriter({
      push: (e) => ch.push(e),
      isCancelled: () => cancelled.has(messageId),
      signal,
      speed,
      nextIndex: () => ++index,
      lastIndex: () => index,
      newId,
      onBlockStop: (block) => {
        const i = content.findIndex((b) => b.id === block.id);
        if (i >= 0) content[i] = block;
        else content.push(block);
      },
      onPause: (checkpointId, blockId, requires, onResume) => {
        pending.set(checkpointId, { conversationId, messageId, blockId, onResume });
        const b = content.find((x) => x.id === blockId);
        if (b) b.checkpoint = { checkpoint_id: checkpointId, requires, status: 'pending' };
      },
    });

    void (async () => {
      cancelled.delete(messageId);
      ch.push({
        type: 'message_start',
        message_id: messageId,
        conversation_id: conversationId,
        run_id: newId('run_'),
        persona: null,
      });
      let stop: 'end_turn' | 'paused' | 'cancelled' | 'error' = 'end_turn';
      try {
        await sleep(Math.min(latency, 400));
        await body(writer);
        if (writer.paused) stop = 'paused';
      } catch (error) {
        if (error instanceof MockStop) stop = error.reason === 'cancelled' ? 'cancelled' : 'cancelled';
        else {
          stop = 'error';
          ch.push({
            type: 'error',
            error_type: 'mock_error',
            message: error instanceof Error ? error.message : String(error),
            retry_after: null,
          });
        }
      }
      if (signal.aborted) {
        ch.close();
        return;
      }
      assistant!.stop_reason = stop;
      const title = firstTurn && stop !== 'cancelled' ? titleFrom(prompt) : null;
      if (title) conv.summary.title = title;
      conv.summary.updated_at = now();
      save();
      ch.push({ type: 'message_delta', usage: { input_tokens: 120 + prompt.length, output_tokens: 80 } });
      ch.push({ type: 'message_stop', message_id: messageId, model: 'claude-sonnet-5', title, stop_reason: stop });
      ch.close();
    })();

    return ch;
  }

  return {
    reset() {
      db.clear();
      pending.clear();
      seed();
      save();
    },

    async createConversation() {
      await sleep(latency);
      const id = newId('conv_');
      const summary: ConversationSummary = {
        conversation_id: id,
        title: 'New chat',
        created_at: now(),
        updated_at: now(),
        archived: false,
      };
      db.set(id, { summary, messages: [] });
      save();
      return bootstrap(summary);
    },

    async listConversations() {
      await sleep(latency);
      return [...db.values()]
        .filter((c) => c.messages.length > 0)
        .map((c) => ({ ...c.summary }))
        .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
    },

    async getConversation(id) {
      await sleep(latency);
      const c = get(id);
      return { ...bootstrap(c.summary), messages: structuredClone(c.messages) };
    },

    async updateConversation(id, patch) {
      await sleep(latency);
      const c = get(id);
      if (typeof patch.title === 'string') c.summary.title = patch.title.slice(0, 200);
      if (typeof patch.archived === 'boolean') c.summary.archived = patch.archived;
      c.summary.updated_at = now();
      save();
      return { ...c.summary };
    },

    async deleteConversation(id) {
      await sleep(latency);
      db.delete(id);
      save();
    },

    sendMessage(conversationId, body: SendMessageBody, { signal }) {
      const conv = get(conversationId);
      if (body.message.type === 'hitl') {
        const { checkpoint_id, decision } = body.message.content;
        const p = pending.get(checkpoint_id);
        if (!p || p.conversationId !== conversationId) {
          return run(conversationId, newId('msg_'), signal, false, '', async (w) => {
            await w.error('checkpoint_not_found', 'That decision is no longer waiting.');
          });
        }
        pending.delete(checkpoint_id);
        conv.messages.push({
          message_id: newId('msg_'),
          conversation_id: conversationId,
          role: 'user',
          type: 'hitl',
          content: { checkpoint_id, decision },
          created_at: now(),
        });
        const assistant = conv.messages.find((m) => m.message_id === p.messageId);
        const block = (assistant?.content as ContentBlock[] | undefined)?.find((b) => b.id === p.blockId);
        if (block?.checkpoint && typeof block.checkpoint === 'object') {
          block.checkpoint = { ...(block.checkpoint as object), status: 'resolved', decision: decision as HitlDecision };
        }
        return run(conversationId, p.messageId, signal, false, '', (w) => p.onResume(w, decision));
      }

      const prompt = body.message.content.default;
      const firstTurn = !conv.messages.some((m) => m.role === 'user');
      conv.messages.push({
        message_id: newId('msg_'),
        conversation_id: conversationId,
        role: 'user',
        content: [{ id: newId('blk_'), type: 'text', category: 'content', text: prompt }],
        attachments: body.attachments,
        created_at: now(),
      });
      const scenario = scenarios.find((s) => s.match(prompt)) ?? DEFAULT_SCENARIOS[DEFAULT_SCENARIOS.length - 1]!;
      return run(conversationId, newId('msg_'), signal, firstTurn, prompt, (w) => scenario.run(w, prompt));
    },

    async cancelMessage(_conversationId, messageId): Promise<CancelResult> {
      await sleep(Math.min(latency, 100));
      cancelled.add(messageId);
      return { status: true };
    },
  };
}
