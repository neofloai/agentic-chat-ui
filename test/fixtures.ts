import type {
  ChatAdapter,
  ConversationBootstrap,
  ConversationDetail,
  ConversationSummary,
  SendMessageBody,
  StreamEvent,
} from '../src/core';

/** The schema doc's own examples, as event sequences. */
export const normalTurn: StreamEvent[] = [
  { type: 'message_start', message_id: 'q4ne0gpb53', conversation_id: 'h8k2mfa931', run_id: '9dxk271fma', persona: null },
  { type: 'status', label: 'Searching invoices…' },
  { type: 'content_block_start', index: 0, block: { id: 'a82fd1', type: 'text', category: 'content', text: '' } },
  {
    type: 'content_block_delta',
    index: 0,
    delta: { type: 'text_delta', text: "Acme's top three" },
    snapshot: "Acme's top three",
  },
  {
    type: 'content_block_stop',
    index: 0,
    block: { id: 'a82fd1', type: 'text', category: 'content', text: "Acme's top three invoices were…" },
  },
  { type: 'message_delta', usage: { input_tokens: 812, output_tokens: 143, cache_read_input_tokens: 0 } },
  { type: 'message_stop', message_id: 'q4ne0gpb53', model: 'claude-sonnet-5', title: null, stop_reason: 'end_turn' },
];

export const hitlPause: StreamEvent[] = [
  { type: 'message_start', message_id: 'm_hitl', conversation_id: 'c1', run_id: 'r1' },
  { type: 'content_block_start', index: 0, block: { id: 'b_text', type: 'text', category: 'content', text: '' } },
  { type: 'content_block_stop', index: 0, block: { id: 'b_text', type: 'text', category: 'content', text: 'Ready to post.' } },
  {
    type: 'content_block_start',
    index: 1,
    block: { id: 'b_appr', type: 'approval', category: 'hitl', title: 'Post 4 invoices to NetSuite?' },
  },
  {
    type: 'content_block_stop',
    index: 1,
    block: { id: 'b_appr', type: 'approval', category: 'hitl', title: 'Post 4 invoices to NetSuite?' },
  },
  { type: 'checkpoint', checkpoint_id: 'z93hdnf02c', block_index: 1, requires: { kind: 'approve_reject' } },
  { type: 'message_stop', message_id: 'm_hitl', model: null, title: null, stop_reason: 'paused' },
];

/** Resume continues the same message_id and restarts indexes at 0. */
export const hitlResume: StreamEvent[] = [
  { type: 'message_start', message_id: 'm_hitl', conversation_id: 'c1', run_id: 'r2' },
  { type: 'content_block_start', index: 0, block: { id: 'b_after', type: 'text', category: 'content', text: '' } },
  {
    type: 'content_block_delta',
    index: 0,
    delta: { type: 'text_delta', text: 'Posted all four.' },
    snapshot: 'Posted all four.',
  },
  { type: 'content_block_stop', index: 0, block: { id: 'b_after', type: 'text', category: 'content', text: 'Posted all four.' } },
  { type: 'message_stop', message_id: 'm_hitl', model: null, title: 'Acme posting', stop_reason: 'end_turn' },
];

export const bootstrap = (id = 'h8k2mfa931'): ConversationBootstrap => ({
  conversation_id: id,
  title: 'New chat',
  subtitle: 'Ask Neo',
  archived: false,
  sources: [{ id: 'search_v2', enabled: true, meta: { search_v2_chunk_size: 10 } }],
  created_at: '2026-09-21T09:12:00Z',
  updated_at: '2026-09-21T09:12:00Z',
  greeting: 'Hey! What can I help you dig into today?',
  suggested_prompts: [{ label: 'Open invoices', prompt: 'Summarize open invoices for Acme Corp' }],
  model: ['claude-sonnet-5', 'claude-opus-5'],
});

export const summary = (id: string, title: string, updated = '2026-09-21T09:01:00Z'): ConversationSummary => ({
  conversation_id: id,
  title,
  created_at: '2026-09-17T14:32:00Z',
  updated_at: updated,
  archived: false,
});

export const detail = (id = 'h8k2mfa931'): ConversationDetail => ({
  conversation_id: id,
  title: 'Acme Q3 invoice review',
  archived: false,
  sources: [{ id: 'search_v2', enabled: true, meta: { search_v2_chunk_size: 10 } }],
  created_at: '2026-09-17T14:32:00Z',
  updated_at: '2026-09-17T15:01:12Z',
  messages: [
    {
      message_id: 'p3md9fna42',
      conversation_id: id,
      role: 'user',
      content: [{ id: 'u0', type: 'text', category: 'content', text: "What were Acme's top open invoices last quarter?" }],
      created_at: '2026-09-17T14:32:00Z',
    },
    {
      message_id: 'q4ne0gpb53',
      conversation_id: id,
      role: 'assistant',
      content: [{ id: 'a0', type: 'text', category: 'content', text: "Acme's top three open invoices last quarter were…" }],
      stop_reason: 'end_turn',
      created_at: '2026-09-17T14:32:04Z',
    },
  ],
});

/** A push-driven stream so tests control exactly when each event arrives. */
export class ControlledStream {
  private queue: StreamEvent[] = [];
  private pending: { resolve: (r: IteratorResult<StreamEvent>) => void; reject: (e: unknown) => void }[] = [];
  private done = false;
  private failure: unknown;

  constructor(signal: AbortSignal) {
    signal.addEventListener('abort', () => this.fail(signal.reason ?? new DOMException('Aborted', 'AbortError')));
  }

  push(...events: StreamEvent[]) {
    for (const e of events) {
      const p = this.pending.shift();
      if (p) p.resolve({ value: e, done: false });
      else this.queue.push(e);
    }
  }

  end() {
    this.done = true;
    for (const p of this.pending.splice(0)) p.resolve({ value: undefined as never, done: true });
  }

  fail(error: unknown) {
    this.failure = error;
    for (const p of this.pending.splice(0)) p.reject(error);
  }

  async *iterate(): AsyncGenerator<StreamEvent> {
    for (;;) {
      if (this.queue.length) {
        yield this.queue.shift()!;
        continue;
      }
      if (this.failure) throw this.failure;
      if (this.done) return;
      const next = await new Promise<IteratorResult<StreamEvent>>((resolve, reject) => {
        this.pending.push({ resolve, reject });
      });
      if (next.done) return;
      yield next.value;
    }
  }
}

export interface FakeAdapter extends ChatAdapter {
  streams: ControlledStream[];
  bodies: SendMessageBody[];
  cancels: { conversationId: string; messageId: string }[];
  created: number;
  lastStream(): ControlledStream;
}

export function createFakeAdapter(overrides: Partial<ChatAdapter> = {}): FakeAdapter {
  let n = 0;
  const adapter: FakeAdapter = {
    streams: [],
    bodies: [],
    cancels: [],
    created: 0,
    lastStream() {
      const s = this.streams[this.streams.length - 1];
      if (!s) throw new Error('no stream started');
      return s;
    },
    async createConversation() {
      adapter.created++;
      return bootstrap(`conv_${++n}`);
    },
    async listConversations() {
      return [summary('h8k2mfa931', 'Acme Q3 invoice review')];
    },
    async getConversation(id) {
      return detail(id);
    },
    async updateConversation(id, patch) {
      return { ...summary(id, patch.title ?? 'x'), archived: Boolean(patch.archived) };
    },
    async deleteConversation() {},
    sendMessage(_id, body, { signal }) {
      adapter.bodies.push(body);
      const s = new ControlledStream(signal);
      adapter.streams.push(s);
      return s.iterate();
    },
    async cancelMessage(conversationId, messageId) {
      adapter.cancels.push({ conversationId, messageId });
      return { status: true };
    },
    ...overrides,
  };
  return adapter;
}

export const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

/** Waits until `fn` stops throwing (or times out). */
export async function until(fn: () => void, timeout = 1000): Promise<void> {
  const start = Date.now();
  for (;;) {
    try {
      fn();
      return;
    } catch (error) {
      if (Date.now() - start > timeout) throw error;
      await tick(5);
    }
  }
}
