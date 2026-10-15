import type {
  CancelResult,
  ChatConfig,
  ConnectionState,
  ContentBlock,
  ConversationBootstrap,
  ConversationDetail,
  ConversationSummary,
  ErrorEnvelope,
  HitlDecision,
  SendMessageBody,
  Source,
  StreamEvent,
  SuggestedPrompt,
  WireMessage,
} from '../core/protocol/types';
import type { ChatAdapter } from '../core/transport/adapter';
import { ChatApiError } from '../core/transport/errors';
import { stripCredentials } from '../core/runtime/config';
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
  /** Model ids. The first is the default. */
  models?: string[];
  /**
   * What `GET /v1/chat/config` returns. Fields you pass replace the demo config's; `null`
   * makes the mock behave like a backend without the config endpoint.
   */
  config?: Partial<ChatConfig> | null;
  /**
   * Connected systems and their status. A prompt that mentions "invoice processing" or
   * "reconnect" fails with 422 `connection_expired` until `invoice_processing` is connected
   * (call `adapter.connect('invoice_processing')`, e.g. from `onConnectionRequired`).
   * @default { invoice_processing: 'expired' }
   */
  connections?: Record<string, ConnectionState>;
  /** Conversations that already exist. */
  seed?: ConversationDetail[];
  /** Keep the mock database in localStorage under this key, so a demo survives reloads. */
  persistKey?: string;
}

export interface MockAdapter extends ChatAdapter {
  getConfig(): Promise<ChatConfig | null>;
  /** Clears the database and reloads the seed. */
  reset(): void;
  /** Marks a connected system as connected, as a backend would after `PUT /v1/connections/{id}`. */
  connect(sourceId: string): void;
}

interface StoredConversation {
  summary: ConversationSummary;
  messages: WireMessage[];
  sources?: Source[];
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

/** A non-2xx response with the standard error envelope. */
function apiError(status: number, type: string, message: string, details?: Record<string, unknown>): ChatApiError {
  const body: ErrorEnvelope = {
    error: { type, message, retry_after: null, request_id: newId('req_'), details: details ?? null },
  };
  return new ChatApiError(status, message, body);
}

/** Fails on the first read, the way a fetch rejected before the stream opened does. */
function failedStream(error: unknown): AsyncIterable<StreamEvent> {
  return {
    [Symbol.asyncIterator]: () => ({
      next: () => Promise.reject(error),
    }),
  };
}

const CONNECTION_PROMPT = /reconnect|invoice processing/i;

/**
 * An in-memory backend on the chat standard (schema v1, revision 1.2) with scripted demo turns
 * for every built-in block. Use it to build UI without a server, in tests, and in the public demo.
 */
export function createMockAdapter(options: MockAdapterOptions = {}): MockAdapter {
  const latency = options.latency ?? 250;
  const speed = options.speed ?? 28;
  const scenarios = [...(options.scenarios ?? []), ...(options.includeDefaultScenarios === false ? [] : DEFAULT_SCENARIOS)];
  const models = options.models?.length ? options.models : ['claude-sonnet-5', 'claude-opus-5'];
  const connections: Record<string, ConnectionState> = { invoice_processing: 'expired', ...options.connections };
  const db = new Map<string, StoredConversation>();
  const pending = new Map<string, PendingResume>();
  const cancelled = new Set<string>();

  const sourceList = (): Source[] => [
    { id: 'search_v2', enabled: true, meta: { search_v2_chunk_size: 10 } },
    { id: 'web_search', enabled: false, meta: {} },
    { id: 'invoice_processing', enabled: false, meta: { connection: { status: connections.invoice_processing ?? 'missing' } } },
  ];

  const config: ChatConfig = {
    protocol_version: '1.2',
    product: { id: 'demo', name: 'Neoflo demo' },
    capabilities: {
      hitl: true,
      attachments: true,
      workflow_context: true,
      archive: true,
      cancel: 'server',
      per_turn_model: true,
      per_turn_sources: true,
      conversation_pagination: false,
      message_pagination: false,
      stream_resume: false,
    },
    models: models.map((id, i) => ({
      id,
      label: id.replace(/^claude-/, 'Claude ').replace(/-/g, ' '),
      ...(i === 0 ? { default: true } : {}),
    })),
    sources: [
      { id: 'search_v2', label: 'Knowledge base', description: 'Your workspace’s documents', default_enabled: true, meta: {} },
      { id: 'web_search', label: 'Web search', default_enabled: false, meta: {} },
      { id: 'invoice_processing', label: 'Invoice processing', default_enabled: false, meta: {} },
    ],
    workflows: [],
    limits: { max_message_chars: 100_000, max_attachments: 10, max_attachment_bytes: 25 * 1024 * 1024, attachment_types: [] },
    ...options.config,
  };

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
    if (!c) throw apiError(404, 'not_found', 'This conversation no longer exists.');
    return c;
  };

  const conversation = (c: StoredConversation) => ({
    ...c.summary,
    selected_model: c.summary.selected_model ?? models[0]!,
    subtitle: 'Ask Neo',
    sources: c.sources ?? sourceList(),
    message_count: c.messages.length,
  });

  const bootstrap = (c: StoredConversation): ConversationBootstrap => ({
    ...conversation(c),
    greeting: options.greeting ?? 'Hey! What can I help you dig into today?',
    suggested_prompts: options.suggestedPrompts ?? DEFAULT_SUGGESTIONS,
  });

  function run(
    conversationId: string,
    messageId: string,
    signal: AbortSignal,
    firstTurn: boolean,
    prompt: string,
    body: (writer: ReturnType<typeof createWriter>) => Promise<void>,
    user?: { messageId: string; clientMessageId?: string },
    model?: string,
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
        user_message_id: user?.messageId ?? null,
        client_message_id: user?.clientMessageId ?? null,
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
            error_type: 'internal',
            message: error instanceof Error ? error.message : String(error),
            retry_after: null,
            request_id: newId('req_'),
            details: null,
          });
        }
      }
      if (signal.aborted) {
        // A disconnect saves the partial reply as cancelled.
        assistant!.stop_reason = 'cancelled';
        save();
        ch.close();
        return;
      }
      assistant!.stop_reason = stop;
      const title = firstTurn && stop !== 'cancelled' ? titleFrom(prompt) : null;
      if (title) conv.summary.title = title;
      conv.summary.updated_at = now();
      save();
      ch.push({ type: 'message_delta', usage: { input_tokens: 120 + prompt.length, output_tokens: 80 } });
      ch.push({ type: 'message_stop', message_id: messageId, model: model ?? models[0]!, title, stop_reason: stop });
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

    connect(sourceId) {
      connections[sourceId] = 'connected';
    },

    async getConfig() {
      await sleep(Math.min(latency, 100));
      if (options.config === null) return null;
      // Connection status in the config is a hint; conversations carry the live value.
      return {
        ...structuredClone(config),
        sources: config.sources.map((s) =>
          s.id in connections ? { ...s, meta: { ...s.meta, connection: { status: connections[s.id]! } } } : s,
        ),
      };
    },

    async createConversation() {
      await sleep(latency);
      const id = newId('conv_');
      const stored: StoredConversation = {
        summary: {
          conversation_id: id,
          title: 'New chat',
          created_at: now(),
          updated_at: now(),
          archived: false,
          selected_model: models[0]!,
        },
        messages: [],
      };
      db.set(id, stored);
      save();
      return bootstrap(stored);
    },

    async listConversations() {
      await sleep(latency);
      return [...db.values()]
        .filter((c) => c.messages.length > 0)
        .map((c) => ({
          ...c.summary,
          selected_model: c.summary.selected_model ?? models[0]!,
          message_count: c.messages.length,
        }))
        .sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
    },

    async getConversation(id) {
      await sleep(latency);
      const c = get(id);
      return { ...conversation(c), messages: structuredClone(c.messages) };
    },

    async updateConversation(id, patch) {
      await sleep(latency);
      const c = get(id);
      if (typeof patch.title === 'string') c.summary.title = patch.title.slice(0, 200);
      if (typeof patch.archived === 'boolean') c.summary.archived = patch.archived;
      if (typeof patch.model === 'string') {
        if (!models.includes(patch.model)) {
          throw apiError(422, 'invalid_request', `Unknown model "${patch.model}".`, { field: 'model' });
        }
        c.summary.selected_model = patch.model;
      }
      // Settings only: anything that looks like a credential never comes back.
      if (Array.isArray(patch.sources)) c.sources = stripCredentials(patch.sources);
      c.summary.updated_at = now();
      save();
      return conversation(c);
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

      // Inputs the config turns off are refused, never silently ignored.
      for (const [field, on] of [
        ['attachments', config.capabilities.attachments],
        ['workflow_context', config.capabilities.workflow_context],
      ] as const) {
        const value = body[field];
        if (on === false && Array.isArray(value) && value.length) {
          return failedStream(
            apiError(422, 'unsupported_feature', `This chat doesn't take ${field.replace('_', ' ')}.`, { field }),
          );
        }
      }
      const prompt = body.message.content.default;
      const clientMessageId = body.client_message_id;
      if (clientMessageId && conv.messages.some((m) => m.client_message_id === clientMessageId)) {
        return failedStream(apiError(409, 'duplicate_message', 'This message was already sent.'));
      }
      // Checked before the stream opens, as the standard says, so nothing is saved.
      if (CONNECTION_PROMPT.test(prompt) && connections.invoice_processing !== 'connected') {
        return failedStream(
          apiError(422, 'connection_expired', 'Reconnect invoice processing to continue.', { source: 'invoice_processing' }),
        );
      }
      const firstTurn = !conv.messages.some((m) => m.role === 'user');
      const userMessageId = newId('msg_');
      conv.messages.push({
        message_id: userMessageId,
        conversation_id: conversationId,
        role: 'user',
        content: [{ id: newId('blk_'), type: 'text', category: 'content', text: prompt }],
        attachments: body.attachments,
        created_at: now(),
        client_message_id: clientMessageId ?? null,
      });
      const scenario = scenarios.find((s) => s.match(prompt)) ?? DEFAULT_SCENARIOS[DEFAULT_SCENARIOS.length - 1]!;
      return run(
        conversationId,
        newId('msg_'),
        signal,
        firstTurn,
        prompt,
        (w) => scenario.run(w, prompt),
        { messageId: userMessageId, clientMessageId },
        body.model,
      );
    },

    async cancelMessage(_conversationId, messageId): Promise<CancelResult> {
      await sleep(Math.min(latency, 100));
      cancelled.add(messageId);
      return { status: true };
    },
  };
}
